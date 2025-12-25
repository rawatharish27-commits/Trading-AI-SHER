export type MarketRegime = 'TREND' | 'CHOP' | 'PANIC' | 'EXPANSION';

export interface ProbabilityShard {
  final: number;       // 0.0 - 1.0 (0.5 is Neutral)
  prior: number;       // P(H)
  uncertainty: number; // Entropy (0.0 - 1.0)
  regime: MarketRegime;
  evidenceCount: number;
}

export interface EvidenceShard {
  id: string;
  source: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  strength: number; // 0.0 - 1.0
  weight: number;   // Importance multiplier
}