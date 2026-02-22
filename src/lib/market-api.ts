// Market Data API Service
import { api } from './api-client';

// Types
export interface Quote {
  symbol: string;
  exchange: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  prev_close: number;
  change: number;
  change_percent: number;
  volume: number;
  value: number;
  high_52week: number;
  low_52week: number;
  upper_circuit: number;
  lower_circuit: number;
  trade_time: string | null;
}

export interface OHLCV {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  change_percent: number;
}

export interface MarketMover {
  symbol: string;
  name: string;
  ltp: number;
  change: number;
  change_percent: number;
  volume: number;
}

export interface MarketStatus {
  is_open: boolean;
  session: 'PRE_MARKET' | 'NORMAL' | 'POST_MARKET' | 'CLOSED';
  next_open: string | null;
  next_close: string | null;
}

// Market API
export const marketApi = {
  // Get quote for a symbol
  async getQuote(symbol: string): Promise<Quote> {
    return api.get<Quote>(`/market/quote/${symbol}`);
  },

  // Get multiple quotes
  async getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
    return api.get<Record<string, Quote>>('/market/quotes', { symbols: symbols.join(',') });
  },

  // Get OHLCV data
  async getOHLCV(symbol: string, params?: {
    interval?: '1m' | '5m' | '15m' | '1h' | '1D';
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<OHLCV[]> {
    return api.get<OHLCV[]>(`/market/ohlcv/${symbol}`, params as any);
  },

  // Get market indices
  async getIndices(): Promise<MarketIndex[]> {
    return api.get<MarketIndex[]>('/market/indices');
  },

  // Get top gainers
  async getGainers(limit?: number): Promise<MarketMover[]> {
    return api.get<MarketMover[]>('/market/gainers', { limit });
  },

  // Get top losers
  async getLosers(limit?: number): Promise<MarketMover[]> {
    return api.get<MarketMover[]>('/market/losers', { limit });
  },

  // Get market status
  async getStatus(): Promise<MarketStatus> {
    return api.get<MarketStatus>('/market/status');
  },

  // Search symbols
  async searchSymbols(query: string): Promise<{
    symbol: string;
    name: string;
    exchange: string;
  }[]> {
    return api.get('/market/search', { q: query });
  },

  // Get market depth
  async getDepth(symbol: string): Promise<{
    bids: Array<{ price: number; quantity: number; orders: number }>;
    asks: Array<{ price: number; quantity: number; orders: number }>;
  }> {
    return api.get(`/market/depth/${symbol}`);
  },
};

export default marketApi;
