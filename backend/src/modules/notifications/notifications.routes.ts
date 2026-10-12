import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// All notification endpoints require authenticated user
router.use(requireAuth);

router.get('/', (req, res, next) => notificationsController.getNotifications(req, res, next));
router.get('/unread-count', (req, res, next) => notificationsController.getUnreadCount(req, res, next));
router.patch('/read-all', (req, res, next) => notificationsController.markAllAsRead(req, res, next));
router.patch('/:id/read', (req, res, next) => notificationsController.markAsRead(req, res, next));

export default router;
