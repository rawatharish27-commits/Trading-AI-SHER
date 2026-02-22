// Simple Admin Auth API Service
import { api } from './api-client';

// Admin User type (simplified)
export interface AdminUser {
  username: string;
  role: string;
  login_time: string;
  session_expires: string;
}

// Login request (password only)
export interface AdminLoginCredentials {
  password: string;
}

// Token response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Password change
export interface PasswordChange {
  current_password: string;
  new_password: string;
}

// Admin Auth API
export const authApi = {
  // Admin Login (password only)
  async login(credentials: AdminLoginCredentials): Promise<{ token: TokenResponse; user: AdminUser }> {
    const token = await api.post<TokenResponse>('/auth/login', credentials);
    
    // Get admin info
    const user = await api.get<AdminUser>('/auth/me');
    
    // Store token and user
    api.setTokens(token.access_token, null);
    api.setUser(user as any);
    
    return { token, user };
  },

  // Logout
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      api.clearTokens();
    }
  },

  // Get current admin info
  async getCurrentUser(): Promise<AdminUser> {
    return api.get<AdminUser>('/auth/me');
  },

  // Change password
  async changePassword(data: PasswordChange): Promise<{ message: string }> {
    return api.post('/auth/change-password', data);
  },

  // Verify token
  async verifyToken(): Promise<{ valid: boolean; admin: string; role: string }> {
    return api.post('/auth/verify', {});
  },

  // Check if authenticated
  isAuthenticated(): boolean {
    return api.isAuthenticated();
  },

  // Get stored user
  getStoredUser(): AdminUser | null {
    return api.getUser() as AdminUser | null;
  },
};

export default authApi;
