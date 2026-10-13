import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { supabaseAdmin } from './supabase';
import { logger } from './logger';
import { env } from '../config/env';

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  const allowedOrigins = env.FRONTEND_URL
    ? env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
    : ['http://localhost:3000'];

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        if (
          env.NODE_ENV !== 'production' ||
          allowedOrigins.includes(normalizedOrigin) ||
          (normalizedOrigin.startsWith('https://') && normalizedOrigin.endsWith('.vercel.app'))
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by Socket CORS`));
      },
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Socket authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization;
      const token =
        socket.handshake.auth?.token ||
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

      if (!token) {
        logger.debug('Socket connection attempted without token');
        return next();
      }

      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) {
        logger.warn({ error: error?.message }, 'Socket authentication failed for token');
        return next();
      }

      socket.data.userId = data.user.id;
      return next();
    } catch (err) {
      logger.error({ err }, 'Error during socket authentication handshake');
      return next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;

    if (userId) {
      const room = `user:${userId}`;
      socket.join(room);
      logger.info({ socketId: socket.id, userId, room }, 'User connected and joined notification room');
    } else {
      logger.info({ socketId: socket.id }, 'Anonymous socket connected');
    }

    // Allow client to explicitly register/join if token was refreshed
    socket.on('register', async (token: string) => {
      try {
        if (!token) return;
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (data?.user) {
          socket.data.userId = data.user.id;
          const room = `user:${data.user.id}`;
          socket.join(room);
          logger.info({ socketId: socket.id, userId: data.user.id }, 'Socket registered via register event');
          socket.emit('registered', { userId: data.user.id });
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to register socket via register event');
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, 'Socket disconnected');
    });
  });

  logger.info('⚡ Socket.io server initialized for pure real-time notifications');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet. Call initSocket(httpServer) first.');
  }
  return io;
}

/**
 * Emits a real-time notification to a specific user's socket room.
 */
export function emitNotificationToUser(userId: string, notification: any): void {
  if (!io) {
    logger.warn({ userId }, 'Socket.io not initialized; skipped real-time notification emit');
    return;
  }

  const room = `user:${userId}`;
  io.to(room).emit('notification:new', notification);
  logger.info({ userId, room, notificationId: notification.id, type: notification.type }, 'Dispatched real-time notification via Socket.io');
}

/**
 * Emits a real-time inquiry chat message to a specific user's socket room.
 */
export function emitInquiryMessageToUser(userId: string, data: any): void {
  if (!io) {
    logger.warn({ userId }, 'Socket.io not initialized; skipped real-time inquiry message emit');
    return;
  }

  const room = `user:${userId}`;
  io.to(room).emit('inquiry:message', data);
  logger.info({ userId, room, inquiryId: data?.inquiryId }, 'Dispatched real-time inquiry chat message via Socket.io');
}
