import { z } from 'zod';
import { Role } from '@prisma/client';

export const updateMeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').nullable().optional(),
  headline: z.string().max(120, 'Headline cannot exceed 120 characters').nullable().optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').nullable().optional(),
  city: z.string().max(100).nullable().optional(),
});

export const onboardingSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal(Role.USER),
  }),
  z.object({
    role: z.literal(Role.COMPANY),
    company: z.object({
      name: z.string().min(2, 'Company name must be at least 2 characters').max(150),
      businessType: z.string().min(2, 'Business type is required').max(100), // e.g. Manufacturer, Supplier, Wholesaler
      categoryId: z.string().uuid('Valid category ID is required').optional(),
      city: z.string().min(2, 'City is required').max(100),
      state: z.string().min(2, 'State is required').max(100),
      description: z.string().max(1000).optional(),
      logoUrl: z.string().url().optional().or(z.literal('')),
      coverUrl: z.string().url().optional().or(z.literal('')),
      tags: z.array(z.string().min(1)).max(10).optional().default([]),
      yearFounded: z
        .number()
        .int()
        .min(1800)
        .max(new Date().getFullYear())
        .optional(),
    }),
  }),
]);

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
