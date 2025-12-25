
import { Trade, StrategyStatus } from '../../types';
import { eventBus } from './eventBus';

export class IncrementalLearner {
  private static readonly ALPHA = 0.05; // Learning Rate

  /**
   * Incremental Update Rule:
   * W(t+1) = W(t) + Alpha * (NormalizedPnL - CostOfCapital)
   */
  static processOutcome(trades: Trade[], currentStrategies: StrategyStatus[]): StrategyStatus[] {
    const updated = currentStrategies.map(strat => {
      const relevantTrades = trades.filter(t => t.strategy === strat.name).slice(-5);
      if (relevantTrades.length === 0) return strat;

      const avgPnL = relevantTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / relevantTrades.length;
      const performanceFactor = avgPnL > 0 ? 1 : -1.5; // Heavier penalty for losses
      
      const weightDelta = this.ALPHA * performanceFactor;
      const newWeight = Math.max(0.5, Math.min(2.5, strat.weight + weightDelta));

      if (Math.abs(newWeight - strat.weight) > 0.01) {
        eventBus.emit('ml.model.updated', {
          strategy: strat.name,
          oldWeight: strat.weight,
          newWeight: newWeight,
          reason: avgPnL > 0 ? 'PnL Positive Reinforcement' : 'Drawdown Throttling'
        }, 'INCREMENTAL_LEARNER');
      }

      // Fix: Explicitly casting status to ACTIVE/DISABLED union type to satisfy StrategyStatus interface.
      return {
        ...strat,
        weight: parseFloat(newWeight.toFixed(2)),
        status: (newWeight < 0.6 ? 'DISABLED' : 'ACTIVE') as 'ACTIVE' | 'DISABLED'
      };
    });

    return updated;
  }
}
