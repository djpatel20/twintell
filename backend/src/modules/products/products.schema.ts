import { z } from 'zod';

export const createProductSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Product title must be at least 2 characters.')
    .max(150, 'Product title must not exceed 150 characters.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters.')
    .nullable()
    .optional(),
  price: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    }),
  priceUnit: z
    .string()
    .trim()
    .max(30, 'Price unit must not exceed 30 characters.')
    .nullable()
    .optional(),
  moq: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === null || val === undefined || val === '') return null;
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) ? null : num;
    }),
  images: z
    .array(z.string().url('Invalid image URL format.'))
    .max(6, 'A maximum of 6 images can be attached per product.')
    .default([]),
  tags: z
    .array(z.string().trim())
    .max(10, 'A maximum of 10 tags can be specified.')
    .default([]),
  material: z.string().trim().max(100).nullable().optional(),
  sizes: z.string().trim().max(100).nullable().optional(),
  usage: z.string().trim().max(150).nullable().optional(),
  categoryId: z.string().uuid('Invalid category ID format.').nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productIdParamSchema = z.object({
  id: z.string().uuid('Invalid product ID format.'),
});

export const productsQuerySchema = z.object({
  category: z.string().optional(),
  companyId: z.string().uuid().optional(),
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 15))
    .pipe(z.number().min(1).max(50)),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductsQueryInput = z.infer<typeof productsQuerySchema>;
