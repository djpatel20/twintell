import { z } from 'zod';
import { PostTopic } from '@prisma/client';

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Post content cannot be empty.')
    .max(3000, 'Post content must not exceed 3000 characters.'),
  images: z
    .array(z.string().url('Invalid image URL format.'))
    .max(4, 'A maximum of 4 images can be attached per post.')
    .default([]),
  topic: z.nativeEnum(PostTopic, {
    errorMap: () => ({ message: 'Please select a valid post topic category.' }),
  }),
});

export const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty.')
    .max(1000, 'Comment must not exceed 1000 characters.'),
});

export const postIdParamSchema = z.object({
  id: z.string().uuid('Invalid post ID format.'),
});

export const commentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(50)),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
