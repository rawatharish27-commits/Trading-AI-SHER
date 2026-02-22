import { api } from './api';
import { MarketQuote, MarketChartData, MarketOverview, Watchlist, MarketMover } from '@/types/market';

export const marketApi = {
  /**
   * Get market quote for a symbol
   */
  async getQuote(symbol: string): Promise<MarketQuote> {
    const response = await api.get<MarketQuote>(`/market/quote/${symbol}`);
    return response.data;
  },

  /**
   * Get multiple quotes
   */
  async getQuotes(symbols: string[]): Promise<MarketQuote[]> {
    const response = await api.get<MarketQuote[]>('/market/quotes', {
      symbols: symbols.join(','),
    });
    return response.data;
  },

  /**
   * Get chart data for a symbol
   */
  async getChartData(
    symbol: string,
    interval: '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1M' = '1d',
    range?: string
  ): Promise<MarketChartData> {
    const response = await api.get<MarketChartData>(`/market/chart/${symbol}`, {
      interval,
      ...(range && { range }),
    });
    return response.data;
  }

  /**
   * Get market overview
   */,
  async getOverview(): Promise<MarketOverview> {
    const response = await api.get<MarketOverview>('/market/overview');
    return response.data;
  }

  /**
   * Get top gainers
   */,
  async getTopGainers(limit?: number): Promise<MarketMover[]> {
    const response = await api.get<MarketMover[]>('/market/gainers', {
      ...(limit && { limit }),
    });
    return response.data;
  }

  /**
   * Get top losers
   */,
  async getTopLosers(limit?: number): Promise<MarketMover[]> {
    const response = await api.get<MarketMover[]>('/market/losers', {
      ...(limit && { limit }),
    });
    return response.data;
  }

  /**
   * Get most active stocks
   */,
  async getMostActive(limit?: number): Promise<MarketMover[]> {
    const response = await api.get<MarketMover[]>('/market/active', {
      ...(limit && { limit }),
    });
    return response.data;
  }

  /**
   * Get user watchlist
   */,
  async getWatchlist(): Promise<Watchlist[]> {
    const response = await api.get<Watchlist[]>('/market/watchlist');
    return response.data;
  }

  /**
   * Add symbol to watchlist
   */,
  async addToWatchlist(symbol: string, notes?: string): Promise<Watchlist> {
    const response = await api.post<Watchlist>('/market/watchlist', { symbol, notes });
    return response.data;
  }

  /**
   * Remove symbol from watchlist
   */,
  async removeFromWatchlist(symbol: string): Promise<void> {
    await api.delete(`/market/watchlist/${symbol}`);
  }

  /**
   * Search symbols
   */,
  async searchSymbols(query: string): Promise<{ symbol: string; name: string; exchange: string }[]> {
    const response = await api.get<{ symbol: string; name: string; exchange: string }[]>(
      '/market/search',
      { q: query }
    );
    return response.data;
  }
};
