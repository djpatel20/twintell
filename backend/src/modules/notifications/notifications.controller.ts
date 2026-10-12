import { Request, Response, NextFunction } from 'express';
import { notificationsService } from './notifications.service';
import { getNotificationsQuerySchema, notificationIdParamSchema } from './notifications.schema';
import { AppError } from '../../middleware/error-handler';

export class NotificationsController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const query = getNotificationsQuerySchema.parse(req.query);
      const result = await notificationsService.getNotifications(req.user.id, query);

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const result = await notificationsService.getUnreadCount(req.user.id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const { id } = notificationIdParamSchema.parse(req.params);
      const result = await notificationsService.markAsRead(id, req.user.id);

      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
      }

      const result = await notificationsService.markAllAsRead(req.user.id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const notificationsController = new NotificationsController();
