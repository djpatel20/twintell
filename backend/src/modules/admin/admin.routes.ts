import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth';
import { env } from '../../config/env';
import { AppError } from '../../middleware/error-handler';
import * as adminController from './admin.controller';

const router = Router();

// Middleware: Allows either an existing ADMIN session or a valid x-admin-key header
function allowAdminOrSecret(req: Request, res: Response, next: NextFunction) {
  const secretKey = req.headers['x-admin-key'];
  if (secretKey && secretKey === env.ADMIN_SECRET) {
    return next();
  }

  // Otherwise, fallback to standard requireAuth + requireAdmin
  requireAuth(req, res, (authErr) => {
    if (authErr) return next(authErr);
    requireAdmin(req, res, next);
  });
}

// 1. Promote a user to ADMIN (Protected by ADMIN session or ADMIN_SECRET)
router.post('/promote-user', allowAdminOrSecret, adminController.promoteUserHandler);

// 2. Platform Stats & Metrics
router.get('/stats', requireAuth, requireAdmin, adminController.getStatsHandler);

// 3. Company & Subscription Management
router.get('/companies', requireAuth, requireAdmin, adminController.getCompaniesHandler);
router.post('/companies/:id/subscription', requireAuth, requireAdmin, adminController.overrideSubscriptionHandler);
router.post('/companies/:id/verify', requireAuth, requireAdmin, adminController.toggleVerificationHandler);

// 4. In-Feed Ads Management
router.get('/ads', requireAuth, requireAdmin, adminController.getAdsHandler);
router.post('/ads', requireAuth, requireAdmin, adminController.createAdHandler);
router.patch('/ads/:id', requireAuth, requireAdmin, adminController.updateAdHandler);
router.delete('/ads/:id', requireAuth, requireAdmin, adminController.deleteAdHandler);

// 5. Content Moderation (Posts & Products)
router.get('/moderation/posts', requireAuth, requireAdmin, adminController.getModerationPostsHandler);
router.delete('/moderation/posts/:id', requireAuth, requireAdmin, adminController.deleteModerationPostHandler);
router.get('/moderation/products', requireAuth, requireAdmin, adminController.getModerationProductsHandler);
router.delete('/moderation/products/:id', requireAuth, requireAdmin, adminController.deleteModerationProductHandler);

export default router;
