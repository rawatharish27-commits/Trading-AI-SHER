
export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE';

export interface StrategyContext {
  prices: number[];
  rsi: number;
  volatility: number;
  sma20: number;
  sma50: number;
  regime: MarketRegime;
}

export abstract class BaseStrategy {
  abstract name: string;
  abstract type: 'Momentum' | 'Mean Reversion' | 'Breakout';

  /**
   * Evaluates if the current market conditions are favorable for this strategy.
   * Returns a score between 0 (Bad fit) and 10 (Perfect fit).
   */
  abstract suitabilityScore(ctx: StrategyContext): number;
}

export class SMACrossRSIStrategy extends BaseStrategy {
  name = "SMA Cross + RSI";
  type: 'Momentum' = 'Momentum';

  suitabilityScore(ctx: StrategyContext): number {
    let score = 5;

    // Momentum strategies thrive in trending markets
    if (ctx.regime === 'BULL' || ctx.regime === 'BEAR') {
      score += 3;
    } else if (ctx.regime === 'SIDEWAYS') {
      score -= 3;
    }

    // Penalize for extreme volatility (whipsaw risk)
    if (ctx.volatility > 0.03) score -= 2; 
    else if (ctx.volatility < 0.01) score -= 1; // Too flat, no momentum

    // Check trend strength (SMA separation)
    const trendStrength = Math.abs(ctx.sma20 - ctx.sma50) / ctx.sma50;
    if (trendStrength > 0.005) score += 2;

    // Check RSI not overextended for entry (simplified)
    if (ctx.rsi > 70 || ctx.rsi < 30) score -= 1;

    return Math.max(0, Math.min(10, score));
  }
}

export class RSIBollingerStrategy extends BaseStrategy {
  name = "RSI Mean Reversion";
  type: 'Mean Reversion' = 'Mean Reversion';

  suitabilityScore(ctx: StrategyContext): number {
    let score = 5;

    // Mean reversion thrives in sideways/ranging markets
    if (ctx.regime === 'SIDEWAYS') {
      score += 4;
    } else if (ctx.regime === 'BULL' || ctx.regime === 'BEAR') {
      score -= 2; // Fighting the trend
    }

    // Volatility helps mean reversion (swing opportunities)
    if (ctx.volatility > 0.015 && ctx.volatility < 0.04) {
      score += 2;
    }

    // RSI Extremes are good for Mean Reversion potential
    if (ctx.rsi > 70 || ctx.rsi < 30) score += 1;

    return Math.max(0, Math.min(10, score));
  }
}

export class RangeBreakoutStrategy extends BaseStrategy {
    name = "Range Breakout";
    type: 'Breakout' = 'Breakout';
  
    suitabilityScore(ctx: StrategyContext): number {
      let score = 5;

      // Breakouts often happen after a squeeze (low vol -> high vol)
      // If we are currently Low Vol (Sideways), potential is high
      if (ctx.regime === 'SIDEWAYS' && ctx.volatility < 0.015) {
          score += 3;
      }
      
      // If already Volatile/Trending, breakout might have passed or be false
      if (ctx.regime === 'VOLATILE') score -= 2;

      // Price compressing near SMA usually precedes breakout
      const distToSMA = Math.abs(ctx.prices[ctx.prices.length-1] - ctx.sma20) / ctx.sma20;
      if (distToSMA < 0.005) score += 2;

      return Math.max(0, Math.min(10, score));
    }
}
