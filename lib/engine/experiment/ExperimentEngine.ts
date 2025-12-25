import { ShadowPerformance } from '../../../types';

export class ExperimentEngine {
  private static readonly STORAGE_KEY = 'sher_shadow_strategy_stats';

  /**
   * Records the outcome of a shadow signal for future promotion to core.
   */
  static recordOutcome(strategyName: string, success: boolean) {
    const stats = this.getAllStats();
    const entry = stats[strategyName] || {
      strategyName,
      wins: 0,
      losses: 0,
      total: 0,
      winRate: 0,
      eligibleForCore: false
    };

    entry.total++;
    if (success) entry.wins++;
    else entry.losses++;

    entry.winRate = (entry.wins / entry.total) * 100;
    
    // Institutional Rule: Promote only if 30+ trades and 65%+ WinRate
    entry.eligibleForCore = entry.total >= 30 && entry.winRate >= 65;

    stats[strategyName] = entry;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
  }

  static getAllStats(): Record<string, ShadowPerformance> {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }
}