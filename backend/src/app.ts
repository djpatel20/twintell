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
import productRouter from './modules/products/products.routes';
import inquiryRouter from './modules/inquiries/inquiries.routes';
import searchRouter from './modules/search/search.routes';

const app = express();

// Trust reverse proxy (Render, Vercel, AWS) for accurate client IP rate limiting
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS configuration - allows FRONTEND_URL (or comma-separated list) and Vercel deployments
const allowedOrigins = env.FRONTEND_URL
  ? env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (
        env.NODE_ENV !== 'production' ||
        allowedOrigins.includes(normalizedOrigin) ||
        (normalizedOrigin.startsWith('https://') && normalizedOrigin.endsWith('.vercel.app'))
      ) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
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
app.use('/api/products', productRouter);
app.use('/api/inquiries', inquiryRouter);
app.use('/api/search', searchRouter);

// 404 handler
app.use(notFoundHandler);

// Central Error Handler
app.use(errorHandler);

export default app;
