import { Router } from 'express';
import { feedController } from './feed.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();

// GET /api/feed — Public (or optional auth to attach isLiked / handle 'following' tab)
router.get('/', optionalAuth, (req, res, next) => {
  feedController.getFeed(req, res, next);
});

export default router;
