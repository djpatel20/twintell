import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  ADMIN_SECRET: z.string().default('twintell-admin-secret-key-2026'),
  RAZORPAY_KEY_ID: z.string().optional().default(process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key'),
  RAZORPAY_KEY_SECRET: z.string().optional().default(process.env.RAZORPAY_KEY_SECRET || 'rzp_test_placeholder_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(process.env.RAZORPAY_WEBHOOK_SECRET || ''),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
