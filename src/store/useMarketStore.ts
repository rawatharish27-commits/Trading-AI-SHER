import { create } from 'zustand';
import { MarketQuote, MarketOverview, Watchlist, QuoteUpdate } from '@/types/market';
import { marketApi } from '@/lib/market';

interface MarketStore {
  quotes: Record<string, MarketQuote>;
  overview: MarketOverview | null;
  watchlist: Watchlist[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  // Actions
  fetchQuote: (symbol: string) => Promise<void>;
  fetchQuotes: (symbols: string[]) => Promise<void>;
  fetchOverview: () => Promise<void>;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (symbol: string, notes?: string) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  updateQuote: (symbol: string, update: Partial<MarketQuote>) => void;
  updateQuoteFromSocket: (update: QuoteUpdate) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export const useMarketStore = create<MarketStore>((set, get) => ({
  quotes: {},
  overview: null,
  watchlist: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchQuote: async (symbol: string) => {
    try {
      const quote = await marketApi.getQuote(symbol);
      set((state) => ({
        quotes: { ...state.quotes, [symbol]: quote },
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch quote';
      set({ error: message });
    }
  },

  fetchQuotes: async (symbols: string[]) => {
    if (symbols.length === 0) return;
    
    set({ isLoading: true, error: null });
    try {
      const quotes = await marketApi.getQuotes(symbols);
      const quotesMap = quotes.reduce((acc, quote) => {
        acc[quote.symbol] = quote;
        return acc;
      }, {} as Record<string, MarketQuote>);
      
      set((state) => ({
        quotes: { ...state.quotes, ...quotesMap },
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch quotes';
      set({ error: message, isLoading: false });
    }
  },

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const overview = await marketApi.getOverview();
      set({ overview, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch market overview';
      set({ error: message, isLoading: false });
    }
  },

  fetchWatchlist: async () => {
    try {
      const watchlist = await marketApi.getWatchlist();
      set({ watchlist });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch watchlist';
      set({ error: message });
    }
  },

  addToWatchlist: async (symbol: string, notes?: string) => {
    try {
      const item = await marketApi.addToWatchlist(symbol, notes);
      set((state) => ({
        watchlist: [...state.watchlist, item],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add to watchlist';
      set({ error: message });
      throw error;
    }
  },

  removeFromWatchlist: async (symbol: string) => {
    try {
      await marketApi.removeFromWatchlist(symbol);
      set((state) => ({
        watchlist: state.watchlist.filter((w) => 
          !w.items.some((item) => item.symbol === symbol)
        ),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove from watchlist';
      set({ error: message });
      throw error;
    }
  },

  updateQuote: (symbol: string, update: Partial<MarketQuote>) => {
    set((state) => {
      const existingQuote = state.quotes[symbol];
      if (!existingQuote) return state;
      
      return {
        quotes: {
          ...state.quotes,
          [symbol]: { ...existingQuote, ...update },
        },
        lastUpdated: new Date().toISOString(),
      };
    });
  },

  updateQuoteFromSocket: (update: QuoteUpdate) => {
    set((state) => {
      const existingQuote = state.quotes[update.symbol];
      if (!existingQuote) return state;
      
      return {
        quotes: {
          ...state.quotes,
          [update.symbol]: {
            ...existingQuote,
            price: update.price,
            change: update.change,
            changePercent: update.changePercent,
            volume: update.volume,
            lastUpdated: update.timestamp,
          },
        },
        lastUpdated: update.timestamp,
      };
    });
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
      quotes: {},
      overview: null,
      watchlist: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
    });
  },
}));
