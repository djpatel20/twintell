import { Request, Response, NextFunction } from 'express';
import { postsService } from './posts.service';
import {
  createPostSchema,
  createCommentSchema,
  postIdParamSchema,
  commentsQuerySchema,
} from './posts.schema';
import { AppError } from '../../middleware/error-handler';

export class PostsController {
  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY' || !req.user.companyId) {
        throw new AppError('Forbidden: Only registered company accounts can create posts.', 403, 'FORBIDDEN');
      }

      const validatedData = createPostSchema.parse(req.body);
      const result = await postsService.createPost(req.user.companyId, validatedData);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = postIdParamSchema.parse(req.params);
      const userId = req.user?.id;

      const result = await postsService.getPostById(id, userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY' || !req.user.companyId) {
        throw new AppError('Forbidden: Only companies can delete their posts.', 403, 'FORBIDDEN');
      }

      const { id } = postIdParamSchema.parse(req.params);
      const result = await postsService.deletePost(id, req.user.companyId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async likePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to like posts.', 401, 'UNAUTHORIZED');
      }

      const { id } = postIdParamSchema.parse(req.params);
      const result = await postsService.likePost(id, req.user.id);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unlikePost(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to unlike posts.', 401, 'UNAUTHORIZED');
      }

      const { id } = postIdParamSchema.parse(req.params);
      const result = await postsService.unlikePost(id, req.user.id);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = postIdParamSchema.parse(req.params);
      const { cursor, limit } = commentsQuerySchema.parse(req.query);

      const result = await postsService.getComments(id, cursor, limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to comment.', 401, 'UNAUTHORIZED');
      }

      const { id } = postIdParamSchema.parse(req.params);
      const validatedData = createCommentSchema.parse(req.body);

      const result = await postsService.createComment(id, req.user.id, validatedData);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const postsController = new PostsController();
