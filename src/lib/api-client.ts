// Frontend API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

// API Client Class
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

  public setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // Set expiry time
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 1); // 24 hours
      localStorage.setItem('tokenExpiry', expiry.toISOString());
    }
  }

  public clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
    }
  }

  public setUser(user: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  public getUser(): any {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token) return false;
    if (expiry && new Date(expiry) < new Date()) {
      this.clearTokens();
      return false;
    }
    return true;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        success: false,
        error: data.detail || data.error || 'UNKNOWN_ERROR',
        message: data.message || data.detail || 'An unexpected error occurred',
        statusCode: response.status,
      };

      // Handle 401 Unauthorized
      if (response.status === 401) {
        this.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      throw error;
    }

    return data;
  }

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
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

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
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

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
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

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
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

  async delete<T>(endpoint: string): Promise<T> {
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
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);
export { ApiClient };
