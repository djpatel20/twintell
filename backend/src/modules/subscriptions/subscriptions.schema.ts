import { z } from 'zod';

export const upgradeSubscriptionSchema = z.object({
  planCode: z.enum(['FREE', 'PRO', 'ADVERTISING', 'LEAD_GEN'], {
    required_error: 'Plan code is required.',
    invalid_type_error: 'Invalid plan selection.',
  }),
});

export const createPaymentOrderSchema = z.object({
  planCode: z.enum(['FREE', 'PRO', 'ADVERTISING', 'LEAD_GEN'], {
    required_error: 'Plan code is required.',
  }),
  billingCycle: z.enum(['YEARLY', 'MONTHLY']).default('YEARLY'),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Payment signature is required'),
  planCode: z.enum(['FREE', 'PRO', 'ADVERTISING', 'LEAD_GEN']),
  billingCycle: z.enum(['YEARLY', 'MONTHLY']).default('YEARLY'),
});

export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>;
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
