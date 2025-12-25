
import { Trade, StrategyStatus } from '../../../types';

/**
 * 📉 SHER DECAY MONITOR
 * Responsibility: Detecting performance erosion in institutional logic nodes.
 */
export class DecayMonitor {
  private static readonly CRITICAL_WINRATE = 40;
  private static readonly RETIRE_WINRATE = 35;
  private static readonly LOOKBACK_WINDOW = 25; // Trades

  static evaluate(strategyName: string, trades: Trade[]): { score: number; status: StrategyStatus['status']; reason?: string } {
    const closedTrades = trades
      .filter(t => t.strategy === strategyName && t.status === 'CLOSED')
      .slice(-this.LOOKBACK_WINDOW);

    if (closedTrades.length < 5) return { score: 0, status: 'ACTIVE' };

    const historicalWinRate = 55; // Expected baseline for these algos
    const currentWins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const currentWinRate = (currentWins / closedTrades.length) * 100;

    // 1. Decay Score (0 = Perfect, 1 = Dead)
    // Measures drift from expected baseline
    const decayScore = Math.max(0, (historicalWinRate - currentWinRate) / historicalWinRate);

    // 2. Status Lifecycle
    let status: StrategyStatus['status'] = 'ACTIVE';
    let reason: string | undefined;

    // RULE: If winrate < 35% over last window, PERMANENT RETIREMENT
    if (currentWinRate < this.RETIRE_WINRATE && closedTrades.length >= 10) {
      status = 'RETIRED';
      reason = `Institutional Veto: Logic node retired. Win rate @ ${currentWinRate.toFixed(1)}% breached floor.`;
    } 
    // RULE: If winrate < 40%, Quarantine
    else if (currentWinRate < this.CRITICAL_WINRATE) {
      status = 'DISABLED';
      reason = `Quarantine: Performance drift detected. Shard gated.`;
    }

    return { score: decayScore, status, reason };
  }
}
