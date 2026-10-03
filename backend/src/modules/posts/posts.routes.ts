import { Router } from 'express';
import { postsController } from './posts.controller';
import { requireAuth, optionalAuth, onlyCompany } from '../../middleware/auth';
import { checkPostLimit } from '../../middleware/check-limit';

const router = Router();

// POST /api/posts — Company only + check subscription post limit
router.post('/', requireAuth, onlyCompany, checkPostLimit, (req, res, next) => {
  postsController.createPost(req, res, next);
});

// GET /api/posts/:id — Public (optionalAuth for isLiked)
router.get('/:id', optionalAuth, (req, res, next) => {
  postsController.getPostById(req, res, next);
});

// DELETE /api/posts/:id — Company owner only
router.delete('/:id', requireAuth, onlyCompany, (req, res, next) => {
  postsController.deletePost(req, res, next);
});

// POST /api/posts/:id/like — Authenticated users (idempotent like)
router.post('/:id/like', requireAuth, (req, res, next) => {
  postsController.likePost(req, res, next);
});

// DELETE /api/posts/:id/like — Authenticated users (idempotent unlike)
router.delete('/:id/like', requireAuth, (req, res, next) => {
  postsController.unlikePost(req, res, next);
});

// GET /api/posts/:id/comments — Public (cursor pagination)
router.get('/:id/comments', (req, res, next) => {
  postsController.getComments(req, res, next);
});

// POST /api/posts/:id/comments — Authenticated users
router.post('/:id/comments', requireAuth, (req, res, next) => {
  postsController.createComment(req, res, next);
});

export default router;
