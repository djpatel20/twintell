import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { updateMeSchema, onboardingSchema } from './auth.schema';
import { AppError } from '../../middleware/error-handler';

export class AuthController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const result = await authService.getMe(req.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const validatedData = updateMeSchema.parse(req.body);
      const result = await authService.updateMe(req.user.id, validatedData);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async onboard(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const validatedData = onboardingSchema.parse(req.body);
      const result = await authService.onboard(req.user.id, validatedData);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
