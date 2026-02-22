// Portfolio API Service
import { api } from './api-client';

// Types
export type PositionSide = 'LONG' | 'SHORT';
export type PositionStatus = 'OPEN' | 'PARTIALLY_CLOSED' | 'CLOSED' | 'LIQUIDATED';

export interface Position {
  id: number;
  user_id: number;
  symbol: string;
  exchange: string;
  side: PositionSide;
  status: PositionStatus;
  quantity: number;
  open_quantity: number;
  closed_quantity: number;
  entry_price: number;
  current_price: number;
  exit_price: number | null;
  avg_exit_price: number;
  stop_loss: number | null;
  trailing_sl: number | null;
  target: number | null;
  realized_pnl: number;
  unrealized_pnl: number;
  pnl_percent: number;
  entry_time: string;
  exit_time: string | null;
  broker: string;
}

export interface Portfolio {
  id: number;
  user_id: number;
  name: string;
  initial_capital: number;
  current_capital: number;
  available_capital: number;
  invested_capital: number;
  total_pnl: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_return_percent: number;
  max_drawdown: number;
  max_drawdown_percent: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  risk_per_trade: number;
  max_positions: number;
  auto_trade_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioStats {
  portfolio: Portfolio;
  positions: Position[];
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  open_positions: number;
  active_signals: number;
  pending_orders: number;
}

export interface PositionListResponse {
  positions: Position[];
  total: number;
  total_pnl: number;
  total_invested: number;
}

// Portfolio API
export const portfolioApi = {
  // Get portfolio
  async getPortfolio(): Promise<Portfolio> {
    return api.get<Portfolio>('/portfolio');
  },

  // Get portfolio statistics
  async getStats(): Promise<PortfolioStats> {
    return api.get<PortfolioStats>('/portfolio/stats');
  },

  // Get positions
  async getPositions(): Promise<PositionListResponse> {
    return api.get<PositionListResponse>('/portfolio/positions');
  },

  // Get open positions
  async getOpenPositions(): Promise<Position[]> {
    return api.get<Position[]>('/portfolio/positions/open');
  },

  // Get single position
  async getPosition(id: number): Promise<Position> {
    return api.get<Position>(`/portfolio/positions/${id}`);
  },

  // Close position
  async closePosition(id: number, data?: { quantity?: number }): Promise<Position> {
    return api.post<Position>(`/portfolio/positions/${id}/close`, data);
  },

  // Update position (stop loss, target)
  async updatePosition(id: number, data: {
    stop_loss?: number;
    target?: number;
    trailing_sl?: number;
  }): Promise<Position> {
    return api.patch<Position>(`/portfolio/positions/${id}`, data);
  },

  // Get portfolio history
  async getHistory(params?: {
    start_date?: string;
    end_date?: string;
    interval?: 'daily' | 'weekly' | 'monthly';
  }): Promise<{
    date: string;
    capital: number;
    pnl: number;
    cumulative_pnl: number;
  }[]> {
    return api.get('/portfolio/history', params as any);
  },

  // Get performance metrics
  async getPerformance(): Promise<{
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    win_rate: number;
    profit_factor: number;
    avg_win: number;
    avg_loss: number;
    largest_win: number;
    largest_loss: number;
  }> {
    return api.get('/portfolio/performance');
  },
};

export default portfolioApi;
