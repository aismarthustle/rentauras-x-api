import type { LoginResponse } from '@/types/auth';

/**
 * AuthService - Backend authentication utilities
 * This module provides helper functions for authentication operations
 * Note: For client-side authentication, use the frontend auth library
 */

/**
 * Parse authentication response
 */
export function parseAuthResponse(data: unknown): LoginResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid auth response');
  }

  const response = data as Record<string, unknown>;
  const authData = response.data as Record<string, unknown>;

  if (!authData || typeof authData !== 'object') {
    throw new Error('Invalid auth response structure');
  }

  const user = authData.user;
  const tokens = authData.tokens as Record<string, unknown>;

  if (!user || !tokens) {
    throw new Error('Missing user or tokens in auth response');
  }

  return {
    user: user as any,
    token: tokens.access_token as string,
    refreshToken: tokens.refresh_token as string,
  };
}

