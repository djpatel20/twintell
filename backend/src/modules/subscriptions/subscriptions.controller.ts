import { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from './subscriptions.service';
import { upgradeSubscriptionSchema } from './subscriptions.schema';
import { AppError } from '../../middleware/error-handler';

export class SubscriptionsController {
  /**
   * GET /api/subscriptions/plans (Public)
   */
  async getPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await subscriptionsService.getPlans();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/subscriptions/me (Company only)
   */
  async getMySubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Company account required to access subscription details.', 403, 'FORBIDDEN');
      }

      const result = await subscriptionsService.getCurrentSubscription(companyId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions/upgrade (Company only)
   */
  async upgradeSubscription(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      if (!companyId) {
        throw new AppError('Company account required to upgrade subscription.', 403, 'FORBIDDEN');
      }

      const parsed = upgradeSubscriptionSchema.parse(req.body);
      const result = await subscriptionsService.upgradeSubscription(companyId, parsed);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
