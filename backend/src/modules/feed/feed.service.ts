import { prisma } from '../../lib/prisma';
import { FeedQueryInput } from './feed.schema';
import { AppError } from '../../middleware/error-handler';
import { Prisma } from '@prisma/client';

export class FeedService {
  /**
   * Retrieves paginated feed posts with company info and user-specific like status.
   */
  async getFeed(userId: string | null | undefined, query: FeedQueryInput) {
    const { tab, topic, cursor, limit } = query;

    const where: Prisma.PostWhereInput = {};

    // 1. Topic filtering
    if (topic) {
      where.topic = topic;
    }

    // 2. Tab filtering
    if (tab === 'following') {
      if (!userId) {
        throw new AppError('You must be logged in to view your Following feed.', 401, 'UNAUTHORIZED');
      }
      // Posts from companies that the current user follows
      where.company = {
        followers: {
          some: {
            userId,
          },
        },
      };
    }

    // 3. Cursor pagination (createdAt < cursor)
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = {
          lt: cursorDate,
        };
      }
    }

    // 4. Determine ordering
    const orderBy: Prisma.PostOrderByWithRelationInput[] =
      tab === 'trending'
        ? [{ likeCount: 'desc' }, { commentCount: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    // Fetch limit + 1 items to determine if a next cursor exists
    const posts = await prisma.post.findMany({
      where,
      orderBy,
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

    // 5. Batch resolve isLiked to avoid N+1 query problem
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

    // 6. Shape output
    const data = items.map((post) => ({
      id: post.id,
      companyId: post.companyId,
      content: post.content,
      images: post.images,
      topic: post.topic,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      company: post.company,
      isLiked: userId ? likedPostIds.has(post.id) : false,
    }));

    return {
      data,
      nextCursor,
    };
  }
}

export const feedService = new FeedService();
