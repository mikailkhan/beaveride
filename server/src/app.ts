import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { authRoutes } from './routes/authRoutes.js';
import { healthRoutes, rootHealthRoutes } from './routes/healthRoutes.js';
import { roomRoutes } from './routes/roomRoutes.js';
import { fileRoutes } from './routes/fileRoutes.js';
import { activityRoutes } from './routes/activityRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { apiRateLimiter } from './middleware/rateLimitMiddleware.js';

export const createApp = () => {
  const app = express();

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'", 'ws:', 'wss:', 'http:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'same-origin' },
    })
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use(rootHealthRoutes);
  app.use('/api', apiRateLimiter);
  app.use('/api', healthRoutes);
  app.use('/api', taskRoutes);
  app.use('/api', adminRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/rooms', fileRoutes);
  app.use('/api/rooms', activityRoutes);
  app.use('/api/rooms', roomRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
