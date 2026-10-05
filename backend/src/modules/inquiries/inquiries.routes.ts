import { Router } from 'express';
import { inquiriesController } from './inquiries.controller';
import { requireAuth, onlyCompany } from '../../middleware/auth';

const router = Router();

// POST /api/inquiries — Authenticated users send inquiries ("Contact Supplier")
router.post('/', requireAuth, (req, res, next) => {
  inquiriesController.createInquiry(req, res, next);
});

// GET /api/inquiries — Company only: view received inquiries
router.get('/', requireAuth, onlyCompany, (req, res, next) => {
  inquiriesController.getCompanyInquiries(req, res, next);
});

export default router;
