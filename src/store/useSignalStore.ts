import { create } from 'zustand';
import { Signal, SignalDetail, SignalFilters } from '@/types/signal';
import { signalsApi } from '@/lib/signals';

interface SignalStore {
  signals: Signal[];
  selectedSignal: SignalDetail | null;
  filters: SignalFilters;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  activeCount: number;

  // Actions
  fetchSignals: (filters?: SignalFilters) => Promise<void>;
  fetchSignal: (id: string) => Promise<void>;
  setFilters: (filters: Partial<SignalFilters>) => void;
  clearFilters: () => void;
  setActiveCount: (count: number) => void;
  addSignal: (signal: Signal) => void;
  updateSignal: (id: string, updates: Partial<Signal>) => void;
  removeSignal: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: SignalFilters = {
  page: 1,
  limit: 20,
};

export const useSignalStore = create<SignalStore>((set, get) => ({
  signals: [],
  selectedSignal: null,
  filters: initialFilters,
  isLoading: false,
  error: null,
  totalCount: 0,
  activeCount: 0,

  fetchSignals: async (filters?: SignalFilters) => {
    set({ isLoading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters };
      const response = await signalsApi.getSignals(mergedFilters);
      set({
        signals: response.data,
        totalCount: response.pagination.total,
        filters: mergedFilters,
        isLoading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch signals';
      set({ error: message, isLoading: false });
    }
  },

  fetchSignal: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const signal = await signalsApi.getSignal(id);
      set({ selectedSignal: signal, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch signal';
      set({ error: message, isLoading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }));
  },

  clearFilters: () => {
    set({ filters: initialFilters });
  },

  setActiveCount: (count) => {
    set({ activeCount: count });
  },

  addSignal: (signal) => {
    set((state) => ({
      signals: [signal, ...state.signals],
      totalCount: state.totalCount + 1,
    }));
  },

  updateSignal: (id, updates) => {
    set((state) => ({
      signals: state.signals.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      selectedSignal:
        state.selectedSignal?.id === id
          ? { ...state.selectedSignal, ...updates }
          : state.selectedSignal,
    }));
  },

  removeSignal: (id) => {
    set((state) => ({
      signals: state.signals.filter((s) => s.id !== id),
      totalCount: state.totalCount - 1,
      selectedSignal: state.selectedSignal?.id === id ? null : state.selectedSignal,
    }));
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
      signals: [],
      selectedSignal: null,
      filters: initialFilters,
      isLoading: false,
      error: null,
      totalCount: 0,
      activeCount: 0,
    });
  },
}));
