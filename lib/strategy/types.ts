import { MarketRegime } from '../probability/types';

export type StrategyCategory = 'TREND' | 'MEAN_REVERSION' | 'SMART_MONEY' | 'VOLATILITY';
export type StrategyDirection = 'BUY' | 'SELL' | 'NEUTRAL';

export interface StrategyOpinion {
  strategyId: string;
  direction: StrategyDirection;
  confidence: number;      // 0.0 - 1.0
  evidenceStrength: number; // 0.0 - 1.0
  regimeFit: number;       // 0.0 - 1.0 (How well this logic works in current regime)
}

export interface StrategyMetadata {
  id: string;
  name: string;
  category: StrategyCategory;
  supportedRegimes: MarketRegime[];
  weight: number;          // Institutional importance
  minConfidence: number;   // Threshold to be taken seriously
}

export interface EnsembleDecision {
  decision: 'BUY' | 'SELL' | 'NO_TRADE';
  consensusStrength: number;
  votes: Record<StrategyDirection, number>;
  opinions: StrategyOpinion[];
  reason: string;
}