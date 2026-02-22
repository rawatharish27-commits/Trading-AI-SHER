import { api } from './api';
import { AuthResponse, LoginCredentials, RegisterCredentials, User } from '@/types/auth';

export const authApi = {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data.tokens.accessToken) {
      api.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    
    if (response.success && response.data.tokens.accessToken) {
      api.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
    }
    
    return response.data;
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      api.clearTokens();
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    if (response.success) {
      api.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  },
};
