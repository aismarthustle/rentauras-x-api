import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { AuthContextType, AuthState, LoginCredentials, User, LoginResponse } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Client-side storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

/**
 * Client-side AuthService for managing authentication
 */
class ClientAuthService {
  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  static setAuthData(response: LoginResponse): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  static clearAuthData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    const authResponse = this.parseAuthResponse(data);
    this.setAuthData(authResponse);
    return authResponse;
  }

  static logout(): void {
    this.clearAuthData();
  }

  static async refreshToken(): Promise<LoginResponse | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getToken()}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearAuthData();
        return null;
      }

      const data = await response.json();
      const authResponse = this.parseAuthResponse(data);
      this.setAuthData(authResponse);
      return authResponse;
    } catch (error) {
      this.clearAuthData();
      return null;
    }
  }

  private static parseAuthResponse(data: unknown): LoginResponse {
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkAuthStatus = useCallback(async () => {
    try {
      const user = ClientAuthService.getCurrentUser();
      const isAuthenticated = ClientAuthService.isAuthenticated();

      setState({
        user,
        isLoading: false,
        isAuthenticated,
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    // Check if user is already authenticated on mount
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = async (credentials: LoginCredentials) => {
    setState((prev: AuthState) => ({ ...prev, isLoading: true }));

    try {
      const response = await ClientAuthService.login(credentials);
      setState({
        user: response.user,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      setState((prev: AuthState) => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const logout = () => {
    ClientAuthService.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  const refreshToken = async () => {
    try {
      const result = await ClientAuthService.refreshToken();
      if (result) {
        setState((prev: AuthState) => ({
          ...prev,
          user: result.user,
          isAuthenticated: true,
        }));
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
