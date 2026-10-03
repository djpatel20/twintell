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
