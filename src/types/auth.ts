export interface User {
  id: string;
  email: string | null;
  phone: string;
  full_name: string;
  role: 'passenger' | 'driver' | 'admin';
  is_active: boolean | null;
  is_verified: boolean | null;
  avatar_url: string | null;
  preferred_language: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
