import { z } from 'zod';

export const companiesQuerySchema = z.object({
  category: z.string().optional(),
  city: z.string().optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 15))
    .pipe(z.number().min(1).max(50)),
});

export const companySlugParamSchema = z.object({
  slug: z.string().min(1, 'Company slug is required.'),
});

export const companyIdParamSchema = z.object({
  id: z.string().uuid('Invalid company ID format.'),
});

export const updateCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters.').max(100).optional(),
  businessType: z.string().min(2, 'Business type must be at least 2 characters.').max(50).optional(),
  categoryId: z.string().uuid('Invalid category ID format.').nullable().optional(),
  city: z.string().min(2, 'City must be at least 2 characters.').max(50).optional(),
  state: z.string().min(2, 'State must be at least 2 characters.').max(50).optional(),
  description: z.string().max(1000, 'Description must not exceed 1000 characters.').nullable().optional(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed.').optional(),
  yearFounded: z
    .number()
    .int()
    .min(1800, 'Year founded must be valid.')
    .max(new Date().getFullYear(), 'Year founded cannot be in the future.')
    .nullable()
    .optional(),
  logoUrl: z.string().url('Invalid logo URL format.').nullable().optional(),
  coverUrl: z.string().url('Invalid cover URL format.').nullable().optional(),
});

export type CompaniesQueryInput = z.infer<typeof companiesQuerySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
