import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/supabase';
import { authError, forbiddenError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    phone: string;
    role: 'passenger' | 'driver' | 'admin';
    status: 'active' | 'inactive' | 'suspended';
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  phone: string;
  role: 'passenger' | 'driver' | 'admin';
  iat: number;
  exp: number;
}

// Verify JWT token and attach user to request
export const authenticateToken = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw authError('Access token required');
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      logger.error('JWT_SECRET not configured');
      throw new Error('Server configuration error');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from database to ensure they still exist and are active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, phone, role, status')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      logger.warn('Invalid token - user not found:', { userId: decoded.userId });
      throw authError('Invalid token');
    }

    if (user.status !== 'active') {
      logger.warn('Inactive user attempted access:', { userId: user.id, status: user.status });
      throw authError('Account is not active');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('JWT verification failed:', error.message);
      next(authError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('JWT token expired');
      next(authError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Optional authentication - doesn't throw error if no token
export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      return next();
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, phone, role, status')
      .eq('id', decoded.userId)
      .single();

    if (!error && user && user.status === 'active') {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (...roles: Array<'passenger' | 'driver' | 'admin'>) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(authError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Insufficient permissions:', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles
      });
      return next(forbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole('admin');

// Driver only middleware
export const requireDriver = requireRole('driver');

// Passenger only middleware
export const requirePassenger = requireRole('passenger');

// Driver or Admin middleware
export const requireDriverOrAdmin = requireRole('driver', 'admin');

// Passenger or Driver middleware
export const requirePassengerOrDriver = requireRole('passenger', 'driver');

// Generate JWT token
export const generateToken = (user: {
  id: string;
  email: string;
  phone: string;
  role: 'passenger' | 'driver' | 'admin';
}): string => {
  const jwtSecret = process.env['JWT_SECRET'];
  const jwtExpiresIn: string = process.env['JWT_EXPIRES_IN'] || '24h';

  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn } as any);
};

// Generate refresh token
export const generateRefreshToken = (userId: string): string => {
  const refreshSecret = process.env['REFRESH_TOKEN_SECRET'];
  const refreshExpiresIn: string = process.env['REFRESH_TOKEN_EXPIRES_IN'] || '30d';

  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET not configured');
  }

  return jwt.sign({ userId }, refreshSecret, { expiresIn: refreshExpiresIn } as any);
};

// Verify refresh token
export const verifyRefreshToken = (token: string): { userId: string } => {
  const refreshSecret = process.env['REFRESH_TOKEN_SECRET'];

  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET not configured');
  }

  return jwt.verify(token, refreshSecret) as { userId: string };
};
