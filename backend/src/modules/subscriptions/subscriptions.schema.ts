import { z } from 'zod';

export const upgradeSubscriptionSchema = z.object({
  planCode: z.enum(['FREE', 'PRO', 'ADVERTISING', 'LEAD_GEN'], {
    required_error: 'Plan code is required.',
    invalid_type_error: 'Invalid plan selection.',
  }),
});

export type UpgradeSubscriptionInput = z.infer<typeof upgradeSubscriptionSchema>;
