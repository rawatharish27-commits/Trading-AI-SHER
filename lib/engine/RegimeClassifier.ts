import { AIFeatureVector } from "../features/featureEngine";

export type MarketRegimeType = 'TRENDING' | 'CHOPPY' | 'PANIC';

export interface RegimeSnapshot {
  current: MarketRegimeType;
  volatility: number;
  momentum: number;
  volumeSpike: number;
  reason: string;
}

/**
 * 🦁 REGIME CLASSIFIER
 * Decides the 'Climate' of the market to filter out-of-context strategies.
 */
export class RegimeClassifier {
  static classify(features: AIFeatureVector): RegimeSnapshot {
    const vol = features.volatility;
    const mom = Math.abs(features.trendScore);
    const lp = features.liquidityPressure;

    // 1. PANIC DETECTION (High Vol + High Liquidity Pressure)
    if (vol > 0.03 && lp > 1.8) {
      return {
        current: 'PANIC',
        volatility: vol,
        momentum: mom,
        volumeSpike: lp,
        reason: 'Extreme volatility expansion detected. Institutional liquidity evaporation.'
      };
    }

    // 2. TREND DETECTION (Stable Vol + Strong Directional Momentum)
    if (mom > 0.005 && vol < 0.025) {
      return {
        current: 'TRENDING',
        volatility: vol,
        momentum: mom,
        volumeSpike: lp,
        reason: 'Persistence detected in directional flow. Low entropy trend.'
      };
    }

    // 3. CHOP DETECTION (Default / Mean Reversion)
    return {
      current: 'CHOPPY',
      volatility: vol,
      momentum: mom,
      volumeSpike: lp,
      reason: 'Directional exhaustion. Market sharding into range clusters.'
    };
  }

  /**
   * Institutional Strategy Gate
   */
  static isStrategyAllowed(strategyType: string, regime: MarketRegimeType): boolean {
    const map: Record<MarketRegimeType, string[]> = {
      TRENDING: ['Momentum', 'Breakout'],
      CHOPPY: ['Mean Reversion', 'Smart Money'],
      PANIC: [] // Hard-stop for all standard retail logic
    };
    return map[regime]?.includes(strategyType) || false;
  }
}