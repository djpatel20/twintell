import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service';
import { searchQuerySchema } from './search.schema';

export class SearchController {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = searchQuerySchema.parse(req.query);
      const result = await searchService.search(validatedQuery);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const searchController = new SearchController();
