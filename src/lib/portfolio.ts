import { api } from './api';
import { Portfolio, Position, PositionDetail, PortfolioSummary, Transaction } from '@/types/portfolio';

export const portfolioApi = {
  /**
   * Get portfolio overview
   */
  async getPortfolio(): Promise<Portfolio> {
    const response = await api.get<Portfolio>('/portfolio');
    return response.data;
  },

  /**
   * Get all positions
   */
  async getPositions(): Promise<Position[]> {
    const response = await api.get<Position[]>('/portfolio/positions');
    return response.data;
  },

  /**
   * Get a single position by symbol
   */
  async getPosition(symbol: string): Promise<PositionDetail> {
    const response = await api.get<PositionDetail>(`/portfolio/positions/${symbol}`);
    return response.data;
  },

  /**
   * Get portfolio summary
   */
  async getSummary(): Promise<PortfolioSummary> {
    const response = await api.get<PortfolioSummary>('/portfolio/summary');
    return response.data;
  },

  /**
   * Get transaction history
   */
  async getTransactions(limit?: number): Promise<Transaction[]> {
    const response = await api.get<Transaction[]>('/portfolio/transactions', {
      ...(limit && { limit }),
    });
    return response.data;
  },

  /**
   * Get position history
   */
  async getPositionHistory(symbol: string, days?: number): Promise<{
    symbol: string;
    history: { date: string; value: number; pnl: number }[];
  }> {
    const response = await api.get<{
      symbol: string;
      history: { date: string; value: number; pnl: number }[];
    }>(`/portfolio/positions/${symbol}/history`, {
      ...(days && { days }),
    });
    return response.data;
  },

  /**
   * Get portfolio performance chart data
   */
  async getPerformance(period?: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'): Promise<{
    data: { date: string; value: number; pnl: number }[];
    summary: {
      startValue: number;
      endValue: number;
      totalReturn: number;
      totalReturnPercent: number;
    };
  }> {
    const response = await api.get<{
      data: { date: string; value: number; pnl: number }[];
      summary: {
        startValue: number;
        endValue: number;
        totalReturn: number;
        totalReturnPercent: number;
      };
    }>('/portfolio/performance', {
      ...(period && { period }),
    });
    return response.data;
  },
};
