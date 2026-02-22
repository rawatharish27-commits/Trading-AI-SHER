'use client';

import { useCallback, useEffect } from 'react';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { portfolioApi } from '@/lib/portfolio';
import { Position } from '@/types/portfolio';

export function usePortfolio() {
  const {
    portfolio,
    positions,
    summary,
    isLoading,
    error,
    fetchPortfolio,
    fetchPositions,
    fetchSummary,
    updatePosition,
    addPosition,
    removePosition,
    updatePortfolioValue,
    clearError,
  } = usePortfolioStore();

  // Initial fetch
  useEffect(() => {
    fetchPortfolio();
    fetchPositions();
    fetchSummary();
  }, [fetchPortfolio, fetchPositions, fetchSummary]);

  const refresh = useCallback(async () => {
    await Promise.all([
      fetchPortfolio(),
      fetchPositions(),
      fetchSummary(),
    ]);
  }, [fetchPortfolio, fetchPositions, fetchSummary]);

  const getPosition = useCallback((symbol: string): Position | undefined => {
    return positions.find((p) => p.symbol === symbol);
  }, [positions]);

  const getTotalValue = useCallback((): number => {
    return portfolio?.totalValue || 0;
  }, [portfolio]);

  const getPnl = useCallback((): { total: number; percent: number; day: number; dayPercent: number } => {
    return {
      total: portfolio?.totalPnl || 0,
      percent: portfolio?.totalPnlPercent || 0,
      day: portfolio?.dayPnl || 0,
      dayPercent: portfolio?.dayPnlPercent || 0,
    };
  }, [portfolio]);

  const getCashBalance = useCallback((): number => {
    return portfolio?.cashBalance || 0;
  }, [portfolio]);

  const getInvestedValue = useCallback((): number => {
    return portfolio?.investedValue || 0;
  }, [portfolio]);

  return {
    portfolio,
    positions,
    summary,
    isLoading,
    error,
    refresh,
    getPosition,
    getTotalValue,
    getPnl,
    getCashBalance,
    getInvestedValue,
    updatePosition,
    addPosition,
    removePosition,
    updatePortfolioValue,
    clearError,
  };
}

export function usePositions() {
  const {
    positions,
    isLoading,
    error,
    fetchPositions,
    clearError,
  } = usePortfolioStore();

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const refresh = useCallback(() => {
    fetchPositions();
  }, [fetchPositions]);

  const getBySymbol = useCallback((symbol: string) => {
    return positions.find((p) => p.symbol === symbol);
  }, [positions]);

  const getPositivePositions = useCallback(() => {
    return positions.filter((p) => p.unrealizedPnl > 0);
  }, [positions]);

  const getNegativePositions = useCallback(() => {
    return positions.filter((p) => p.unrealizedPnl < 0);
  }, [positions]);

  const getTotalUnrealizedPnl = useCallback((): number => {
    return positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  }, [positions]);

  return {
    positions,
    isLoading,
    error,
    refresh,
    getBySymbol,
    getPositivePositions,
    getNegativePositions,
    getTotalUnrealizedPnl,
    clearError,
  };
}
