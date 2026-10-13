import { z } from 'zod';

export const createInquirySchema = z.object({
  companyId: z.string().uuid('Invalid company ID format.'),
  productId: z.string().uuid('Invalid product ID format.').nullable().optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Inquiry message must be at least 10 characters long.')
    .max(2000, 'Inquiry message must not exceed 2000 characters.'),
});

export const inquiriesQuerySchema = z.object({
  cursor: z.string().optional(),
  type: z.enum(['all', 'sent', 'received']).optional().default('all'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(50)),
});

export const sendInquiryMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(2000, 'Message must not exceed 2000 characters.'),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type InquiriesQueryInput = z.infer<typeof inquiriesQuerySchema>;
export type SendInquiryMessageInput = z.infer<typeof sendInquiryMessageSchema>;
