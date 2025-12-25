
import { EthicsStatus, TradeAnalytics } from '../../types';

class EthicsGuard {
  /**
   * Analyzes if a trade is statistically "too good" (overfitted) or if 
   * current market context makes the trade unethical/high-risk for capital.
   */
  evaluate(stats: TradeAnalytics, currentVolatility: number, avgVolatility: number): EthicsStatus {
    const overfitRisk = (stats.winRate > 75 && stats.totalTrades < 50) ? 0.8 : 0.1;
    const volatilitySpike = currentVolatility > avgVolatility * 2.5;

    let isAllowed = true;
    let reason = "ALL_SYSTEMS_GO";
    let adjustment = 1.0;

    if (overfitRisk > 0.7) {
      isAllowed = false;
      reason = "OVERFIT_DETECTED: Win rate statistically improbable for sample size.";
    } else if (volatilitySpike) {
      isAllowed = false;
      reason = "UNSTABLE_VOLATILITY: Ethics guard blocking trades in chaotic regime.";
    } else if (stats.winRate < 40 && stats.totalTrades > 20) {
      adjustment = 0.5; // Scale down size if performance is degrading
      reason = "PERFORMANCE_DEGRADATION: Scaled allocation 50%";
    }

    return {
      isAllowed,
      reason,
      overfitRisk,
      confidenceAdjustment: adjustment
    };
  }
}

export const ethicsGuard = new EthicsGuard();
