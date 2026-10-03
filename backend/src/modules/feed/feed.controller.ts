import { Request, Response, NextFunction } from 'express';
import { feedQuerySchema } from './feed.schema';
import { feedService } from './feed.service';

export class FeedController {
  async getFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = feedQuerySchema.parse(req.query);
      const userId = req.user?.id;

      const result = await feedService.getFeed(userId, validatedQuery);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const feedController = new FeedController();
