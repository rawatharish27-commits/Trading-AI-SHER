// Auth Types - Simplified for Single Admin

export interface AdminUser {
  username: string;
  role: string;
  login_time: string;
  session_expires: string;
}

export interface AdminLoginCredentials {
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

// Legacy type aliases for backward compatibility
export type User = AdminUser;
export type LoginCredentials = AdminLoginCredentials;
