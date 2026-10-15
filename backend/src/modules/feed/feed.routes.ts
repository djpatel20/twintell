import { Router } from 'express';
import { feedController } from './feed.controller';
import { optionalAuth } from '../../middleware/auth';

const router = Router();

// GET /api/feed/ads — Public endpoint to fetch active in-feed sponsored ads
router.get('/ads', (req, res, next) => {
  feedController.getActiveAds(req, res, next);
});

// GET /api/feed — Public (or optional auth to attach isLiked / handle 'following' tab)
router.get('/', optionalAuth, (req, res, next) => {
  feedController.getFeed(req, res, next);
});

export default router;
