import { prisma } from '../../lib/prisma';
import { CreatePostInput, CreateCommentInput } from './posts.schema';
import { AppError } from '../../middleware/error-handler';
import { Prisma } from '@prisma/client';

export class PostsService {
  /**
   * Creates a new post for an authenticated company.
   */
  async createPost(companyId: string, input: CreatePostInput) {
    const post = await prisma.post.create({
      data: {
        companyId,
        content: input.content,
        images: input.images,
        topic: input.topic,
      },
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

    return {
      data: {
        ...post,
        isLiked: false,
      },
    };
  }

  /**
   * Retrieves a single post with company details and user's like status.
   */
  async getPostById(postId: string, userId?: string | null) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
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

    if (!post) {
      throw new AppError('Post not found.', 404, 'NOT_FOUND');
    }

    let isLiked = false;
    if (userId) {
      const like = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      isLiked = !!like;
    }

    return {
      data: {
        ...post,
        isLiked,
      },
    };
  }

  /**
   * Deletes a post belonging to the authenticated company.
   */
  async deletePost(postId: string, companyId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Post not found.', 404, 'NOT_FOUND');
    }

    if (post.companyId !== companyId) {
      throw new AppError('You can only delete posts published by your own company.', 403, 'FORBIDDEN');
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return {
      message: 'Post deleted successfully.',
    };
  }

  /**
   * Idempotently likes a post and increments likeCount atomically.
   */
  async likePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Post not found.', 404, 'NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      const existingLike = await tx.like.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      });

      if (!existingLike) {
        await tx.like.create({
          data: { userId, postId },
        });

        await tx.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        });
      }
    });

    return {
      success: true,
      isLiked: true,
    };
  }

  /**
   * Idempotently unlikes a post and decrements likeCount atomically.
   */
  async unlikePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Post not found.', 404, 'NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      const existingLike = await tx.like.findUnique({
        where: {
          userId_postId: { userId, postId },
        },
      });

      if (existingLike) {
        await tx.like.delete({
          where: {
            userId_postId: { userId, postId },
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likeCount: {
              decrement: 1,
            },
          },
        });
      }
    });

    return {
      success: true,
      isLiked: false,
    };
  }

  /**
   * Retrieves comments on a post with cursor pagination.
   */
  async getComments(postId: string, cursor?: string, limit = 20) {
    const postExists = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!postExists) {
      throw new AppError('Post not found.', 404, 'NOT_FOUND');
    }

    const where: Prisma.CommentWhereInput = { postId };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = {
          lt: cursorDate,
        };
      }
    }

    const comments = await prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            company: {
              select: {
                name: true,
                slug: true,
                logoUrl: true,
                verified: true,
              },
            },
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      data: items,
      nextCursor,
    };
  }

  /**
   * Adds a comment to a post and increments commentCount atomically.
   */
  async createComment(postId: string, userId: string, input: CreateCommentInput) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Post not found.', 404, 'NOT_FOUND');
    }

    const comment = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          postId,
          userId,
          content: input.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
              company: {
                select: {
                  name: true,
                  slug: true,
                  logoUrl: true,
                  verified: true,
                },
              },
            },
          },
        },
      });

      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      });

      return newComment;
    });

    return {
      data: comment,
    };
  }
}

export const postsService = new PostsService();
