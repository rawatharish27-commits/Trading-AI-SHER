"use client";

import { create } from 'zustand';
import { Signal, SignalFilter, SignalStatsResponse } from '@/lib/signals-api';
import { signalsApi } from '@/lib/signals-api';

interface SignalState {
  signals: Signal[];
  activeSignals: Signal[];
  stats: SignalStatsResponse | null;
  selectedSignal: Signal | null;
  isLoading: boolean;
  error: string | null;
  filters: SignalFilter;
  
  // Actions
  fetchSignals: (filters?: SignalFilter) => Promise<void>;
  fetchActiveSignals: () => Promise<void>;
  fetchStats: () => Promise<void>;
  selectSignal: (signal: Signal | null) => void;
  generateSignal: (symbol: string) => Promise<Signal>;
  cancelSignal: (id: number) => Promise<void>;
  setFilters: (filters: Partial<SignalFilter>) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: SignalFilter = {
  page: 1,
  page_size: 20,
};

export const useSignalStore = create<SignalState>((set, get) => ({
  signals: [],
  activeSignals: [],
  stats: null,
  selectedSignal: null,
  isLoading: false,
  error: null,
  filters: initialFilters,

  fetchSignals: async (filters?: SignalFilter) => {
    set({ isLoading: true, error: null });
    try {
      const appliedFilters = { ...get().filters, ...filters };
      const response = await signalsApi.getSignals(appliedFilters);
      set({ 
        signals: response.signals, 
        filters: appliedFilters,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch signals', 
        isLoading: false 
      });
    }
  },

  fetchActiveSignals: async () => {
    try {
      const signals = await signalsApi.getActiveSignals();
      set({ activeSignals: signals });
    } catch (error: any) {
      console.error('Failed to fetch active signals:', error);
    }
  },

  fetchStats: async () => {
    try {
      const stats = await signalsApi.getStats();
      set({ stats });
    } catch (error: any) {
      console.error('Failed to fetch signal stats:', error);
    }
  },

  selectSignal: (signal) => set({ selectedSignal: signal }),

  generateSignal: async (symbol: string) => {
    set({ isLoading: true, error: null });
    try {
      const signal = await signalsApi.generateSignal(symbol);
      // Refresh active signals
      get().fetchActiveSignals();
      set({ isLoading: false });
      return signal;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to generate signal', 
        isLoading: false 
      });
      throw error;
    }
  },

  cancelSignal: async (id: number) => {
    try {
      await signalsApi.cancelSignal(id);
      // Update local state
      set((state) => ({
        signals: state.signals.map(s => 
          s.id === id ? { ...s, status: 'CANCELLED' as const } : s
        ),
        activeSignals: state.activeSignals.filter(s => s.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to cancel signal' });
      throw error;
    }
  },

  setFilters: (filters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...filters } 
    }));
    get().fetchSignals({ ...get().filters, ...filters });
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    signals: [],
    activeSignals: [],
    stats: null,
    selectedSignal: null,
    isLoading: false,
    error: null,
    filters: initialFilters,
  }),
}));
