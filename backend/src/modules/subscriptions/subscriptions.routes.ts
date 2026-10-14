import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller';
import { requireAuth, onlyCompany } from '../../middleware/auth';

const router = Router();

// GET /api/subscriptions/plans — Public listing of business plans
router.get('/plans', subscriptionsController.getPlans);

// GET /api/subscriptions/me — Current company subscription status and usage
router.get('/me', requireAuth, onlyCompany, subscriptionsController.getMySubscription);

// POST /api/subscriptions/upgrade — Upgrade or switch active subscription plan
router.post('/upgrade', requireAuth, onlyCompany, subscriptionsController.upgradeSubscription);

export default router;
