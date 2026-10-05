import { Request, Response, NextFunction } from 'express';
import { inquiriesService } from './inquiries.service';
import { createInquirySchema, inquiriesQuerySchema } from './inquiries.schema';
import { AppError } from '../../middleware/error-handler';

export class InquiriesController {
  async createInquiry(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to submit inquiries.', 401, 'UNAUTHORIZED');
      }

      const validatedData = createInquirySchema.parse(req.body);
      const result = await inquiriesService.createInquiry(req.user.id, validatedData);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getCompanyInquiries(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || req.user.role !== 'COMPANY' || !req.user.companyId) {
        throw new AppError('Forbidden: Only registered company accounts can view received inquiries.', 403, 'FORBIDDEN');
      }

      const validatedQuery = inquiriesQuerySchema.parse(req.query);
      const result = await inquiriesService.getCompanyInquiries(req.user.companyId, validatedQuery);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const inquiriesController = new InquiriesController();
