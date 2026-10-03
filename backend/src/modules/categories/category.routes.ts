import { Router } from 'express';
import { prisma } from '../../lib/prisma';

const router = Router();

// GET /api/categories — Returns all categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    next(error);
  }
});

export default router;
