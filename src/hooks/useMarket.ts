'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMarketStore } from '@/store/useMarketStore';
import { marketApi } from '@/lib/market';
import { MarketQuote, MarketChartData, MarketOverview } from '@/types/market';

export function useMarket() {
  const {
    overview,
    isLoading,
    error,
    fetchOverview,
    clearError,
  } = useMarketStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const refresh = useCallback(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    isLoading,
    error,
    refresh,
    clearError,
  };
}

export function useQuote(symbol: string | null) {
  const {
    quotes,
    fetchQuote,
    isLoading,
    error,
    clearError,
  } = useMarketStore();

  const quote = symbol ? quotes[symbol] : null;

  useEffect(() => {
    if (symbol && !quotes[symbol]) {
      fetchQuote(symbol);
    }
  }, [symbol, quotes, fetchQuote]);

  const refresh = useCallback(() => {
    if (symbol) {
      fetchQuote(symbol);
    }
  }, [symbol, fetchQuote]);

  return {
    quote,
    isLoading,
    error,
    refresh,
    clearError,
  };
}

export function useQuotes(symbols: string[]) {
  const {
    quotes,
    fetchQuotes,
    isLoading,
    error,
    clearError,
  } = useMarketStore();

  useEffect(() => {
    if (symbols.length > 0) {
      fetchQuotes(symbols);
    }
  }, [symbols.join(','), fetchQuotes]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(() => {
    if (symbols.length > 0) {
      fetchQuotes(symbols);
    }
  }, [symbols, fetchQuotes]);

  const getQuote = useCallback((symbol: string): MarketQuote | undefined => {
    return quotes[symbol];
  }, [quotes]);

  return {
    quotes,
    getQuote,
    isLoading,
    error,
    refresh,
    clearError,
  };
}

export function useChartData(symbol: string, interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1M') {
  const [data, setData] = useState<MarketChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const chartData = await marketApi.getChartData(symbol, interval);
      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    isLoading,
    error,
    refresh: fetch,
  };
}

export function useWatchlist() {
  const {
    watchlist,
    fetchWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    error,
    clearError,
  } = useMarketStore();

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const add = useCallback(async (symbol: string, notes?: string) => {
    await addToWatchlist(symbol, notes);
  }, [addToWatchlist]);

  const remove = useCallback(async (symbol: string) => {
    await removeFromWatchlist(symbol);
  }, [removeFromWatchlist]);

  return {
    watchlist,
    add,
    remove,
    error,
    clearError,
  };
}

export function useSymbolSearch() {
  const [results, setResults] = useState<{ symbol: string; name: string; exchange: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await marketApi.searchSymbols(query);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    isLoading,
    error,
    search,
    clear,
  };
}
