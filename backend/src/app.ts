import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { globalRateLimiter } from './middleware/rate-limiter';
import { errorHandler } from './middleware/error-handler';
import { notFoundHandler } from './middleware/not-found';
import feedRouter from './modules/feed/feed.routes';
import companyRouter from './modules/companies/company.routes';
import authRouter from './modules/auth/auth.routes';
import categoryRouter from './modules/categories/category.routes';
import postRouter from './modules/posts/posts.routes';
import uploadRouter from './modules/uploads/uploads.routes';

const app = express();

// Security Headers
app.use(helmet());

// CORS configuration - allow only FRONTEND_URL
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (origin === env.FRONTEND_URL || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(globalRateLimiter);

// Health check endpoint (Public, used by Render/AWS)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Root route for convenience
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'twintell API',
    version: '1.0.0',
    documentation: '/health',
  });
});
// Module routes
app.use('/api', authRouter);
app.use('/api/feed', feedRouter);
app.use('/api/posts', postRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/companies', companyRouter);
app.use('/api/categories', categoryRouter);

// 404 handler
app.use(notFoundHandler);

// Central Error Handler
app.use(errorHandler);

export default app;
