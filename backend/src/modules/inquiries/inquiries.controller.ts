import { Request, Response, NextFunction } from 'express';
import { inquiriesService } from './inquiries.service';
import {
  createInquirySchema,
  inquiriesQuerySchema,
  sendInquiryMessageSchema,
} from './inquiries.schema';
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

  async getInquiries(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to view inquiries.', 401, 'UNAUTHORIZED');
      }

      const validatedQuery = inquiriesQuerySchema.parse(req.query);
      const result = await inquiriesService.getInquiries(req.user, validatedQuery);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getInquiryById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to access inquiry details.', 401, 'UNAUTHORIZED');
      }

      const inquiryId = req.params.id;
      if (!inquiryId) {
        throw new AppError('Inquiry ID is required.', 400, 'BAD_REQUEST');
      }

      const result = await inquiriesService.getInquiryById(req.user, inquiryId);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to send chat messages.', 401, 'UNAUTHORIZED');
      }

      const inquiryId = req.params.id;
      if (!inquiryId) {
        throw new AppError('Inquiry ID is required.', 400, 'BAD_REQUEST');
      }

      const validatedData = sendInquiryMessageSchema.parse(req.body);
      const result = await inquiriesService.sendMessage(req.user, inquiryId, validatedData);

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required to view unread message count.', 401, 'UNAUTHORIZED');
      }

      const result = await inquiriesService.getUnreadCount(req.user);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const inquiryId = req.params.id;
      if (!inquiryId) {
        throw new AppError('Inquiry ID is required.', 400, 'BAD_REQUEST');
      }

      const result = await inquiriesService.markAsRead(req.user, inquiryId);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // Alias for backward compatibility
  async getCompanyInquiries(req: Request, res: Response, next: NextFunction) {
    return this.getInquiries(req, res, next);
  }
}

export const inquiriesController = new InquiriesController();
