import { Request, Response, NextFunction } from 'express';
import { subscriptionsService } from './subscriptions.service';
import {
  upgradeSubscriptionSchema,
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from './subscriptions.schema';
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
   * POST /api/subscriptions/create-order (Company only)
   * Generates Razorpay order for paid plan subscriptions
   */
  async createPaymentOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      if (!companyId || !userId) {
        throw new AppError('Company profile required to create subscription order.', 403, 'FORBIDDEN');
      }

      const parsed = createPaymentOrderSchema.parse(req.body);
      const result = await subscriptionsService.createPaymentOrder(companyId, userId, parsed);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions/verify-payment (Company only)
   * Cryptographically verifies signature and activates plan
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      if (!companyId || !userId) {
        throw new AppError('Company profile required to verify payment.', 403, 'FORBIDDEN');
      }

      const parsed = verifyPaymentSchema.parse(req.body);
      const result = await subscriptionsService.verifyPayment(companyId, userId, parsed);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions/razorpay-webhook (Public webhook)
   * Asynchronous Razorpay server-to-server webhook notification
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers['x-razorpay-signature'] as string) || '';
      const result = await subscriptionsService.handleWebhook(req.body, signature);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/subscriptions/upgrade (Direct upgrade for free plan or administrative override)
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
