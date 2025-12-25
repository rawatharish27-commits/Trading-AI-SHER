
import { StrategyMetrics } from '../../types';

export class StrategyScorer {
  /**
   * Calculates institutional fitness score for a strategy.
   * Weightage: 40% WinRate, 30% Expectancy, -30% Drawdown
   */
  static calculateScore(metrics: Omit<StrategyMetrics, 'id' | 'score' | 'status'>): number {
    const winRateFactor = metrics.winRate / 100;
    const expectancyFactor = Math.min(1, metrics.expectancy / 5); // Normalized
    const drawdownPenalty = (metrics.drawdown / 10); // Penalty increases with DD

    const rawScore = (winRateFactor * 0.4) + (expectancyFactor * 0.3) - (drawdownPenalty * 0.3);
    return Math.max(0, Math.min(1, rawScore));
  }
}
