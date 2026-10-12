import http from 'http';
import app from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { initSocket } from './lib/socket';

const server = http.createServer(app);

// Initialize Socket.io attached to HTTP server
initSocket(server);

server.listen(env.PORT, () => {
  logger.info(`🚀 twintell backend server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`🔗 Health check available at http://localhost:${env.PORT}/health`);
  logger.info(`⚡ Socket.io enabled on ws://localhost:${env.PORT}`);
});

const handleShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
