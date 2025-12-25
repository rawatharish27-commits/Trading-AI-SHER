import { MarketRegime } from '../probability/types';

export type MistakeType = 'REGIME_MISCLASSIFICATION' | 'FALSE_POSITIVE' | 'LATE_EXIT' | 'SLIPPAGE_EXCESS' | 'NOISE_TRIGGER';

export interface ExperienceShard {
  id: string;
  symbol: string;
  timestamp: number;
  regime: MarketRegime;
  strategyId: string;
  predictedProb: number;
  actualOutcome: 'PROFIT' | 'LOSS';
  pnlPoints: number;
  mistakeTags: MistakeType[];
  contextSnapshot: Record<string, number>; // Technical values at entry
}

export interface CalibrationStats {
  brierScore: number;      // 0 to 1 (lower is better calibrated)
  reliabilityIndex: number; // Reality vs Prediction gap
  regimePerformance: Record<MarketRegime, number>;
}