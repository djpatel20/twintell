import { prisma } from '../../lib/prisma';
import { CreateProductInput, UpdateProductInput, ProductsQueryInput } from './products.schema';
import { AppError } from '../../middleware/error-handler';
import { Prisma } from '@prisma/client';

export class ProductsService {
  /**
   * Retrieves paginated products catalog with category and company details.
   */
  async getProducts(query: ProductsQueryInput) {
    const { category, companyId, cursor, limit } = query;

    const where: Prisma.ProductWhereInput = {};

    // 1. Company filter
    if (companyId) {
      where.companyId = companyId;
    }

    // 2. Category filter (safe UUID vs slug check)
    if (category && category !== 'ALL') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
      if (isUuid) {
        where.OR = [
          { categoryId: category },
          { category: { slug: category } },
        ];
      } else {
        where.category = { slug: category };
      }
    }

    // 3. Cursor pagination
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = {
          lt: cursorDate,
        };
      }
    }

    // 4. Query
    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            businessType: true,
            city: true,
            state: true,
            verified: true,
          },
        },
      },
    });

    const hasMore = products.length > limit;
    const items = hasMore ? products.slice(0, limit) : products;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      data: items,
      nextCursor,
    };
  }

  /**
   * Retrieves single product by ID with full specifications and supplier details.
   */
  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            coverUrl: true,
            businessType: true,
            city: true,
            state: true,
            description: true,
            verified: true,
            followerCount: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    return {
      data: product,
    };
  }

  /**
   * Creates a new product for an authenticated company.
   */
  async createProduct(companyId: string, input: CreateProductInput) {
    const product = await prisma.product.create({
      data: {
        companyId,
        title: input.title,
        description: input.description,
        price: input.price,
        priceUnit: input.priceUnit,
        moq: input.moq,
        images: input.images,
        tags: input.tags,
        material: input.material,
        sizes: input.sizes,
        usage: input.usage,
        categoryId: input.categoryId || undefined,
      },
      include: {
        category: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            businessType: true,
            city: true,
            state: true,
            verified: true,
          },
        },
      },
    });

    return {
      data: product,
    };
  }

  /**
   * Updates an existing product belonging to the authenticated company.
   */
  async updateProduct(productId: string, companyId: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    if (existing.companyId !== companyId) {
      throw new AppError('You can only edit products belonging to your own company.', 403, 'FORBIDDEN');
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.priceUnit !== undefined && { priceUnit: input.priceUnit }),
        ...(input.moq !== undefined && { moq: input.moq }),
        ...(input.images !== undefined && { images: input.images }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.material !== undefined && { material: input.material }),
        ...(input.sizes !== undefined && { sizes: input.sizes }),
        ...(input.usage !== undefined && { usage: input.usage }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId || undefined }),
      },
      include: {
        category: true,
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            businessType: true,
            city: true,
            state: true,
            verified: true,
          },
        },
      },
    });

    return {
      data: updated,
    };
  }

  /**
   * Deletes a product belonging to the authenticated company.
   */
  async deleteProduct(productId: string, companyId: string) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      throw new AppError('Product not found.', 404, 'NOT_FOUND');
    }

    if (existing.companyId !== companyId) {
      throw new AppError('You can only delete products belonging to your own company.', 403, 'FORBIDDEN');
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return {
      message: 'Product deleted successfully.',
    };
  }
}

export const productsService = new ProductsService();
