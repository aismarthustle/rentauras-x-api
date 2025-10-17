import rateLimit from 'express-rate-limit';
import { logger } from '@/utils/logger';

// General rate limiter (using memory store for now)
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000') / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: 15 * 60 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use phone number or email if provided, otherwise IP
    const identifier = req.body?.phone || req.body?.email || req.ip;
    return identifier;
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded`, {
      identifier: req.body?.phone || req.body?.email || req.ip,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// OTP rate limiter
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 OTP request per minute
  message: {
    error: 'Too many OTP requests',
    message: 'Please wait before requesting another OTP.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const phone = req.body?.['phone'] || req.params?.['phone'];
    return phone || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`OTP rate limit exceeded`, {
      phone: req.body?.['phone'] || req.params?.['phone'],
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      error: 'Too many OTP requests',
      message: 'Please wait before requesting another OTP.',
      retryAfter: 60
    });
  }
});
