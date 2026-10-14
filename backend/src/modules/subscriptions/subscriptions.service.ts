import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error-handler';
import { UpgradeSubscriptionInput } from './subscriptions.schema';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionsService {
  /**
   * Retrieves all available business subscription plans.
   */
  async getPlans() {
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
   * Upgrades or switches the company's active subscription plan.
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
        message: `Successfully upgraded to ${targetPlan.name} plan!`,
      },
    };
  }
}

export const subscriptionsService = new SubscriptionsService();
