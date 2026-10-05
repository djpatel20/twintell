import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from './error-handler';

/**
 * Middleware: Checks if the company has reached its monthly post limit based on active Subscription plan.
 * Must be preceded by requireAuth and onlyCompany.
 */
export async function checkPostLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return next(new AppError('Company account required to verify post limit.', 403, 'FORBIDDEN'));
    }

    // 1. Fetch current subscription and associated plan
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    // If no subscription or plan has no post limit (null = unlimited, like FREE plan)
    if (!subscription || subscription.plan.postsPerMonth === null) {
      return next();
    }

    const limit = subscription.plan.postsPerMonth;

    // 2. Count posts created within the current period
    const periodStart = subscription.currentPeriodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const postCount = await prisma.post.count({
      where: {
        companyId,
        createdAt: { gte: periodStart },
      },
    });

    if (postCount >= limit) {
      return next(
        new AppError(
          `Monthly post limit of ${limit} reached for your ${subscription.plan.name} plan. Upgrade to unlock more posts.`,
          403,
          'PLAN_LIMIT_REACHED'
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Checks if the company has reached its product catalogue limit based on active Subscription plan.
 * Must be preceded by requireAuth and onlyCompany.
 */
export async function checkProductLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return next(new AppError('Company account required to verify product limit.', 403, 'FORBIDDEN'));
    }

    // 1. Fetch current subscription and associated plan
    const subscription = await prisma.subscription.findUnique({
      where: { companyId },
      include: { plan: true },
    });

    // If no subscription or plan has no product limit (null = unlimited)
    if (!subscription || subscription.plan.productsLimit === null) {
      return next();
    }

    const limit = subscription.plan.productsLimit;

    // 2. Count total products currently listed by this company
    const productCount = await prisma.product.count({
      where: { companyId },
    });

    if (productCount >= limit) {
      return next(
        new AppError(
          `Product listing limit of ${limit} reached for your ${subscription.plan.name} plan. Upgrade to list more products.`,
          403,
          'PLAN_LIMIT_REACHED'
        )
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}
