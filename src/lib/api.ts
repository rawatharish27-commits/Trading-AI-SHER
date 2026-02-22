import { ApiError, ApiResponse } from '@/types/api';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Generic fetch wrapper with interceptors
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private setAuthToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  private removeAuthToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        success: false,
        error: data.error || 'UNKNOWN_ERROR',
        message: data.message || 'An unexpected error occurred',
        statusCode: response.status,
      };

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        this.removeAuthToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw error;
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const token = this.getAuthToken();
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers,
    });

    return this.handleResponse<T>(response);
  }

  // Auth token management
  setTokens(accessToken: string, refreshToken?: string): void {
    this.setAuthToken(accessToken);
    if (refreshToken && typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens(): void {
    this.removeAuthToken();
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export class for testing
export { ApiClient };
