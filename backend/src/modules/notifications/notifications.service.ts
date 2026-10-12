import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/error-handler';
import { Prisma, NotificationType } from '@prisma/client';
import { GetNotificationsQueryInput } from './notifications.schema';
import { emitNotificationToUser } from '../../lib/socket';

export class NotificationsService {
  /**
   * Retrieves paginated notifications for the authenticated user.
   */
  async getNotifications(userId: string, query: GetNotificationsQueryInput) {
    const { cursor, limit, unreadOnly } = query;

    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = {
          lt: cursorDate,
        };
      }
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                verified: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            images: true,
          },
        },
      },
    });

    const hasMore = notifications.length > limit;
    const items = hasMore ? notifications.slice(0, limit) : notifications;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      data: items,
      nextCursor,
    };
  }

  /**
   * Retrieves count of unread notifications for navbar badge.
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Marks a specific notification as read.
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Notification not found.', 404, 'NOT_FOUND');
    }

    if (notification.userId !== userId) {
      throw new AppError('You do not have access to this notification.', 403, 'FORBIDDEN');
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return { data: updated };
  }

  /**
   * Marks all notifications as read for the user.
   */
  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { message: 'All notifications marked as read.' };
  }

  /**
   * Creates a notification in the database and broadcasts via Socket.io.
   */
  async createAndDispatchNotification(data: {
    userId: string;
    actorId: string;
    type: NotificationType;
    postId?: string;
  }) {
    // Don't notify oneself
    if (data.userId === data.actorId) {
      return null;
    }

    // Check if an identical notification already occurred recently (debounce / idempotency within last 24h)
    const existing = await prisma.notification.findFirst({
      where: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId || null,
        createdAt: {
          gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existing) {
      return existing;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId || null,
      },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            company: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
                verified: true,
              },
            },
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            images: true,
          },
        },
      },
    });

    // Real-time dispatch via pure Socket.io
    emitNotificationToUser(data.userId, notification);

    return notification;
  }
}

export const notificationsService = new NotificationsService();
