import { Router } from 'express';
import { companyController } from './company.controller';
import { requireAuth, optionalAuth, onlyCompany } from '../../middleware/auth';

const router = Router();

// GET /api/companies — Lists companies for directory with cursor pagination & category/city filtering
router.get('/', optionalAuth, (req, res, next) => {
  companyController.getCompanies(req, res, next);
});

// GET /api/companies/trending — Lists top trending companies
router.get('/trending', optionalAuth, (req, res, next) => {
  companyController.getTrendingCompanies(req, res, next);
});

// PATCH /api/companies/me — Company owner edits their own company profile
router.patch('/me', requireAuth, onlyCompany, (req, res, next) => {
  companyController.updateMyCompany(req, res, next);
});

// POST /api/companies/:id/follow — Authenticated users follow a company
router.post('/:id/follow', requireAuth, (req, res, next) => {
  companyController.followCompany(req, res, next);
});

// DELETE /api/companies/:id/follow — Authenticated users unfollow a company
router.delete('/:id/follow', requireAuth, (req, res, next) => {
  companyController.unfollowCompany(req, res, next);
});

// GET /api/companies/:slug — Retrieves full company profile by slug
router.get('/:slug', optionalAuth, (req, res, next) => {
  companyController.getCompanyBySlug(req, res, next);
});

// GET /api/companies/:slug/products — Retrieves products of a company
router.get('/:slug/products', (req, res, next) => {
  companyController.getCompanyProducts(req, res, next);
});

// GET /api/companies/:slug/posts — Retrieves posts published by a company
router.get('/:slug/posts', optionalAuth, (req, res, next) => {
  companyController.getCompanyPosts(req, res, next);
});

export default router;
