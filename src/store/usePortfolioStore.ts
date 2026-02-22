"use client";

import { create } from 'zustand';
import { Portfolio, Position, PortfolioStats } from '@/lib/portfolio-api';
import { portfolioApi } from '@/lib/portfolio-api';

interface PortfolioState {
  portfolio: Portfolio | null;
  positions: Position[];
  stats: PortfolioStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPortfolio: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  closePosition: (id: number, quantity?: number) => Promise<void>;
  updatePosition: (id: number, data: {
    stop_loss?: number;
    target?: number;
    trailing_sl?: number;
  }) => Promise<void>;
  refreshAll: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  portfolio: null,
  positions: [],
  stats: null,
  isLoading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      const portfolio = await portfolioApi.getPortfolio();
      set({ portfolio, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch portfolio', 
        isLoading: false 
      });
    }
  },

  fetchPositions: async () => {
    try {
      const response = await portfolioApi.getPositions();
      set({ positions: response.positions });
    } catch (error: any) {
      console.error('Failed to fetch positions:', error);
    }
  },

  fetchStats: async () => {
    try {
      const stats = await portfolioApi.getStats();
      set({ stats });
    } catch (error: any) {
      console.error('Failed to fetch portfolio stats:', error);
    }
  },

  closePosition: async (id: number, quantity?: number) => {
    set({ isLoading: true, error: null });
    try {
      await portfolioApi.closePosition(id, quantity ? { quantity } : undefined);
      // Refresh positions and portfolio
      await get().refreshAll();
      set({ isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to close position', 
        isLoading: false 
      });
      throw error;
    }
  },

  updatePosition: async (id: number, data) => {
    try {
      await portfolioApi.updatePosition(id, data);
      // Update local state
      set((state) => ({
        positions: state.positions.map(p => 
          p.id === id ? { ...p, ...data } : p
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update position' });
      throw error;
    }
  },

  refreshAll: async () => {
    await Promise.all([
      get().fetchPortfolio(),
      get().fetchPositions(),
      get().fetchStats(),
    ]);
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    portfolio: null,
    positions: [],
    stats: null,
    isLoading: false,
    error: null,
  }),
}));
