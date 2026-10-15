import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error-handler';
import {
  OverrideSubscriptionInput,
  CreateAdInput,
  UpdateAdInput,
} from './admin.schema';

export async function getAdminStats() {
  const [
    totalCompanies,
    totalUsers,
    totalPosts,
    totalProducts,
    activeAds,
    subscriptions,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.user.count(),
    prisma.post.count(),
    prisma.product.count(),
    prisma.sponsoredAd.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.findMany({
      include: {
        plan: {
          select: { code: true, name: true, priceYearly: true },
        },
      },
    }),
  ]);

  const planBreakdown = {
    FREE: 0,
    PRO: 0,
    ADVERTISING: 0,
    LEAD_GEN: 0,
  };

  let activePaidSubscriptions = 0;
  let estimatedAnnualRevenue = 0;

  for (const sub of subscriptions) {
    const code = sub.plan.code as keyof typeof planBreakdown;
    if (planBreakdown[code] !== undefined) {
      planBreakdown[code]++;
    }
    if (code !== 'FREE' && sub.status === 'ACTIVE') {
      activePaidSubscriptions++;
      estimatedAnnualRevenue += Number(sub.plan.priceYearly) || 0;
    }
  }

  return {
    totalCompanies,
    totalUsers,
    totalPosts,
    totalProducts,
    activePaidSubscriptions,
    activeAds,
    estimatedAnnualRevenue,
    planBreakdown,
  };
}

export async function getCompaniesWithSubscriptions(params: {
  page?: number;
  limit?: number;
  search?: string;
  planCode?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 15));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { city: { contains: params.search, mode: 'insensitive' } },
      { user: { email: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  if (params.planCode) {
    where.subscription = {
      plan: { code: params.planCode },
    };
  }

  const [total, companies] = await Promise.all([
    prisma.company.count({ where }),
    prisma.company.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
        _count: {
          select: {
            posts: true,
            products: true,
            followers: true,
            inquiries: true,
          },
        },
      },
    }),
  ]);

  // Calculate monthly post allowance usage
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const enrichedCompanies = await Promise.all(
    companies.map(async (comp) => {
      const postsThisMonth = await prisma.post.count({
        where: {
          companyId: comp.id,
          createdAt: { gte: startOfMonth },
        },
      });

      return {
        id: comp.id,
        name: comp.name,
        slug: comp.slug,
        logoUrl: comp.logoUrl,
        city: comp.city,
        state: comp.state,
        businessType: comp.businessType,
        verified: comp.verified,
        createdAt: comp.createdAt,
        owner: comp.user,
        stats: {
          totalPosts: comp._count.posts,
          postsThisMonth,
          totalProducts: comp._count.products,
          followers: comp._count.followers,
          inquiries: comp._count.inquiries,
        },
        subscription: comp.subscription
          ? {
              id: comp.subscription.id,
              status: comp.subscription.status,
              currentPeriodStart: comp.subscription.currentPeriodStart,
              currentPeriodEnd: comp.subscription.currentPeriodEnd,
              plan: {
                id: comp.subscription.plan.id,
                code: comp.subscription.plan.code,
                name: comp.subscription.plan.name,
                priceYearly: Number(comp.subscription.plan.priceYearly),
                postsPerMonth: comp.subscription.plan.postsPerMonth,
                productsLimit: comp.subscription.plan.productsLimit,
              },
            }
          : null,
      };
    })
  );

  return {
    data: enrichedCompanies,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function overrideCompanySubscription(
  companyId: string,
  input: OverrideSubscriptionInput
) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new AppError('Company not found', 404, 'NOT_FOUND');
  }

  const targetPlan = await prisma.plan.findUnique({
    where: { code: input.planCode },
  });

  if (!targetPlan) {
    throw new AppError(`Target plan "${input.planCode}" does not exist`, 404, 'PLAN_NOT_FOUND');
  }

  const periodEnd = new Date(Date.now() + (input.periodEndDays || 365) * 86400 * 1000);

  const updatedSubscription = await prisma.subscription.upsert({
    where: { companyId },
    update: {
      planId: targetPlan.id,
      status: input.status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    },
    create: {
      companyId,
      planId: targetPlan.id,
      status: input.status,
      currentPeriodStart: new Date(),
      currentPeriodEnd: periodEnd,
    },
    include: {
      plan: true,
    },
  });

  return {
    message: `Subscription successfully updated to ${targetPlan.name} for company ${company.name}`,
    subscription: updatedSubscription,
  };
}

export async function toggleCompanyVerification(companyId: string) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, name: true, verified: true },
  });

  if (!company) {
    throw new AppError('Company not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: { verified: !company.verified },
    select: { id: true, name: true, verified: true },
  });

  return {
    message: `Verification status updated for ${updated.name}`,
    company: updated,
  };
}

// ---------- In-Feed Advertising Engine ----------

export async function getAdminAds(params?: { status?: string }) {
  const where: any = {};
  if (params?.status) {
    where.status = params.status;
  }

  const ads = await prisma.sponsoredAd.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      company: {
        select: { id: true, name: true, logoUrl: true, slug: true },
      },
    },
  });

  return ads;
}

export async function createAdminAd(input: CreateAdInput) {
  const endDate = new Date(Date.now() + input.durationDays * 86400 * 1000);

  const ad = await prisma.sponsoredAd.create({
    data: {
      title: input.title,
      description: input.description,
      imageUrl: input.imageUrl,
      ctaText: input.ctaText,
      ctaUrl: input.ctaUrl,
      category: input.category || null,
      companyId: input.companyId || null,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate,
    },
    include: {
      company: {
        select: { id: true, name: true, logoUrl: true, slug: true },
      },
    },
  });

  return ad;
}

export async function updateAdminAd(adId: string, input: UpdateAdInput) {
  const existing = await prisma.sponsoredAd.findUnique({
    where: { id: adId },
  });

  if (!existing) {
    throw new AppError('Sponsored ad not found', 404, 'NOT_FOUND');
  }

  const updated = await prisma.sponsoredAd.update({
    where: { id: adId },
    data: input,
    include: {
      company: {
        select: { id: true, name: true, logoUrl: true, slug: true },
      },
    },
  });

  return updated;
}

export async function deleteAdminAd(adId: string) {
  const existing = await prisma.sponsoredAd.findUnique({
    where: { id: adId },
  });

  if (!existing) {
    throw new AppError('Sponsored ad not found', 404, 'NOT_FOUND');
  }

  await prisma.sponsoredAd.delete({
    where: { id: adId },
  });

  return { message: 'Sponsored ad successfully deleted' };
}

// ---------- Promote User to Admin ----------

export async function promoteUserToAdmin(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(`User with email "${email}" not found. User must register first.`, 404, 'NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' },
    select: { id: true, name: true, email: true, role: true },
  });

  return {
    message: `User ${updated.name} (${updated.email}) is now an ADMIN.`,
    user: updated,
  };
}
