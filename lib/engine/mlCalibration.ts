
import { StrategyStatus } from '../../types';

export class MLCalibration {
  /**
   * Calibrates strategy weights based on session outcomes.
   * Institutional Rule: Penalize strategies with < 1.2 Profit Factor.
   */
  static calibrateWeights(strategies: StrategyStatus[]): StrategyStatus[] {
    return strategies.map(strat => {
      let weight = strat.weight || 1.0;

      // Rule 1: Win-rate Calibration
      if (strat.winRate > 65) weight += 0.05;
      else if (strat.winRate < 45) weight -= 0.10;

      // Rule 2: Profit Factor Decay
      if (strat.profitFactor < 1.1) weight *= 0.9;
      
      // Rule 3: Expectancy Floor
      if (strat.expectancy < 0) weight = 0.5; // Minimum viable weight

      return {
        ...strat,
        weight: Math.max(0.5, Math.min(2.0, weight)),
        status: weight < 0.6 ? 'DISABLED' : 'ACTIVE',
        reason: weight < 0.6 ? 'Automatic ML Weight Decay: Strategy under-performing market regime.' : strat.reason
      };
    });
  }
}
