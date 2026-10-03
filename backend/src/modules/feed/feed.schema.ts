import { z } from 'zod';
import { PostTopic } from '@prisma/client';

export const feedQuerySchema = z.object({
  tab: z.enum(['for-you', 'following', 'trending']).default('for-you'),
  topic: z
    .string()
    .optional()
    .transform((val) => (val === 'ALL' || !val ? undefined : val))
    .pipe(z.nativeEnum(PostTopic).optional()),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 15))
    .pipe(z.number().min(1).max(50)),
});

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;
