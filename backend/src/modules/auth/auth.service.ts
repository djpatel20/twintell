import { prisma } from '../../lib/prisma';
import { supabaseAdmin } from '../../lib/supabase';
import { AppError } from '../../middleware/error-handler';
import { OnboardingInput, UpdateMeInput, RegisterInput } from './auth.schema';
import { Role } from '@prisma/client';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export class AuthService {
  /**
   * Retrieves the current user profile, role, and company details (if COMPANY).
   */
  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: {
          include: {
            category: true,
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    return {
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        headline: user.headline,
        bio: user.bio,
        city: user.city,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
              slug: user.company.slug,
              logoUrl: user.company.logoUrl,
              coverUrl: user.company.coverUrl,
              businessType: user.company.businessType,
              categoryId: user.company.categoryId,
              category: user.company.category,
              city: user.company.city,
              state: user.company.state,
              description: user.company.description,
              tags: user.company.tags,
              yearFounded: user.company.yearFounded,
              verified: user.company.verified,
              followerCount: user.company.followerCount,
              subscription: user.company.subscription
                ? {
                    status: user.company.subscription.status,
                    plan: {
                      code: user.company.subscription.plan.code,
                      name: user.company.subscription.plan.name,
                      postsPerMonth: user.company.subscription.plan.postsPerMonth,
                      productsLimit: user.company.subscription.plan.productsLimit,
                    },
                  }
                : null,
            }
          : null,
      },
    };
  }

  /**
   * Updates user's own profile fields (name, headline, bio, city, avatarUrl).
   */
  async updateMe(userId: string, data: UpdateMeInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.headline !== undefined && { headline: data.headline }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.city !== undefined && { city: data.city }),
      },
      include: {
        company: true,
      },
    });

    return {
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        avatarUrl: updatedUser.avatarUrl,
        role: updatedUser.role,
        headline: updatedUser.headline,
        bio: updatedUser.bio,
        city: updatedUser.city,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Completes onboarding by setting role (USER or COMPANY).
   * Enforces role immutability and creates Company + Free Plan Subscription in a single transaction.
   */
  async onboard(userId: string, input: OnboardingInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new AppError('User not found.', 404, 'NOT_FOUND');
    }

    // Role is strictly immutable once set
    if (user.role !== null) {
      throw new AppError('Role has already been set and cannot be changed.', 400, 'ROLE_ALREADY_SET');
    }

    if (input.role === Role.USER) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: Role.USER },
      });
    } else if (input.role === Role.COMPANY) {
      const companyData = input.company;

      // Generate a unique slug
      let baseSlug = slugify(companyData.name) || 'company';
      let uniqueSlug = baseSlug;
      let counter = 1;

      while (await prisma.company.findUnique({ where: { slug: uniqueSlug } })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Execute in a single atomic Prisma transaction
      await prisma.$transaction(async (tx) => {
        // 1. Find the default FREE plan
        let freePlan = await tx.plan.findFirst({
          where: { code: 'FREE' },
        });

        if (!freePlan) {
          // Fallback or create if not present
          freePlan = await tx.plan.create({
            data: {
              code: 'FREE',
              name: 'Free Plan',
              priceMonthly: 0,
              isActive: true,
            },
          });
        }

        // 2. Create the Company profile
        const newCompany = await tx.company.create({
          data: {
            userId: user.id,
            name: companyData.name,
            slug: uniqueSlug,
            businessType: companyData.businessType,
            categoryId: companyData.categoryId || null,
            city: companyData.city,
            state: companyData.state,
            description: companyData.description || null,
            logoUrl: companyData.logoUrl || null,
            coverUrl: companyData.coverUrl || null,
            tags: companyData.tags || [],
            yearFounded: companyData.yearFounded || null,
            verified: false,
            followerCount: 0,
          },
        });

        // 3. Create active subscription with FREE plan
        await tx.subscription.create({
          data: {
            companyId: newCompany.id,
            planId: freePlan.id,
            status: 'ACTIVE',
          },
        });

        // 4. Update User role to COMPANY
        await tx.user.update({
          where: { id: userId },
          data: { role: Role.COMPANY },
        });
      });
    }

    return this.getMe(userId);
  }

  /**
   * Registers a new user with auto-confirmed email using supabaseAdmin.
   * This prevents "over_email_send_rate_limit" and allows immediate sign-in.
   */
  async register(input: RegisterInput) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
        full_name: input.name,
      },
    });

    if (authError || !authData.user) {
      if (
        authError?.message?.toLowerCase().includes('already registered') ||
        authError?.message?.toLowerCase().includes('already been registered')
      ) {
        throw new AppError('An account with this email already exists. Please sign in.', 400, 'USER_EXISTS');
      }
      throw new AppError(authError?.message || 'Failed to create user account.', 400, 'REGISTRATION_FAILED');
    }

    // Provision user in Prisma DB
    const dbUser = await prisma.user.upsert({
      where: { id: authData.user.id },
      create: {
        id: authData.user.id,
        email: input.email,
        name: input.name,
        role: null,
      },
      update: {
        name: input.name,
      },
    });

    return {
      data: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
      },
    };
  }
}

export const authService = new AuthService();
