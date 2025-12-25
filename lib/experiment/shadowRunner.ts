import { ShadowStrategyStats } from '../../types';

/**
 * 🧪 SHADOW RUNNER
 * Operates on live market data but blocks all real order execution.
 * Collects "Strategy Reputation" over time.
 */
class ShadowRunner {
  private static readonly STORAGE_KEY = 'sher_shadow_reputation';
  private static readonly PROMOTION_TRADES = 30;
  private static readonly PROMOTION_WINRATE = 65;

  static recordSignal(strategyName: string, outcome: 'WIN' | 'LOSS', regime: string) {
    const stats = this.getAllStats();
    const entry = stats[strategyName] || {
      strategy: strategyName,
      accuracy: 0,
      trades: 0,
      winRate: 0,
      eligibleForPromotion: false,
      regimeBias: {}
    };

    entry.trades++;
    const wins = Math.round(entry.winRate * (entry.trades - 1) / 100) + (outcome === 'WIN' ? 1 : 0);
    entry.winRate = (wins / entry.trades) * 100;
    entry.accuracy = entry.winRate; // Normalized
    
    // Regime tracking
    entry.regimeBias[regime] = (entry.regimeBias[regime] || 0) + (outcome === 'WIN' ? 1 : -1);

    // Promotion logic
    entry.eligibleForPromotion = entry.trades >= this.PROMOTION_TRADES && entry.winRate >= this.PROMOTION_WINRATE;

    stats[strategyName] = entry;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
  }

  static getAllStats(): Record<string, ShadowStrategyStats> {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }
}

export { ShadowRunner };