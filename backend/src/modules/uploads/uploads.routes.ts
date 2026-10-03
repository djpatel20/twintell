import { Router } from 'express';
import { uploadsController } from './uploads.controller';
import { requireAuth } from '../../middleware/auth';

const router = Router();

// POST /api/uploads/sign — Generates signed upload URL for browser upload to Supabase Storage
router.post('/sign', requireAuth, (req, res, next) => {
  uploadsController.getSignedUrl(req, res, next);
});

export default router;
