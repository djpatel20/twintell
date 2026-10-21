import { prisma } from '../../lib/prisma';
import { CreateInquiryInput, InquiriesQueryInput, SendInquiryMessageInput } from './inquiries.schema';
import { AppError } from '../../middleware/error-handler';
import { Prisma } from '@prisma/client';
import { AuthUser } from '../../middleware/auth';
import { emitInquiryMessageToUser } from '../../lib/socket';

export class InquiriesService {
  /**
   * Creates a business inquiry / chat thread from an authenticated user to a company.
   * Also seeds the initial predefined message in InquiryMessage.
   */
  async createInquiry(userId: string, input: CreateInquiryInput) {
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!company) {
      throw new AppError('Target company not found.', 404, 'NOT_FOUND');
    }

    if (company.userId === userId) {
      throw new AppError('You cannot submit an inquiry to your own company.', 400, 'BAD_REQUEST');
    }

    // Plan rule: Free plan companies do not have buyer enquiries enabled
    const planCode = company.subscription?.plan?.code || 'FREE';
    if (planCode === 'FREE') {
      throw new AppError(
        'This company is on the Free Plan and cannot receive direct buyer enquiries yet. Direct enquiries are enabled on the Pro Plan and Ad Plan.',
        403,
        'ENQUIRIES_DISABLED_ON_FREE_PLAN'
      );
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

    // Single Prisma transaction: create inquiry and initial message
    const inquiry = await prisma.$transaction(async (tx) => {
      const newInquiry = await tx.inquiry.create({
        data: {
          userId,
          companyId: input.companyId,
          productId: input.productId || null,
          message: input.message,
          status: 'UNREAD_BY_COMPANY',
          messages: {
            create: {
              senderId: userId,
              content: input.message,
            },
          },
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
              logoUrl: true,
              verified: true,
              userId: true,
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
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      return newInquiry;
    });

    // Notify company owner in real time via socket
    emitInquiryMessageToUser(company.userId, {
      inquiryId: inquiry.id,
      message: inquiry.messages[0],
      inquiry,
    });

    return {
      data: inquiry,
      message: 'Inquiry submitted successfully.',
    };
  }

  /**
   * Retrieves inquiries for the authenticated user or company.
   * Supports type: 'all' | 'sent' | 'received'.
   */
  async getInquiries(user: AuthUser, query: InquiriesQueryInput) {
    const { cursor, limit = 20, type = 'all' } = query;

    const where: Prisma.InquiryWhereInput = {};

    if (type === 'sent') {
      where.userId = user.id;
    } else if (type === 'received') {
      if (!user.companyId) {
        return { data: [], nextCursor: null };
      }
      where.companyId = user.companyId;
    } else {
      // 'all'
      if (user.companyId && user.role === 'COMPANY') {
        where.OR = [
          { companyId: user.companyId },
          { userId: user.id },
        ];
      } else {
        where.userId = user.id;
      }
    }

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
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verified: true,
            userId: true,
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
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
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

  /**
   * Retrieves single inquiry conversation thread by ID with all messages.
   */
  async getInquiryById(user: AuthUser, inquiryId: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
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
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            verified: true,
            userId: true,
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
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!inquiry) {
      throw new AppError('Inquiry thread not found.', 404, 'NOT_FOUND');
    }

    // Access check: Only the buyer or company owner can view this inquiry
    const isBuyer = inquiry.userId === user.id;
    const isSupplier = inquiry.company.userId === user.id || (user.companyId && inquiry.companyId === user.companyId);

    if (!isBuyer && !isSupplier) {
      throw new AppError('Forbidden: You do not have permission to access this inquiry conversation.', 403, 'FORBIDDEN');
    }

    // Mark as read for the viewing party
    if (isSupplier && (inquiry.status === 'UNREAD_FOR_COMPANY' || inquiry.status === 'UNREAD_BY_COMPANY' || inquiry.status === 'OPEN')) {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: 'READ' },
      });
      inquiry.status = 'READ';
    } else if (isBuyer && (inquiry.status === 'UNREAD_FOR_USER' || inquiry.status === 'UNREAD_BY_USER')) {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: 'READ' },
      });
      inquiry.status = 'READ';
    }

    return { data: inquiry };
  }

  /**
   * Explicitly marks an inquiry as read by the viewing user / company.
   */
  async markAsRead(user: AuthUser, inquiryId: string) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: {
        id: true,
        userId: true,
        companyId: true,
        status: true,
        company: { select: { userId: true } },
      },
    });

    if (!inquiry) {
      throw new AppError('Inquiry not found.', 404, 'NOT_FOUND');
    }

    const isBuyer = inquiry.userId === user.id;
    const isSupplier = inquiry.company.userId === user.id || (user.companyId && inquiry.companyId === user.companyId);

    if (!isBuyer && !isSupplier) {
      throw new AppError('Forbidden: Access denied to this inquiry.', 403, 'FORBIDDEN');
    }

    if (isSupplier && (inquiry.status === 'UNREAD_FOR_COMPANY' || inquiry.status === 'UNREAD_BY_COMPANY' || inquiry.status === 'OPEN')) {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: 'READ' },
      });
    } else if (isBuyer && (inquiry.status === 'UNREAD_FOR_USER' || inquiry.status === 'UNREAD_BY_USER')) {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: 'READ' },
      });
    }

    return { success: true, inquiryId };
  }

  /**
   * Sends a new chat message in an ongoing inquiry thread.
   */
  async sendMessage(user: AuthUser, inquiryId: string, input: SendInquiryMessageInput) {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      select: {
        id: true,
        userId: true,
        companyId: true,
        company: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new AppError('Inquiry thread not found.', 404, 'NOT_FOUND');
    }

    const isBuyer = inquiry.userId === user.id;
    const isSupplier = inquiry.company.userId === user.id || (user.companyId && inquiry.companyId === user.companyId);

    if (!isBuyer && !isSupplier) {
      throw new AppError('Forbidden: You do not have permission to send messages in this inquiry.', 403, 'FORBIDDEN');
    }

    const nextStatus = isBuyer ? 'UNREAD_FOR_COMPANY' : 'UNREAD_FOR_USER';

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.inquiryMessage.create({
        data: {
          inquiryId,
          senderId: user.id,
          content: input.content,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Update inquiry updatedAt timestamp and status
      await tx.inquiry.update({
        where: { id: inquiryId },
        data: {
          updatedAt: new Date(),
          status: nextStatus,
        },
      });

      return createdMessage;
    });

    // Target recipient for real-time socket emit
    const recipientUserId = isBuyer ? inquiry.company.userId : inquiry.userId;
    emitInquiryMessageToUser(recipientUserId, {
      inquiryId,
      message,
    });

    return {
      data: message,
      message: 'Message sent successfully.',
    };
  }

  /**
   * Returns count of unread incoming inquiries for the authenticated user / company.
   */
  async getUnreadCount(user: AuthUser) {
    let unreadCount = 0;

    // 1. Inquiries received as a company
    if (user.companyId && user.role === 'COMPANY') {
      const companyInquiries = await prisma.inquiry.findMany({
        where: {
          companyId: user.companyId,
          status: { in: ['UNREAD_FOR_COMPANY', 'UNREAD_BY_COMPANY'] },
        },
        select: {
          id: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { senderId: true },
          },
        },
      });

      // Filter out any where user was the sender
      unreadCount += companyInquiries.filter(
        (inq) => inq.messages.length > 0 && inq.messages[0].senderId !== user.id
      ).length;
    }

    // 2. Inquiries sent as a buyer/user
    const userInquiries = await prisma.inquiry.findMany({
      where: {
        userId: user.id,
        status: { in: ['UNREAD_FOR_USER', 'UNREAD_BY_USER'] },
      },
      select: {
        id: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { senderId: true },
        },
      },
    });

    unreadCount += userInquiries.filter(
      (inq) => inq.messages.length > 0 && inq.messages[0].senderId !== user.id
    ).length;

    return { unreadCount };
  }
}

export const inquiriesService = new InquiriesService();
