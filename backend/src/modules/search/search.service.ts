import { prisma } from '../../lib/prisma';
import { SearchQueryInput } from './search.schema';

export class SearchService {
  /**
   * Performs multi-entity case-insensitive search across companies, products, and posts.
   */
  async search(input: SearchQueryInput) {
    const { q, type, limit } = input;
    const term = q.trim();

    const searchCompanies = type === 'all' || type === 'companies';
    const searchProducts = type === 'all' || type === 'products';
    const searchPosts = type === 'all' || type === 'posts';

    const [companies, products, posts] = await Promise.all([
      // 1. Companies search
      searchCompanies
        ? prisma.company.findMany({
            where: {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { city: { contains: term, mode: 'insensitive' } },
                { state: { contains: term, mode: 'insensitive' } },
                { businessType: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { tags: { has: term } },
              ],
            },
            take: limit,
            orderBy: [{ verified: 'desc' }, { followerCount: 'desc' }],
            include: {
              category: {
                select: { id: true, name: true, slug: true, icon: true },
              },
              _count: {
                select: { products: true, posts: true, followers: true },
              },
            },
          })
        : Promise.resolve([]),

      // 2. Products search
      searchProducts
        ? prisma.product.findMany({
            where: {
              OR: [
                { title: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { material: { contains: term, mode: 'insensitive' } },
                { usage: { contains: term, mode: 'insensitive' } },
                { tags: { has: term } },
              ],
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              category: {
                select: { id: true, name: true, slug: true, icon: true },
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
          })
        : Promise.resolve([]),

      // 3. Posts search
      searchPosts
        ? prisma.post.findMany({
            where: {
              content: { contains: term, mode: 'insensitive' },
            },
            take: limit,
            orderBy: [{ likeCount: 'desc' }, { createdAt: 'desc' }],
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
          })
        : Promise.resolve([]),
    ]);

    return {
      data: {
        query: term,
        type,
        totalResults: companies.length + products.length + posts.length,
        companies,
        products,
        posts,
      },
    };
  }
}

export const searchService = new SearchService();
