// Signals API Service
import { api } from './api-client';

// Types
export type SignalAction = 'BUY' | 'SELL' | 'HOLD';
export type SignalDirection = 'LONG' | 'SHORT' | 'NEUTRAL';
export type SignalStatus = 'PENDING' | 'ACTIVE' | 'HIT_TARGET' | 'STOPPED_OUT' | 'EXPIRED' | 'CANCELLED';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
export type MarketRegime = 'TRENDING' | 'MEAN_REVERTING' | 'CHOPPY' | 'PANIC';

export interface Signal {
  id: number;
  user_id: number;
  trace_id: string;
  symbol: string;
  exchange: string;
  action: SignalAction;
  direction: SignalDirection;
  status: SignalStatus;
  probability: number;
  confidence: number;
  confidence_level: ConfidenceLevel;
  risk_level: RiskLevel;
  risk_warning: string | null;
  entry_price: number;
  stop_loss: number;
  target_1: number;
  target_2: number;
  target_3: number | null;
  market_regime: MarketRegime;
  strategy: string;
  evidence_count: number;
  reasoning: string | null;
  quantity: number | null;
  allocated_capital: number | null;
  signal_time: string;
  expiry_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignalListResponse {
  signals: Signal[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface SignalStatsResponse {
  total: number;
  active: number;
  hit_target: number;
  stopped_out: number;
  expired: number;
  win_rate: number;
  avg_probability: number;
  avg_confidence: number;
  by_strategy: Record<string, number>;
  by_symbol: Record<string, number>;
}

export interface SignalFilter {
  status?: SignalStatus;
  action?: SignalAction;
  symbol?: string;
  min_probability?: number;
  max_probability?: number;
  risk_level?: RiskLevel;
  strategy?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

// Signals API
export const signalsApi = {
  // Get all signals
  async getSignals(params?: SignalFilter): Promise<SignalListResponse> {
    return api.get<SignalListResponse>('/signals', params as any);
  },

  // Get single signal
  async getSignal(id: number): Promise<Signal> {
    return api.get<Signal>(`/signals/${id}`);
  },

  // Get signal by trace_id
  async getSignalByTraceId(traceId: string): Promise<Signal> {
    return api.get<Signal>(`/signals/trace/${traceId}`);
  },

  // Get active signals
  async getActiveSignals(): Promise<Signal[]> {
    return api.get<Signal[]>('/signals/active');
  },

  // Generate new signal (AI)
  async generateSignal(symbol: string): Promise<Signal> {
    return api.post<Signal>('/signals/generate', { symbol });
  },

  // Update signal
  async updateSignal(id: number, data: Partial<Signal>): Promise<Signal> {
    return api.patch<Signal>(`/signals/${id}`, data);
  },

  // Cancel signal
  async cancelSignal(id: number): Promise<Signal> {
    return api.post<Signal>(`/signals/${id}/cancel`);
  },

  // Get signal statistics
  async getStats(): Promise<SignalStatsResponse> {
    return api.get<SignalStatsResponse>('/signals/stats');
  },

  // Get signals by symbol
  async getBySymbol(symbol: string, params?: { page?: number; page_size?: number }): Promise<SignalListResponse> {
    return api.get<SignalListResponse>(`/signals/symbol/${symbol}`, params as any);
  },
};

export default signalsApi;
