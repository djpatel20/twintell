import { z } from 'zod';

export const getNotificationsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(50)),
  unreadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid notification ID format.' }),
});

export type GetNotificationsQueryInput = z.infer<typeof getNotificationsQuerySchema>;
export type NotificationIdParamInput = z.infer<typeof notificationIdParamSchema>;
