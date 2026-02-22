'use client';

import { useCallback, useEffect } from 'react';
import { useSignalStore } from '@/store/useSignalStore';
import { signalsApi } from '@/lib/signals';
import { SignalFilters, Signal, CreateSignalInput } from '@/types/signal';

export function useSignals(initialFilters?: SignalFilters) {
  const {
    signals,
    selectedSignal,
    filters,
    isLoading,
    error,
    totalCount,
    activeCount,
    fetchSignals,
    fetchSignal,
    setFilters,
    clearFilters,
    setActiveCount,
    addSignal,
    updateSignal,
    removeSignal,
    clearError,
  } = useSignalStore();

  // Initial fetch
  useEffect(() => {
    fetchSignals(initialFilters);
  }, [fetchSignals, initialFilters]);

  // Fetch active count on mount
  useEffect(() => {
    const fetchActiveCount = async () => {
      try {
        const { count } = await signalsApi.getActiveCount();
        setActiveCount(count);
      } catch {
        // Silently handle error
      }
    };
    fetchActiveCount();
  }, [setActiveCount]);

  const createSignal = useCallback(async (input: CreateSignalInput): Promise<Signal> => {
    const signal = await signalsApi.createSignal(input);
    addSignal(signal);
    return signal;
  }, [addSignal]);

  const cancelSignal = useCallback(async (id: string): Promise<void> => {
    await signalsApi.cancelSignal(id);
    updateSignal(id, { status: 'CANCELLED' });
  }, [updateSignal]);

  const executeSignal = useCallback(async (id: string): Promise<void> => {
    await signalsApi.executeSignal(id);
    updateSignal(id, { status: 'EXECUTED' });
  }, [updateSignal]);

  const deleteSignal = useCallback(async (id: string): Promise<void> => {
    // Note: This assumes the API has a delete endpoint
    removeSignal(id);
  }, [removeSignal]);

  const refresh = useCallback(() => {
    fetchSignals(filters);
  }, [fetchSignals, filters]);

  const changePage = useCallback((page: number) => {
    setFilters({ page });
    fetchSignals({ ...filters, page });
  }, [setFilters, fetchSignals, filters]);

  const changeFilters = useCallback((newFilters: Partial<SignalFilters>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    fetchSignals(updatedFilters);
  }, [filters, setFilters, fetchSignals]);

  return {
    signals,
    selectedSignal,
    filters,
    isLoading,
    error,
    totalCount,
    activeCount,
    fetchSignals,
    fetchSignal,
    setFilters: changeFilters,
    clearFilters,
    createSignal,
    cancelSignal,
    executeSignal,
    deleteSignal,
    refresh,
    changePage,
    clearError,
  };
}

export function useSignal(id: string) {
  const {
    selectedSignal,
    isLoading,
    error,
    fetchSignal,
    updateSignal,
    clearError,
  } = useSignalStore();

  useEffect(() => {
    if (id) {
      fetchSignal(id);
    }
  }, [id, fetchSignal]);

  const cancel = useCallback(async (): Promise<void> => {
    if (!selectedSignal) return;
    await signalsApi.cancelSignal(selectedSignal.id);
    updateSignal(selectedSignal.id, { status: 'CANCELLED' });
  }, [selectedSignal, updateSignal]);

  const execute = useCallback(async (): Promise<void> => {
    if (!selectedSignal) return;
    await signalsApi.executeSignal(selectedSignal.id);
    updateSignal(selectedSignal.id, { status: 'EXECUTED' });
  }, [selectedSignal, updateSignal]);

  const refresh = useCallback(() => {
    if (id) {
      fetchSignal(id);
    }
  }, [id, fetchSignal]);

  return {
    signal: selectedSignal,
    isLoading,
    error,
    cancel,
    execute,
    refresh,
    clearError,
  };
}
