"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, TokenResponse } from '@/lib/auth-api';
import { authApi } from '@/lib/auth-api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    mobile: string;
    password: string;
    confirm_password: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const { user } = await authApi.login({ email, password });
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Login failed', 
            isLoading: false,
            isAuthenticated: false,
            user: null 
          });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.register(data);
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Registration failed', 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } finally {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
        }
      },

      fetchUser: async () => {
        if (!authApi.isAuthenticated()) {
          set({ isAuthenticated: false, user: null });
          return;
        }
        
        set({ isLoading: true });
        try {
          const user = await authApi.getCurrentUser();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
