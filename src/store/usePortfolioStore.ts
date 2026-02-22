import { create } from 'zustand';
import { Portfolio, Position, PortfolioSummary } from '@/types/portfolio';
import { portfolioApi } from '@/lib/portfolio';

interface PortfolioStore {
  portfolio: Portfolio | null;
  positions: Position[];
  summary: PortfolioSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchPortfolio: () => Promise<void>;
  fetchPositions: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  updatePosition: (symbol: string, updates: Partial<Position>) => void;
  addPosition: (position: Position) => void;
  removePosition: (symbol: string) => void;
  updatePortfolioValue: (totalValue: number, pnl: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  portfolio: null,
  positions: [],
  summary: null,
  isLoading: false,
  error: null,

  fetchPortfolio: async () => {
    set({ isLoading: true, error: null });
    try {
      const portfolio = await portfolioApi.getPortfolio();
      set({ portfolio, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch portfolio';
      set({ error: message, isLoading: false });
    }
  },

  fetchPositions: async () => {
    set({ isLoading: true, error: null });
    try {
      const positions = await portfolioApi.getPositions();
      set({ positions, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch positions';
      set({ error: message, isLoading: false });
    }
  },

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const summary = await portfolioApi.getSummary();
      set({ summary, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch summary';
      set({ error: message, isLoading: false });
    }
  },

  updatePosition: (symbol, updates) => {
    set((state) => ({
      positions: state.positions.map((p) =>
        p.symbol === symbol ? { ...p, ...updates } : p
      ),
    }));
  },

  addPosition: (position) => {
    set((state) => ({
      positions: [...state.positions, position],
    }));
  },

  removePosition: (symbol) => {
    set((state) => ({
      positions: state.positions.filter((p) => p.symbol !== symbol),
    }));
  },

  updatePortfolioValue: (totalValue, pnl) => {
    const portfolio = get().portfolio;
    if (portfolio) {
      set({
        portfolio: {
          ...portfolio,
          totalValue,
          totalPnl: pnl,
          totalPnlPercent: totalValue > 0 ? (pnl / totalValue) * 100 : 0,
        },
      });
    }
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      portfolio: null,
      positions: [],
      summary: null,
      isLoading: false,
      error: null,
    });
  },
}));
