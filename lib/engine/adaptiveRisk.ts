
import { RiskConfig, TradeAnalytics } from '../../types';

export class AdaptiveRiskEngine {
  private static readonly RECENT_TRADES_LOOKBACK = 10;
  private static readonly WIN_RATE_THRESHOLD = 45;
  private static readonly PROFIT_FACTOR_FLOOR = 1.2;

  /**
   * Recalculates the user's risk multiplier based on performance drift.
   * Feedback loop: Returns a multiplier [0.5, 1.2]
   */
  static optimizeRisk(stats: TradeAnalytics, currentRegime: 'NORMAL' | 'CHAOTIC' | 'TRENDING'): number {
    let multiplier = 1.0;

    // 1. Performance Throttling
    if (stats.winRate < this.WIN_RATE_THRESHOLD) multiplier *= 0.85;
    if (stats.profitFactor < this.PROFIT_FACTOR_FLOOR) multiplier *= 0.9;
    
    // 2. Regime Awareness
    if (currentRegime === 'CHAOTIC') multiplier *= 0.7;
    else if (currentRegime === 'TRENDING') multiplier *= 1.1;

    // 3. Loss Streak Penalty (Simulated lookback)
    const recentLossStreak = stats.winRate < 40 ? 3 : 0; 
    if (recentLossStreak >= 3) multiplier *= 0.6;

    // Institutional Safety Caps
    return Math.max(0.5, Math.min(1.2, multiplier));
  }

  /**
   * Adaptive Position Sizing: Position = Capital * Multiplier * Confidence
   */
  static calculatePositionSize(
    capital: number, 
    entryPrice: number, 
    slPoints: number, 
    confidence: number,
    perfMultiplier: number
  ): number {
    if (!capital || slPoints <= 0) return 0;
    
    // Base 1% Risk Model
    const baseRiskAmt = capital * 0.01;
    const finalRiskAmt = baseRiskAmt * perfMultiplier * (confidence / 100);
    
    return Math.floor(finalRiskAmt / slPoints);
  }

  /**
   * Global Kill-Switch Guard
   */
  static shouldHardStop(monthlyDrawdown: number): boolean {
    return monthlyDrawdown >= 6.0;
  }
}
