import { ExperienceShard } from './types';
import { eventBus } from '../engine/eventBus';

/**
 * 📉 ALPHA DECAY MONITOR
 * Goal: Identify when a logic node is no longer 'fit' for the market.
 */
export class AlphaDecayMonitor {
  private static readonly DECAY_THRESHOLD = 0.40; // Retire if win-rate < 40%
  private static readonly GRACE_PERIOD_TRADES = 10;

  static evaluate(strategyId: string, history: ExperienceShard[]): { status: 'HEALTHY' | 'DEGRADING' | 'RETIRED'; score: number } {
    const stratHistory = history.filter(h => h.strategyId === strategyId).slice(-20);
    
    if (stratHistory.length < this.GRACE_PERIOD_TRADES) {
      return { status: 'HEALTHY', score: 1.0 };
    }

    const wins = stratHistory.filter(h => h.actualOutcome === 'PROFIT').length;
    const winRate = wins / stratHistory.length;

    if (winRate < this.DECAY_THRESHOLD) {
      eventBus.emit('audit.log', { msg: `STRATEGY_RETIRED: ${strategyId} win-rate @ ${winRate.toFixed(2)}`, severity: 'CRITICAL' }, 'DECAY_MONITOR');
      return { status: 'RETIRED', score: winRate };
    }

    if (winRate < 0.50) {
      return { status: 'DEGRADING', score: winRate };
    }

    return { status: 'HEALTHY', score: winRate };
  }
}