
import { Indicators, Candle } from './indicators';
import { StrategyDNA } from '../types';

export type MarketRegime = 'BULL' | 'BEAR' | 'SIDEWAYS' | 'VOLATILE' | 'COMPRESSION';

export interface StrategyContext {
  prices: number[];
  candles: Candle[];
  rsi: number;
  volatility: number;
  sma20: number;
  sma50: number;
  regime: MarketRegime;
  volumeDelta?: number;
  adx?: number;
  vwap?: number;
}

export abstract class BaseStrategy {
  abstract name: string;
  abstract type: 'Momentum' | 'Mean Reversion' | 'Breakout' | 'Smart Money';
  abstract dna: StrategyDNA;
  
  /**
   * Evaluates if conditions are met for a trade.
   * Based on the DNA of the strategy.
   */
  abstract checkConditions(ctx: StrategyContext): boolean;

  /**
   * Suitability score for the Meta-Brain.
   */
  abstract suitabilityScore(ctx: StrategyContext): number;
}

/**
 * STRATEGY GENOME - Top 10 Core Implementations
 */

// 1. VWAP Trend Ride
export class VWAPTrendRide extends BaseStrategy {
  name = "VWAP Trend Ride";
  type: 'Momentum' = 'Momentum';
  dna: StrategyDNA = {
    id: 'strat-vwap-001',
    name: this.name,
    indicators: ['VWAP', 'ADX', 'Volume Spike'],
    thresholds: { adx: 25, vol_spike: 1.5 },
    riskMultiplier: 1.2,
    evolutionGeneration: 4,
    fitness: 0.82
  };

  checkConditions(ctx: StrategyContext): boolean {
    const price = ctx.prices[ctx.prices.length - 1];
    return (
      price > (ctx.vwap || 0) &&
      (ctx.adx || 0) > this.dna.thresholds.adx &&
      (ctx.volumeDelta || 0) > this.dna.thresholds.vol_spike
    );
  }

  suitabilityScore(ctx: StrategyContext): number {
    return ctx.regime === 'BULL' ? 9 : (ctx.regime === 'BEAR' ? 3 : 1);
  }
}

// 2. EMA Pullback
export class EMAPullback extends BaseStrategy {
  name = "EMA Pullback";
  type: 'Momentum' = 'Momentum';
  dna: StrategyDNA = {
    id: 'strat-ema-pb-001',
    name: this.name,
    indicators: ['EMA 21', 'EMA 50', 'ATR'],
    thresholds: { pullback_depth: 0.2 },
    riskMultiplier: 1.0,
    evolutionGeneration: 7,
    fitness: 0.78
  };

  checkConditions(ctx: StrategyContext): boolean {
    const price = ctx.prices[ctx.prices.length - 1];
    const inTrend = price > ctx.sma20 && ctx.sma20 > ctx.sma50;
    const touchingEMA = Math.abs(price - ctx.sma20) / ctx.sma20 < 0.002;
    return inTrend && touchingEMA;
  }

  suitabilityScore(ctx: StrategyContext): number {
    return (ctx.regime === 'BULL' || ctx.regime === 'BEAR') ? 8 : 2;
  }
}

// 3. Range Breakout (NR7 + Squeeze)
export class RangeBreakout extends BaseStrategy {
  name = "Squeeze Breakout";
  type: 'Breakout' = 'Breakout';
  dna: StrategyDNA = {
    id: 'strat-sqz-001',
    name: this.name,
    indicators: ['NR7', 'Bollinger Squeeze', 'Volume'],
    thresholds: { squeeze_tightness: 0.012 },
    riskMultiplier: 1.5,
    evolutionGeneration: 5,
    fitness: 0.85
  };

  checkConditions(ctx: StrategyContext): boolean {
    return ctx.regime === 'COMPRESSION' && (ctx.volumeDelta || 0) > 1.8;
  }

  suitabilityScore(ctx: StrategyContext): number {
    return ctx.regime === 'COMPRESSION' ? 10 : 0;
  }
}

// 4. Liquidity Sweep Reversal
export class LiquiditySweepReversal extends BaseStrategy {
  name = "Liquidity Sweep";
  type: 'Smart Money' = 'Smart Money';
  dna: StrategyDNA = {
    id: 'strat-sm-ls-001',
    name: this.name,
    indicators: ['Liquidity Sweep', 'Order Block', 'Volume Climax'],
    thresholds: { wick_ratio: 2.5 },
    riskMultiplier: 0.8,
    evolutionGeneration: 12,
    fitness: 0.91
  };

  checkConditions(ctx: StrategyContext): boolean {
    if (ctx.candles.length === 0) return false;
    const lastCandle = ctx.candles[ctx.candles.length - 1];
    return Indicators.LiquiditySweep(lastCandle) && (ctx.volumeDelta || 0) > 2.0;
  }

  suitabilityScore(ctx: StrategyContext): number {
    return ctx.regime === 'VOLATILE' ? 9 : 4;
  }
}

export class SMACrossRSIStrategy extends BaseStrategy {
  name = "SMA Cross + RSI";
  type: 'Momentum' = 'Momentum';
  dna: StrategyDNA = {
    id: 'strat-sma-rsi-001',
    name: this.name,
    indicators: ['SMA 20', 'SMA 50', 'RSI'],
    thresholds: { rsi_buy: 40, rsi_sell: 60 },
    riskMultiplier: 1.0,
    evolutionGeneration: 1,
    fitness: 0.75
  };
  checkConditions(ctx: StrategyContext): boolean {
    return ctx.sma20 > ctx.sma50 && ctx.rsi > 50;
  }
  suitabilityScore(ctx: StrategyContext): number {
    return ctx.regime === 'BULL' ? 8 : 2;
  }
}

export class RSIBollingerStrategy extends BaseStrategy {
  name = "RSI + Bollinger";
  type: 'Mean Reversion' = 'Mean Reversion';
  dna: StrategyDNA = {
    id: 'strat-rsi-bb-001',
    name: this.name,
    indicators: ['RSI', 'Bollinger Bands'],
    thresholds: { rsi_low: 30, rsi_high: 70 },
    riskMultiplier: 0.9,
    evolutionGeneration: 2,
    fitness: 0.80
  };
  checkConditions(ctx: StrategyContext): boolean {
    return ctx.rsi < 30 || ctx.rsi > 70;
  }
  suitabilityScore(ctx: StrategyContext): number {
    return ctx.regime === 'SIDEWAYS' ? 9 : 3;
  }
}

export class RangeBreakoutStrategy extends RangeBreakout {}
export class SmartMoneyFlowStrategy extends LiquiditySweepReversal {}

export const STRATEGY_GENOME = {
  TREND: [
    "EMA Pullback", "VWAP Trend Ride", "SuperTrend Continuation", "ADX Trend Expansion",
    "HH-HL Structure Break", "Donchian Break Trend", "Ichimoku Cloud Break", "Moving Average Ribbon",
    "Trendline Retest", "Channel Break & Hold"
  ],
  BREAKOUT: [
    "Opening Range Breakout", "Range Compression Breakout", "Bollinger Squeeze Break", "NR7 Breakout",
    "Volume Breakout", "VWAP Break & Hold", "Box Consolidation Break", "Flag/Pennant Break",
    "Trend Continuation Break", "Gap Breakout"
  ],
  MEAN_REVERSION: [
    "Bollinger Mean Reversion", "RSI Extreme Reversal", "VWAP Fade", "Gap Fill",
    "Over-extended Candle Reversal", "Range Top/Bottom Fade", "Volume Exhaustion Fade", "Spike & Revert",
    "ATR Extreme Reversal", "Failed Breakout Reversal"
  ],
  SMART_MONEY: [
    "Liquidity Sweep + Reversal", "Stop Hunt Trap", "Fake Breakout Trap", "Absorption -> Break",
    "Order Block Retest", "FVG Fill & Move", "Large Player Entry Candle", "Inducement Move",
    "Range Liquidity Grab", "Break & Fail Trap"
  ]
};
