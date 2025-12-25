import { MarketRegime } from './types';

/**
 * 🛰️ REGIME DETECTOR
 * Goal: Decide if we are in a 'Tradable' environment.
 */
export class RegimeDetector {
  static detect(prices: number[], atr: number): MarketRegime {
    const lastPrice = prices[prices.length - 1];
    const atrPct = (atr / lastPrice) * 100;
    
    // 1. Panic Detection (High Volatility Spike)
    if (atrPct > 2.5) return 'PANIC';
    
    // 2. Trend Detection (Slope analysis)
    const lookback = 20;
    const first = prices[prices.length - lookback];
    const change = Math.abs((lastPrice - first) / first) * 100;
    
    if (change > 1.5 && atrPct < 1.2) return 'TREND';
    
    // 3. Expansion Detection
    if (atrPct > 1.2 && atrPct <= 2.5) return 'EXPANSION';

    // 4. Default: Chop / Range
    return 'CHOP';
  }
}