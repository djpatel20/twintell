import { Router } from 'express';
import { productsController } from './products.controller';
import { requireAuth, onlyCompany } from '../../middleware/auth';
import { checkProductLimit } from '../../middleware/check-limit';

const router = Router();

// GET /api/products — Public listing with cursor pagination & category filter
router.get('/', (req, res, next) => {
  productsController.getProducts(req, res, next);
});

// GET /api/products/:id — Public product details
router.get('/:id', (req, res, next) => {
  productsController.getProductById(req, res, next);
});

// POST /api/products — Company only + check subscription product limit
router.post('/', requireAuth, onlyCompany, checkProductLimit, (req, res, next) => {
  productsController.createProduct(req, res, next);
});

// PATCH /api/products/:id — Company owner only
router.patch('/:id', requireAuth, onlyCompany, (req, res, next) => {
  productsController.updateProduct(req, res, next);
});

// DELETE /api/products/:id — Company owner only
router.delete('/:id', requireAuth, onlyCompany, (req, res, next) => {
  productsController.deleteProduct(req, res, next);
});

export default router;
