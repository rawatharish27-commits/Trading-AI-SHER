// Auth API Service
import { api } from './api-client';

// Types
export interface User {
  id: number;
  email: string;
  mobile: string;
  first_name: string | null;
  last_name: string | null;
  role: 'ADMIN' | 'TRADER' | 'VIEWER' | 'TENANT_OWNER';
  plan: 'FREE' | 'PRO' | 'ELITE' | 'INSTITUTIONAL';
  is_active: boolean;
  is_verified: boolean;
  onboarding_completed: boolean;
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  totp_code?: string;
}

export interface RegisterData {
  email: string;
  mobile: string;
  password: string;
  confirm_password: string;
  first_name?: string;
  last_name?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

// Auth API
export const authApi = {
  // Login
  async login(credentials: LoginCredentials): Promise<{ token: TokenResponse; user: User }> {
    const token = await api.post<TokenResponse>('/auth/login', credentials);
    
    // Get user profile
    const user = await api.get<User>('/auth/me');
    
    // Store tokens and user
    api.setTokens(token.access_token, token.refresh_token);
    api.setUser(user);
    
    return { token, user };
  },

  // Register
  async register(data: RegisterData): Promise<User> {
    return api.post<User>('/auth/register', data);
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      api.clearTokens();
    }
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  // Refresh token
  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
    });

    if (!response.ok) {
      api.clearTokens();
      throw new Error('Failed to refresh token');
    }

    const token: TokenResponse = await response.json();
    api.setTokens(token.access_token, token.refresh_token);
    return token;
  },

  // Change password
  async changePassword(data: PasswordChange): Promise<{ message: string }> {
    return api.post('/auth/change-password', data);
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return api.isAuthenticated();
  },

  // Get stored user
  getStoredUser(): User | null {
    return api.getUser();
  },
};

export default authApi;
