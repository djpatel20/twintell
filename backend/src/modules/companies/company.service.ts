import { prisma } from '../../lib/prisma';
import { CompaniesQueryInput, UpdateCompanyInput } from './company.schema';
import { AppError } from '../../middleware/error-handler';
import { Prisma } from '@prisma/client';

export class CompanyService {
  /**
   * Retrieves paginated companies for the Business Directory.
   */
  async getCompanies(userId: string | null | undefined, query: CompaniesQueryInput) {
    const { category, city, cursor, limit } = query;

    const where: Prisma.CompanyWhereInput = {};

    // 1. Category filter (by slug or UUID)
    if (category && category !== 'ALL') {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
      ];
    }

    // 2. City filter (case-insensitive substring)
    if (city && city.trim()) {
      where.city = {
        contains: city.trim(),
        mode: 'insensitive',
      };
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

    // 4. Query with limit + 1
    const companies = await prisma.company.findMany({
      where,
      orderBy: [{ verified: 'desc' }, { followerCount: 'desc' }, { createdAt: 'desc' }],
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
        _count: {
          select: {
            products: true,
            posts: true,
            followers: true,
          },
        },
      },
    });

    const hasMore = companies.length > limit;
    const items = hasMore ? companies.slice(0, limit) : companies;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    // 5. Batch resolve isFollowing to avoid N+1 query problem
    let followingIds = new Set<string>();
    if (userId && items.length > 0) {
      const companyIds = items.map((c) => c.id);
      const userFollows = await prisma.follow.findMany({
        where: {
          userId,
          companyId: { in: companyIds },
        },
        select: { companyId: true },
      });
      followingIds = new Set(userFollows.map((f) => f.companyId));
    }

    const data = items.map((company) => ({
      ...company,
      isFollowing: userId ? followingIds.has(company.id) : false,
    }));

    return {
      data,
      nextCursor,
    };
  }

  /**
   * Retrieves top trending companies for sidebars.
   */
  async getTrendingCompanies(userId?: string | null, limit = 5) {
    const companies = await prisma.company.findMany({
      orderBy: [{ followerCount: 'desc' }, { verified: 'desc' }],
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        businessType: true,
        city: true,
        state: true,
        verified: true,
        followerCount: true,
      },
    });

    let followingIds = new Set<string>();
    if (userId && companies.length > 0) {
      const companyIds = companies.map((c) => c.id);
      const userFollows = await prisma.follow.findMany({
        where: {
          userId,
          companyId: { in: companyIds },
        },
        select: { companyId: true },
      });
      followingIds = new Set(userFollows.map((f) => f.companyId));
    }

    const data = companies.map((company) => ({
      ...company,
      isFollowing: userId ? followingIds.has(company.id) : false,
    }));

    return { data };
  }

  /**
   * Retrieves full company profile by slug.
   */
  async getCompanyBySlug(slug: string, userId?: string | null) {
    const company = await prisma.company.findUnique({
      where: { slug },
      include: {
        category: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
        _count: {
          select: {
            products: true,
            posts: true,
            followers: true,
          },
        },
      },
    });

    if (!company) {
      throw new AppError('Company profile not found.', 404, 'NOT_FOUND');
    }

    let isFollowing = false;
    if (userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId: company.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    return {
      data: {
        ...company,
        isFollowing,
      },
    };
  }

  /**
   * Retrieves products published by a company.
   */
  async getCompanyProducts(slug: string, cursor?: string, limit = 15) {
    const company = await prisma.company.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!company) {
      throw new AppError('Company not found.', 404, 'NOT_FOUND');
    }

    const where: Prisma.ProductWhereInput = {
      companyId: company.id,
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = { lt: cursorDate };
      }
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        category: true,
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
   * Retrieves posts published by a company.
   */
  async getCompanyPosts(slug: string, userId?: string | null, cursor?: string, limit = 15) {
    const company = await prisma.company.findUnique({
      where: { slug },
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
    });

    if (!company) {
      throw new AppError('Company not found.', 404, 'NOT_FOUND');
    }

    const where: Prisma.PostWhereInput = {
      companyId: company.id,
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = { lt: cursorDate };
      }
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
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

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    // Batch resolve isLiked
    let likedPostIds = new Set<string>();
    if (userId && items.length > 0) {
      const postIds = items.map((p) => p.id);
      const userLikes = await prisma.like.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: { postId: true },
      });
      likedPostIds = new Set(userLikes.map((l) => l.postId));
    }

    const data = items.map((post) => ({
      ...post,
      isLiked: userId ? likedPostIds.has(post.id) : false,
    }));

    return {
      data,
      nextCursor,
    };
  }

  /**
   * Updates authenticated user's company profile.
   */
  async updateCompanyProfile(userId: string, input: UpdateCompanyInput) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new AppError('Company profile not found for this account.', 404, 'NOT_FOUND');
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.businessType !== undefined && { businessType: input.businessType }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId }),
        ...(input.city !== undefined && { city: input.city }),
        ...(input.state !== undefined && { state: input.state }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.yearFounded !== undefined && { yearFounded: input.yearFounded }),
        ...(input.logoUrl !== undefined && { logoUrl: input.logoUrl }),
        ...(input.coverUrl !== undefined && { coverUrl: input.coverUrl }),
      },
      include: {
        category: true,
      },
    });

    return {
      data: updated,
    };
  }

  /**
   * Idempotently follows a company and increments followerCount atomically.
   */
  async followCompany(userId: string, companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found.', 404, 'NOT_FOUND');
    }

    if (company.userId === userId) {
      throw new AppError('You cannot follow your own company profile.', 400, 'BAD_REQUEST');
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          userId_companyId: { userId, companyId },
        },
      });

      if (!existing) {
        await tx.follow.create({
          data: { userId, companyId },
        });

        await tx.company.update({
          where: { id: companyId },
          data: { followerCount: { increment: 1 } },
        });
      }
    });

    return {
      success: true,
      isFollowing: true,
    };
  }

  /**
   * Idempotently unfollows a company and decrements followerCount atomically.
   */
  async unfollowCompany(userId: string, companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError('Company not found.', 404, 'NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.follow.findUnique({
        where: {
          userId_companyId: { userId, companyId },
        },
      });

      if (existing) {
        await tx.follow.delete({
          where: {
            userId_companyId: { userId, companyId },
          },
        });

        await tx.company.update({
          where: { id: companyId },
          data: {
            followerCount: {
              decrement: 1,
            },
          },
        });
      }
    });

    return {
      success: true,
      isFollowing: false,
    };
  }
}

export const companyService = new CompanyService();
