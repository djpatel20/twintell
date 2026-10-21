import { Router } from 'express';
import { inquiriesController } from './inquiries.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// POST /api/inquiries — Authenticated users send inquiries / start chat thread
router.post('/', requireAuth, (req, res, next) => {
  inquiriesController.createInquiry(req, res, next);
});

// GET /api/inquiries — Authenticated users & companies view their inquiries
router.get('/', requireAuth, (req, res, next) => {
  inquiriesController.getInquiries(req, res, next);
});

// GET /api/inquiries/unread-count — Count of unread incoming inquiries
router.get('/unread-count', requireAuth, (req, res, next) => {
  inquiriesController.getUnreadCount(req, res, next);
});

// GET /api/inquiries/:id — View single inquiry conversation thread & messages
router.get('/:id', requireAuth, (req, res, next) => {
  inquiriesController.getInquiryById(req, res, next);
});

// POST /api/inquiries/:id/messages — Send chat message in ongoing inquiry thread
router.post('/:id/messages', requireAuth, (req, res, next) => {
  inquiriesController.sendMessage(req, res, next);
});

// PATCH /api/inquiries/:id/read — Mark inquiry conversation as read
router.patch('/:id/read', requireAuth, (req, res, next) => {
  inquiriesController.markAsRead(req, res, next);
});

export default router;
