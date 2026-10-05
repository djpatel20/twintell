import { Router } from 'express';
import { searchController } from './search.controller';

const router = Router();

// GET /api/search — Public multi-entity case-insensitive search
router.get('/', (req, res, next) => {
  searchController.search(req, res, next);
});

export default router;
