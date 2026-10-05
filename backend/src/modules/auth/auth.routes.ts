import { Router } from 'express';
import { authController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// GET /api/me — Returns current user, role, company profile, subscription
router.get('/me', requireAuth, (req, res, next) => {
  authController.getMe(req, res, next);
});

// PATCH /api/me — Updates user's own profile
router.patch('/me', requireAuth, (req, res, next) => {
  authController.updateMe(req, res, next);
});

// POST /api/onboarding — Completes onboarding (USER or COMPANY)
router.post('/onboarding', requireAuth, (req, res, next) => {
  authController.onboard(req, res, next);
});

// POST /api/register — Signs up user with auto-confirmed email (bypasses rate limit)
router.post('/register', (req, res, next) => {
  authController.register(req, res, next);
});

export default router;
