import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

prisma.$connect()
  .then(() => {
    logger.info('📦 Prisma connected successfully to database');
  })
  .catch((err) => {
    logger.warn({ err }, '⚠️ Prisma initial connection warning (will retry on queries)');
  });

// Keepalive heartbeat ping every 3 minutes to prevent Supabase pooler idle connection drop
const KEEPALIVE_INTERVAL_MS = 3 * 60 * 1000;
setInterval(async () => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
  } catch (err) {
    logger.debug({ err }, 'Prisma keepalive ping failed (will reconnect on next query)');
  }
}, KEEPALIVE_INTERVAL_MS).unref();
