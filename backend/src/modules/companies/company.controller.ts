import { Request, Response, NextFunction } from 'express';
import { companyService } from './company.service';
import {
  companiesQuerySchema,
  companySlugParamSchema,
  companyIdParamSchema,
  updateCompanySchema,
} from './company.schema';
import { AppError } from '../../middleware/error-handler';

export class CompanyController {
  async getCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = companiesQuerySchema.parse(req.query);
      const userId = req.user?.id;

      const result = await companyService.getCompanies(userId, validatedQuery);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTrendingCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const result = await companyService.getTrendingCompanies(userId, isNaN(limit) ? 5 : limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = companySlugParamSchema.parse(req.params);
      const userId = req.user?.id;

      const result = await companyService.getCompanyBySlug(slug, userId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = companySlugParamSchema.parse(req.params);
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

      const result = await companyService.getCompanyProducts(slug, cursor, isNaN(limit) ? 15 : limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = companySlugParamSchema.parse(req.params);
      const userId = req.user?.id;
      const cursor = req.query.cursor as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

      const result = await companyService.getCompanyPosts(slug, userId, cursor, isNaN(limit) ? 15 : limit);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateMyCompany(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY') {
        throw new AppError('Forbidden: Only registered companies can edit company profiles.', 403, 'FORBIDDEN');
      }

      const validatedData = updateCompanySchema.parse(req.body);
      const result = await companyService.updateCompanyProfile(req.user.id, validatedData);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async followCompany(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to follow companies.', 401, 'UNAUTHORIZED');
      }

      const { id } = companyIdParamSchema.parse(req.params);
      const result = await companyService.followCompany(req.user.id, id);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async unfollowCompany(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to unfollow companies.', 401, 'UNAUTHORIZED');
      }

      const { id } = companyIdParamSchema.parse(req.params);
      const result = await companyService.unfollowCompany(req.user.id, id);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const companyController = new CompanyController();
