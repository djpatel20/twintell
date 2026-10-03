import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import { AppError } from './error-handler';
import { Role } from '@prisma/client';
import { logger } from '../lib/logger';

export interface AuthUser {
  id: string;
  email: string;
  role: Role | null;
  name: string;
  companyId?: string | null;
}

// Extend Express Request interface to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser | null;
    }
  }
}

/**
 * Extracts Bearer token, verifies with Supabase Auth, and resolves or provisions Prisma User.
 */
async function resolveUserFromToken(token: string): Promise<AuthUser | null> {
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) {
    logger.warn({ authError: authError?.message || 'No user returned from Supabase' }, 'Supabase auth token verification failed');
    return null;
  }

  let dbUser = await prisma.user.findUnique({
    where: { id: authData.user.id },
    include: {
      company: {
        select: { id: true },
      },
    },
  });

  // First-time user provisioning: create Prisma user with role: null
  if (!dbUser) {
    const rawEmail = authData.user.email || '';
    const metadataName =
      authData.user.user_metadata?.full_name ||
      authData.user.user_metadata?.name ||
      rawEmail.split('@')[0] ||
      'User';

    const avatarUrl = authData.user.user_metadata?.avatar_url || null;

    dbUser = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: rawEmail,
        name: metadataName,
        avatarUrl,
        role: null, // User must choose role in /onboarding
      },
      include: {
        company: {
          select: { id: true },
        },
      },
    });
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    name: dbUser.name,
    companyId: dbUser.company?.id || null,
  };
}

/**
 * Middleware: Requires a valid Supabase Bearer token.
 * Throws 401 UNAUTHORIZED if token is missing or invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Missing or invalid Bearer token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const user = await resolveUserFromToken(token);

    if (!user) {
      throw new AppError('Invalid or expired authentication token.', 401, 'UNAUTHORIZED');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware: Optional authentication.
 * If Bearer token is present and valid, attaches user to req.user.
 * If token is absent or invalid, sets req.user = null and continues without error.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const user = await resolveUserFromToken(token);
    req.user = user;
    next();
  } catch {
    req.user = null;
    next();
  }
}

/**
 * Middleware: Requires the user to have COMPANY role.
 * Must be preceded by requireAuth.
 */
export function onlyCompany(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  }

  if (req.user.role !== 'COMPANY' || !req.user.companyId) {
    return next(
      new AppError('Forbidden: This action is only permitted for registered Company accounts.', 403, 'FORBIDDEN')
    );
  }

  next();
}
