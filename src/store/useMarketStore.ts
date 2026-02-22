"use client";

import { create } from 'zustand';
import { Quote, MarketIndex, MarketMover, MarketStatus } from '@/lib/market-api';
import { marketApi } from '@/lib/market-api';

interface MarketState {
  quotes: Record<string, Quote>;
  indices: MarketIndex[];
  gainers: MarketMover[];
  losers: MarketMover[];
  marketStatus: MarketStatus | null;
  watchlist: string[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchQuote: (symbol: string) => Promise<void>;
  fetchQuotes: (symbols: string[]) => Promise<void>;
  fetchIndices: () => Promise<void>;
  fetchMovers: () => Promise<void>;
  fetchMarketStatus: () => Promise<void>;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  updateQuote: (symbol: string, quote: Partial<Quote>) => void;
  clearError: () => void;
  reset: () => void;
}

export const useMarketStore = create<MarketState>((set, get) => ({
  quotes: {},
  indices: [],
  gainers: [],
  losers: [],
  marketStatus: null,
  watchlist: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'],
  isLoading: false,
  error: null,

  fetchQuote: async (symbol: string) => {
    try {
      const quote = await marketApi.getQuote(symbol);
      set((state) => ({
        quotes: { ...state.quotes, [symbol]: quote },
      }));
    } catch (error: any) {
      console.error(`Failed to fetch quote for ${symbol}:`, error);
    }
  },

  fetchQuotes: async (symbols: string[]) => {
    try {
      const quotes = await marketApi.getQuotes(symbols);
      set((state) => ({
        quotes: { ...state.quotes, ...quotes },
      }));
    } catch (error: any) {
      console.error('Failed to fetch quotes:', error);
    }
  },

  fetchIndices: async () => {
    try {
      const indices = await marketApi.getIndices();
      set({ indices });
    } catch (error: any) {
      console.error('Failed to fetch indices:', error);
    }
  },

  fetchMovers: async () => {
    try {
      const [gainers, losers] = await Promise.all([
        marketApi.getGainers(10),
        marketApi.getLosers(10),
      ]);
      set({ gainers, losers });
    } catch (error: any) {
      console.error('Failed to fetch movers:', error);
    }
  },

  fetchMarketStatus: async () => {
    try {
      const status = await marketApi.getStatus();
      set({ marketStatus: status });
    } catch (error: any) {
      console.error('Failed to fetch market status:', error);
    }
  },

  addToWatchlist: (symbol: string) => {
    set((state) => {
      if (state.watchlist.includes(symbol)) return state;
      return { watchlist: [...state.watchlist, symbol] };
    });
  },

  removeFromWatchlist: (symbol: string) => {
    set((state) => ({
      watchlist: state.watchlist.filter(s => s !== symbol),
    }));
  },

  updateQuote: (symbol: string, quote: Partial<Quote>) => {
    set((state) => ({
      quotes: {
        ...state.quotes,
        [symbol]: { ...state.quotes[symbol], ...quote } as Quote,
      },
    }));
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    quotes: {},
    indices: [],
    gainers: [],
    losers: [],
    marketStatus: null,
    isLoading: false,
    error: null,
  }),
}));
