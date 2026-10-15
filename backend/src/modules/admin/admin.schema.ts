import { z } from 'zod';

export const overrideSubscriptionSchema = z.object({
  planCode: z.enum(['FREE', 'PRO', 'ADVERTISING', 'LEAD_GEN']),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']).optional().default('ACTIVE'),
  periodEndDays: z.number().int().positive().optional().default(365),
});

export const createAdSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  description: z.string().min(5, 'Description must be at least 5 characters').max(300),
  imageUrl: z.string().url('A valid image URL is required'),
  ctaText: z.string().min(2).max(30).default('Learn More'),
  ctaUrl: z.string().url('A valid destination URL is required'),
  category: z.string().optional(),
  companyId: z.string().uuid().optional(),
  durationDays: z.number().int().positive().default(30),
});

export const updateAdSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  description: z.string().min(5).max(300).optional(),
  imageUrl: z.string().url().optional(),
  ctaText: z.string().min(2).max(30).optional(),
  ctaUrl: z.string().url().optional(),
  category: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'EXPIRED']).optional(),
});

export const promoteUserSchema = z.object({
  email: z.string().email('Valid email address required'),
});

export type OverrideSubscriptionInput = z.infer<typeof overrideSubscriptionSchema>;
export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;
export type PromoteUserInput = z.infer<typeof promoteUserSchema>;
