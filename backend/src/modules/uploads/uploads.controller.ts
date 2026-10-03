import { Request, Response, NextFunction } from 'express';
import { signUploadSchema } from './uploads.schema';
import { uploadsService } from './uploads.service';
import { AppError } from '../../middleware/error-handler';

export class UploadsController {
  async getSignedUrl(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const validatedInput = signUploadSchema.parse(req.body);
      const result = await uploadsService.getSignedUploadUrl(req.user.id, validatedInput);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadsController = new UploadsController();
