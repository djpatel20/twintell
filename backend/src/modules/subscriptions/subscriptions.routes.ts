import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller';
import { requireAuth, onlyCompany } from '../../middleware/auth';

const router = Router();

// GET /api/subscriptions/plans — Public listing of business plans
router.get('/plans', subscriptionsController.getPlans);

// GET /api/subscriptions/me — Current company subscription status and usage
router.get('/me', requireAuth, onlyCompany, subscriptionsController.getMySubscription);

// POST /api/subscriptions/create-order — Creates Razorpay order for paid plan
router.post('/create-order', requireAuth, onlyCompany, subscriptionsController.createPaymentOrder);

// POST /api/subscriptions/verify-payment — Verifies HMAC signature and activates plan
router.post('/verify-payment', requireAuth, onlyCompany, subscriptionsController.verifyPayment);

// POST /api/subscriptions/razorpay-webhook — Asynchronous server-to-server Razorpay webhook
router.post('/razorpay-webhook', subscriptionsController.handleWebhook);

// POST /api/subscriptions/upgrade — Direct upgrade for free plan or administrative switch
router.post('/upgrade', requireAuth, onlyCompany, subscriptionsController.upgradeSubscription);

export default router;
