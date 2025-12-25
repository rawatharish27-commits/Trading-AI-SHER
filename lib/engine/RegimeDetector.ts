import { Candle } from "../indicators";

export type MarketRegime = 'TREND' | 'RANGE' | 'PANIC' | 'LOW_LIQUIDITY';

export interface RegimeAnalysis {
  state: MarketRegime;
  volatilityIndex: number;
  momentumStrength: number;
  description: string;
}

/**
 * 🦁 REGIME DETECTOR
 * Classifies market topology to adjust strategy thresholds.
 */
export class RegimeDetector {
  static analyze(candles: Candle[]): RegimeAnalysis {
    if (candles.length < 20) return { state: 'RANGE', volatilityIndex: 0, momentumStrength: 0, description: 'Calibrating...' };

    const prices = candles.map(c => c.close);
    const lastPrice = prices[prices.length - 1];
    
    // Calculate Volatility (Standard Deviation of returns)
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const vol = Math.sqrt(variance);

    // Calculate Momentum (Rate of change)
    const momentum = (lastPrice - prices[prices.length - 10]) / prices[prices.length - 10];

    // Regime Logic
    if (vol > 0.025) return { state: 'PANIC', volatilityIndex: vol, momentumStrength: momentum, description: 'High entropy detected. Institutional liquidation probable.' };
    if (Math.abs(momentum) > 0.015) return { state: 'TREND', volatilityIndex: vol, momentumStrength: momentum, description: 'Linear progression identified. Momentum sharding active.' };
    if (vol < 0.005) return { state: 'LOW_LIQUIDITY', volatilityIndex: vol, momentumStrength: momentum, description: 'Bid/Ask gaps widening. Execution risk high.' };

    return { state: 'RANGE', volatilityIndex: vol, momentumStrength: momentum, description: 'Cluster absorption. Mean reversion preferred.' };
  }
}