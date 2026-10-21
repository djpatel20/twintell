import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error-handler';
import {
  UpgradeSubscriptionInput,
  CreatePaymentOrderInput,
  VerifyPaymentInput,
} from './subscriptions.schema';
import { SubscriptionStatus, PaymentStatus } from '@prisma/client';
import { createOrder, verifySignature, verifyWebhookSignature } from '../../lib/razorpay';
import { env } from '../../config/env';

const DEFAULT_PLANS = [
  {
    code: 'FREE',
    name: 'Free Plan',
    tagline: 'Essential Presence for Getting Started',
    priceYearly: 0,
    priceMonthly: 0,
    postsPerMonth: 3,
    productsLimit: null,
    features: [
      'Create a company profile',
      'List your products',
      'List your business in relevant categories',
      'Publish up to 3 business posts per year.',
    ],
    badge: null,
    isPopular: false,
    isActive: true,
  },
  {
    code: 'PRO',
    name: 'Pro Plan',
    tagline: 'For Active Businesses & Direct Inquiries',
    priceYearly: 1999,
    priceMonthly: 166.58,
    postsPerMonth: 10,
    productsLimit: null,
    features: [
      'Create a company profile',
      'List your products',
      'List your business in relevant categories',
      'Publish up to 10 business posts every month',
      'Receive buyer enquiries',
    ],
    badge: 'Recommended',
    isPopular: true,
    isActive: true,
  },
  {
    code: 'ADVERTISING',
    name: 'Ad Plan',
    tagline: 'Targeted Promotional Placement & Priority Reach',
    priceYearly: 10999,
    priceMonthly: 916.58,
    postsPerMonth: 10,
    productsLimit: null,
    features: [
      'Promote your company with up to 12 ad campaigns per year.',
      'Show your company logo, product images and details.',
      'Your ad appears between regular posts in the feed.',
      'Your ad appears between posts in your selected business category.',
      'Add a Visit Company button.',
      'Add an Enquire Now button to receive buyer enquiries.',
    ],
    badge: 'Maximum Reach',
    isPopular: false,
    isActive: true,
  },
];

export class SubscriptionsService {
  /**
   * Retrieves all available business subscription plans.
   */
  async getPlans() {
    try {
      for (const p of DEFAULT_PLANS) {
        await prisma.plan.upsert({
          where: { code: p.code },
          update: {
            name: p.name,
            tagline: p.tagline,
            priceYearly: p.priceYearly,
            priceMonthly: p.priceMonthly,
            postsPerMonth: p.postsPerMonth,
            productsLimit: p.productsLimit,
            features: p.features,
            badge: p.badge,
            isPopular: p.isPopular,
            isActive: p.isActive,
          },
          create: p,
        });
      }
      // Ensure legacy plans are inactive
      await prisma.plan.updateMany({
        where: {
          code: { notIn: DEFAULT_PLANS.map((p) => p.code) },
          isActive: true,
        },
        data: { isActive: false },
      });
    } catch {
      // Continue if concurrent sync occurs
    }

    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceYearly: 'asc' },
    });

    return {
      data: plans,
    };
  }

  /**
   * Retrieves current company subscription along with real-time usage metrics.
   */
  async getCurrentSubscription(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company not found.', 404, 'NOT_FOUND');
    }

    let subscription = company.subscription;

    // Fallback if company was created without subscription: assign FREE plan
    if (!subscription) {
      const freePlan = await prisma.plan.findUnique({ where: { code: 'FREE' } });
      if (!freePlan) {
        throw new AppError('Default Starter plan not configured in database.', 500, 'INTERNAL_SERVER_ERROR');
      }

      subscription = await prisma.subscription.create({
        data: {
          companyId,
          planId: freePlan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        include: {
          plan: true,
        },
      });
    }

    const plan = subscription.plan;
    const periodStart = subscription.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // 1. Calculate posts published in current subscription period
    const postsUsed = await prisma.post.count({
      where: {
        companyId,
        createdAt: { gte: periodStart },
      },
    });

    // 2. Calculate products listed by this company
    const productsUsed = await prisma.product.count({
      where: { companyId },
    });

    const postsLimit = plan.postsPerMonth;
    const productsLimit = plan.productsLimit;
    const canPost = postsLimit === null || postsUsed < postsLimit;
    const canListProduct = productsLimit === null || productsUsed < productsLimit;

    // Business Pro & Advertising & Lead Gen include full inquiry desk
    const canReceiveInquiries = true;

    return {
      data: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
        plan: {
          id: plan.id,
          code: plan.code,
          name: plan.name,
          tagline: plan.tagline,
          priceYearly: Number(plan.priceYearly),
          priceMonthly: Number(plan.priceMonthly),
          postsPerMonth: plan.postsPerMonth,
          productsLimit: plan.productsLimit,
          features: plan.features,
          badge: plan.badge,
          isPopular: plan.isPopular,
        },
        usage: {
          postsUsed,
          postsLimit,
          productsUsed,
          productsLimit,
          canPost,
          canListProduct,
          canReceiveInquiries,
        },
      },
    };
  }

  /**
   * Creates a Razorpay order for purchasing a paid subscription plan.
   */
  async createPaymentOrder(companyId: string, userId: string, input: CreatePaymentOrderInput) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { subscription: { include: { plan: true } } },
    });

    if (!company) {
      throw new AppError('Company profile not found.', 404, 'NOT_FOUND');
    }

    const targetPlan = await prisma.plan.findUnique({
      where: { code: input.planCode },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new AppError('The requested plan is inactive or does not exist.', 404, 'NOT_FOUND');
    }

    // Free plan bypasses payment gateway
    if (targetPlan.code === 'FREE') {
      return this.upgradeSubscription(companyId, { planCode: 'FREE' });
    }

    const price = input.billingCycle === 'MONTHLY' ? targetPlan.priceMonthly : targetPlan.priceYearly;
    const amountNum = Number(price);

    if (amountNum <= 0) {
      throw new AppError('Invalid pricing amount for selected plan.', 400, 'BAD_REQUEST');
    }

    const receipt = `rcpt_${companyId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;

    // Create order via Razorpay API or robust simulated test order
    const rzpOrder = await createOrder({
      amount: amountNum,
      currency: 'INR',
      receipt,
      notes: {
        companyId,
        userId,
        planCode: targetPlan.code,
        billingCycle: input.billingCycle,
      },
    });

    // Record pending transaction in database
    await prisma.payment.create({
      data: {
        companyId,
        userId,
        planId: targetPlan.id,
        amount: price,
        currency: rzpOrder.currency,
        gateway: 'RAZORPAY',
        orderId: rzpOrder.orderId,
        status: PaymentStatus.PENDING,
        notes: `Subscription for ${targetPlan.name} (${input.billingCycle})`,
      },
    });

    return {
      data: {
        orderId: rzpOrder.orderId,
        amount: rzpOrder.amount, // in paise
        currency: rzpOrder.currency,
        keyId: rzpOrder.keyId,
        planName: targetPlan.name,
        planCode: targetPlan.code,
        billingCycle: input.billingCycle,
      },
    };
  }

  /**
   * Cryptographically verifies Razorpay payment signature and activates the company subscription atomically.
   */
  async verifyPayment(companyId: string, userId: string, input: VerifyPaymentInput) {
    const { orderId, paymentId, signature, planCode, billingCycle } = input;

    // 1. Verify cryptographic HMAC signature
    const isValid = verifySignature({ orderId, paymentId, signature });

    if (!isValid) {
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: PaymentStatus.FAILED, notes: 'Invalid payment signature.' },
      });
      throw new AppError('Payment signature verification failed. Untrusted transaction.', 400, 'INVALID_SIGNATURE');
    }

    const targetPlan = await prisma.plan.findUnique({
      where: { code: planCode },
    });

    if (!targetPlan) {
      throw new AppError('Target plan not found.', 404, 'NOT_FOUND');
    }

    const termDays = billingCycle === 'MONTHLY' ? 30 : 365;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + termDays * 24 * 60 * 60 * 1000);

    // 2. Atomic Prisma Transaction: update Payment row + activate Subscription
    const [updatedPayment, activeSubscription] = await prisma.$transaction([
      prisma.payment.upsert({
        where: { orderId },
        update: {
          status: PaymentStatus.SUCCESS,
          paymentId,
          signature,
          updatedAt: now,
        },
        create: {
          companyId,
          userId,
          planId: targetPlan.id,
          amount: billingCycle === 'MONTHLY' ? targetPlan.priceMonthly : targetPlan.priceYearly,
          currency: 'INR',
          gateway: 'RAZORPAY',
          orderId,
          paymentId,
          signature,
          status: PaymentStatus.SUCCESS,
        },
      }),
      prisma.subscription.upsert({
        where: { companyId },
        update: {
          planId: targetPlan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          providerRef: paymentId,
        },
        create: {
          companyId,
          planId: targetPlan.id,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          providerRef: paymentId,
        },
        include: { plan: true },
      }),
    ]);

    return {
      data: {
        success: true,
        message: `Payment successful! Your company is now subscribed to ${targetPlan.name}.`,
        subscription: activeSubscription,
        payment: {
          id: updatedPayment.id,
          orderId: updatedPayment.orderId,
          paymentId: updatedPayment.paymentId,
          status: updatedPayment.status,
        },
      },
    };
  }

  /**
   * Webhook handler for asynchronous server-to-server Razorpay events (e.g. payment.captured).
   */
  async handleWebhook(rawBody: string | Buffer, signature: string) {
    const isValid = verifyWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 400, 'UNAUTHORIZED_WEBHOOK');
    }

    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf-8'));
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const payment = await prisma.payment.findUnique({
          where: { orderId },
          include: { plan: true },
        });

        if (payment && payment.status !== PaymentStatus.SUCCESS) {
          const now = new Date();
          const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

          await prisma.$transaction([
            prisma.payment.update({
              where: { orderId },
              data: {
                status: PaymentStatus.SUCCESS,
                paymentId,
                updatedAt: now,
              },
            }),
            prisma.subscription.upsert({
              where: { companyId: payment.companyId! },
              update: {
                planId: payment.planId!,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                providerRef: paymentId,
              },
              create: {
                companyId: payment.companyId!,
                planId: payment.planId!,
                status: SubscriptionStatus.ACTIVE,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                providerRef: paymentId,
              },
            }),
          ]);
        }
      }
    }

    return { received: true };
  }

  /**
   * Upgrades or switches the company's active subscription plan directly (for free tiers/admin).
   */
  async upgradeSubscription(companyId: string, input: UpgradeSubscriptionInput) {
    const targetPlan = await prisma.plan.findUnique({
      where: { code: input.planCode },
    });

    if (!targetPlan || !targetPlan.isActive) {
      throw new AppError('The requested plan is not available or inactive.', 404, 'NOT_FOUND');
    }

    const now = new Date();
    const periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year term

    const updatedSubscription = await prisma.subscription.upsert({
      where: { companyId },
      update: {
        planId: targetPlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        companyId,
        planId: targetPlan.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      include: {
        plan: true,
      },
    });

    return {
      data: {
        subscription: updatedSubscription,
        message: `Successfully updated to ${targetPlan.name} plan!`,
      },
    };
  }
}

export const subscriptionsService = new SubscriptionsService();
