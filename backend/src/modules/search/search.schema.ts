import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query cannot be empty.')
    .max(100, 'Search query must not exceed 100 characters.'),
  type: z
    .enum(['all', 'companies', 'products', 'posts'])
    .default('all'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(30)),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
