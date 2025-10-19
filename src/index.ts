// Register module aliases FIRST before any other imports
import moduleAlias from 'module-alias';
moduleAlias.addAliases({
  '@': __dirname,
  '@/config': `${__dirname}/config`,
  '@/contexts': `${__dirname}/contexts`,
  '@/controllers': `${__dirname}/controllers`,
  '@/lib': `${__dirname}/lib`,
  '@/middleware': `${__dirname}/middleware`,
  '@/models': `${__dirname}/models`,
  '@/routes': `${__dirname}/routes`,
  '@/services': `${__dirname}/services`,
  '@/utils': `${__dirname}/utils`,
  '@/types': `${__dirname}/types`
});

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import swaggerUi from 'swagger-ui-express';
import { specs, swaggerUiOptions } from '@/config/swagger-simple';

import { errorHandler } from '@/middleware/errorHandler';
// import { rateLimiter } from '@/middleware/rateLimiter';
import { logger } from '@/utils/logger';
import { supabase } from '@/config/supabase';
// import { redisClient } from '@/config/redis';

// Import routes
import authRoutes from '@/routes/auth';
import userRoutes from '@/routes/users';
import rideRoutes from '@/routes/rides';
import vehicleRoutes from '@/routes/vehicles';
import paymentRoutes from '@/routes/payments';
import notificationRoutes from '@/routes/notifications';
import driverRoutes from '@/routes/drivers';
import walletRoutes from '@/routes/wallet';
import bidRoutes from '@/routes/bids';
import adminRoutes from '@/routes/admin';
import mapRoutes from '@/routes/maps';

// Import socket handlers
import { initializeSocketHandlers } from '@/services/socketService';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env['SOCKET_CORS_ORIGIN'] || "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env['PORT'] || 3000;
const API_VERSION = process.env['API_VERSION'] || 'v1';

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000', 'http://localhost:19006'],
  credentials: process.env['CORS_CREDENTIALS'] === 'true'
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (temporarily disabled for Swagger setup)
// app.use(rateLimiter);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Welcome endpoint with API information
 *     tags: [System]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 apiBaseUrl:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 healthCheck:
 *                   type: string
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to Rentauras X Backend API',
    version: process.env['npm_package_version'] || '1.0.0',
    apiBaseUrl: `/api/${API_VERSION}`,
    documentation: '/api-docs',
    healthCheck: '/health',
    endpoints: {
      auth: `/api/${API_VERSION}/auth`,
      users: `/api/${API_VERSION}/users`,
      rides: `/api/${API_VERSION}/rides`,
      vehicles: `/api/${API_VERSION}/vehicles`,
      payments: `/api/${API_VERSION}/payments`,
      notifications: `/api/${API_VERSION}/notifications`,
      drivers: `/api/${API_VERSION}/drivers`,
      wallet: `/api/${API_VERSION}/wallet`,
      bids: `/api/${API_VERSION}/bids`,
      admin: `/api/${API_VERSION}/admin`,
      maps: `/api/${API_VERSION}/maps`
    }
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API server is running and healthy
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'OK'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: '1.0.0'
 *                 environment:
 *                   type: string
 *                   example: 'development'
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// Swagger API Documentation (available in all environments)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
logger.info(`📚 API Documentation available at /api-docs`);

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/rides`, rideRoutes);
app.use(`/api/${API_VERSION}/vehicles`, vehicleRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/notifications`, notificationRoutes);
app.use(`/api/${API_VERSION}/drivers`, driverRoutes);
app.use(`/api/${API_VERSION}/wallet`, walletRoutes);
app.use(`/api/${API_VERSION}/bids`, bidRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/maps`, mapRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist.`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize Socket.IO handlers
initializeSocketHandlers(io);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info('HTTP server closed.');
    
    try {
      // Close Redis connection (temporarily disabled)
      // await redisClient.quit();
      logger.info('Redis connection skipped.');
      
      // Close Socket.IO server
      io.close();
      logger.info('Socket.IO server closed.');
      
      logger.info('Graceful shutdown completed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Test Supabase connection
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && !error.message.includes('JWT')) {
      throw new Error(`Supabase connection failed: ${error.message}`);
    }
    logger.info('✅ Supabase connection successful');

    // Test Redis connection (temporarily disabled for Swagger setup)
    // await redisClient.ping();
    logger.info('✅ Redis connection skipped for Swagger setup');

    server.listen(PORT, () => {
      logger.info(`🚀 Rentauras X Backend Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env['NODE_ENV']}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
      logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if not running on Vercel (Vercel will call the handler)
if (process.env['VERCEL'] !== '1') {
  startServer();
} else {
  // For Vercel: Initialize connections but don't listen
  (async () => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error && !error.message.includes('JWT')) {
        logger.error(`Supabase connection failed: ${error.message}`);
      } else {
        logger.info('✅ Supabase connection successful');
      }
    } catch (error) {
      logger.error('Failed to initialize Supabase:', error);
    }
  })();
}

export { app, io };
export default app;
