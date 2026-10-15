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

// GET /api/categories/top-sectors — Returns top active industry sectors with real database counts
router.get('/top-sectors', async (req, res, next) => {
  try {
    const limit = req.query.limit
      ? Math.min(10, Math.max(1, parseInt(req.query.limit as string, 10)))
      : 5;

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            companies: true,
            products: true,
          },
        },
      },
    });

    const sorted = categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        companyCount: cat._count.companies,
        productCount: cat._count.products,
      }))
      .sort((a, b) => b.companyCount + b.productCount - (a.companyCount + a.productCount))
      .slice(0, limit);

    return res.status(200).json({ data: sorted });
  } catch (error) {
    next(error);
  }
});

export default router;
