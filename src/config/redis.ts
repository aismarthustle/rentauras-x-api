import { createClient } from 'redis';
import { logger } from '@/utils/logger';

const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
const redisPassword = process.env['REDIS_PASSWORD'];

const redisConfig: Parameters<typeof createClient>[0] = {
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error('Redis connection failed after 10 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 50, 1000);
    }
  }
};

if (redisPassword) {
  redisConfig.password = redisPassword;
}

export const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
  logger.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

redisClient.on('ready', () => {
  logger.info('Redis Client Ready');
});

redisClient.on('end', () => {
  logger.info('Redis Client Disconnected');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  logger.error('Failed to connect to Redis:', err);
});

export default redisClient;
