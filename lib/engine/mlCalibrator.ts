
import { StrategyStatus } from '../../types';

export class MLCalibrator {
  /**
   * Refines strategy weights based on recent time-series performance.
   * Institutional Rule: Penalize strategies that 'churn' capital without alpha.
   */
  static calibrate(currentStats: StrategyStatus[]): StrategyStatus[] {
    return currentStats.map(strat => {
      let weight = strat.weight || 1.0;

      // 1. Profit Factor Multiplier
      if (strat.profitFactor > 2.0) weight *= 1.1;
      else if (strat.profitFactor < 1.2) weight *= 0.9;

      // 2. Win-Rate Consistency
      if (strat.winRate < 45) weight *= 0.85; // Heavy penalty for accuracy drop

      // 3. Expectancy Floor
      if (strat.expectancy < 0.1) weight = 0.5; // Minimum viable weight

      return {
        ...strat,
        weight: Math.max(0.5, Math.min(2.5, weight)) // Institutional safety caps
      };
    });
  }
}
