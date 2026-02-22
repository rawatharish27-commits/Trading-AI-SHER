// Signal types
export type SignalType = 'BUY' | 'SELL' | 'HOLD';
export type SignalStatus = 'ACTIVE' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
export type SignalSource = 'AI' | 'MANUAL' | 'STRATEGY';
export type SignalConfidence = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface Signal {
  id: string;
  symbol: string;
  type: SignalType;
  status: SignalStatus;
  source: SignalSource;
  confidence: SignalConfidence;
  confidenceScore: number; // 0-100
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  reason?: string;
  strategy?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  executedAt?: string;
}

export interface SignalDetail extends Signal {
  analysis: {
    technicalIndicators: Record<string, number>;
    fundamentalData: Record<string, unknown>;
    sentiment: {
      score: number;
      label: 'BEARISH' | 'NEUTRAL' | 'BULLISH';
    };
  };
  performance: {
    pnl?: number;
    pnlPercent?: number;
    maxDrawdown?: number;
    holdingPeriod?: number;
  };
  relatedSignals: Signal[];
}

export interface SignalFilters {
  symbol?: string;
  type?: SignalType;
  status?: SignalStatus;
  source?: SignalSource;
  confidence?: SignalConfidence;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateSignalInput {
  symbol: string;
  type: SignalType;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  quantity: number;
  reason?: string;
  strategy?: string;
  expiresAt?: string;
}
