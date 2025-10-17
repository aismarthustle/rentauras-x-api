import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (message: string, statusCode: number = 500): CustomError => {
  return new CustomError(message, statusCode);
};

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';
  
  // Log error details
  logger.error('Error occurred:', {
    message: error.message,
    statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Don't leak error details in production
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  
  const errorResponse: any = {
    error: true,
    message: statusCode === 500 && !isDevelopment ? 'Internal Server Error' : message,
    statusCode,
    timestamp: new Date().toISOString()
  };

  // Include stack trace in development
  if (isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new CustomError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Validation error handler
export const validationError = (message: string): CustomError => {
  return new CustomError(message, 400);
};

// Authentication error handler
export const authError = (message: string = 'Authentication required'): CustomError => {
  return new CustomError(message, 401);
};

// Authorization error handler
export const forbiddenError = (message: string = 'Access forbidden'): CustomError => {
  return new CustomError(message, 403);
};

// Not found error handler
export const notFoundError = (message: string = 'Resource not found'): CustomError => {
  return new CustomError(message, 404);
};

// Conflict error handler
export const conflictError = (message: string = 'Resource conflict'): CustomError => {
  return new CustomError(message, 409);
};

// Too many requests error handler
export const tooManyRequestsError = (message: string = 'Too many requests'): CustomError => {
  return new CustomError(message, 429);
};
