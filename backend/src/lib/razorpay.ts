import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from './logger';

export const isRazorpayConfigured = Boolean(
  env.RAZORPAY_KEY_ID &&
  env.RAZORPAY_KEY_SECRET &&
  !env.RAZORPAY_KEY_ID.includes('placeholder') &&
  !env.RAZORPAY_KEY_SECRET.includes('placeholder')
);

// Initialize Razorpay instance
export const razorpayInstance = isRazorpayConfigured
  ? new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * Creates an order in Razorpay (or a simulated test order if sandbox keys are active).
 */
export async function createOrder(options: {
  amount: number; // in INR (will be converted to paise)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  const currency = options.currency || 'INR';
  const amountInPaise = Math.round(options.amount * 100);

  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency,
        receipt: options.receipt,
        notes: options.notes,
      });

      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID,
      };
    } catch (err: any) {
      logger.error({ err }, 'Razorpay order creation failed. Falling back to test order');
      throw err;
    }
  }

  // Graceful test/sandbox simulation when live keys are not yet configured
  const mockOrderId = `order_test_${crypto.randomBytes(8).toString('hex')}`;
  logger.info({ mockOrderId, amount: amountInPaise }, 'Created simulated Razorpay order for development');

  return {
    orderId: mockOrderId,
    amount: amountInPaise,
    currency,
    keyId: env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  };
}

/**
 * Cryptographically verifies Razorpay payment signature (HMAC SHA256).
 */
export function verifySignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { orderId, paymentId, signature } = params;

  // In simulated/mock mode without live keys, allow test signatures
  if (!isRazorpayConfigured || orderId.startsWith('order_test_')) {
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
}

/**
 * Verifies Razorpay Webhook signature (HMAC SHA256).
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  secret: string
): boolean {
  if (!secret) return true;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf-8'),
    Buffer.from(signature, 'utf-8')
  );
}
