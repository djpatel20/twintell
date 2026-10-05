import { prisma } from '../../lib/prisma';
import { CreateInquiryInput, InquiriesQueryInput } from './inquiries.schema';
import { AppError } from '../../middleware/error-handler';
import { Prisma } from '@prisma/client';

export class InquiriesService {
  /**
   * Creates a business inquiry from an authenticated user to a company.
   */
  async createInquiry(userId: string, input: CreateInquiryInput) {
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { id: true, userId: true, name: true },
    });

    if (!company) {
      throw new AppError('Target company not found.', 404, 'NOT_FOUND');
    }

    if (company.userId === userId) {
      throw new AppError('You cannot submit an inquiry to your own company.', 400, 'BAD_REQUEST');
    }

    if (input.productId) {
      const product = await prisma.product.findUnique({
        where: { id: input.productId },
        select: { id: true, companyId: true },
      });

      if (!product || product.companyId !== input.companyId) {
        throw new AppError('Selected product does not exist for this company.', 404, 'NOT_FOUND');
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        userId,
        companyId: input.companyId,
        productId: input.productId || null,
        message: input.message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            priceUnit: true,
            moq: true,
          },
        },
      },
    });

    return {
      data: inquiry,
      message: 'Inquiry submitted successfully.',
    };
  }

  /**
   * Retrieves all inquiries received by the authenticated company.
   */
  async getCompanyInquiries(companyId: string, query: InquiriesQueryInput) {
    const { cursor, limit = 20 } = query;

    const where: Prisma.InquiryWhereInput = {
      companyId,
    };

    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = {
          lt: cursorDate,
        };
      }
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            headline: true,
            city: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
            images: true,
            price: true,
            priceUnit: true,
            moq: true,
          },
        },
      },
    });

    const hasMore = inquiries.length > limit;
    const items = hasMore ? inquiries.slice(0, limit) : inquiries;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].createdAt.toISOString() : null;

    return {
      data: items,
      nextCursor,
    };
  }
}

export const inquiriesService = new InquiriesService();
