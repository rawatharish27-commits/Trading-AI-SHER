
import { Trade } from "../../../types";

/**
 * 🏛️ SURVIVAL GUARD (Priority #5)
 * Detects loss clusters and automatically throttles AI aggressiveness.
 */
export class SurvivalGuard {
  private static readonly CLUSTER_THRESHOLD = 2; // Max losses in recent window
  private static readonly WINDOW_SIZE = 3;

  static evaluate(recentTrades: Trade[]): { score: number; passed: boolean; penalty: number; reason: string } {
    const window = recentTrades.slice(-this.WINDOW_SIZE);
    const losses = window.filter(t => (t.pnl || 0) < 0).length;
    
    const isUnderStress = losses >= this.CLUSTER_THRESHOLD;
    
    // Penalty is the probability threshold increase (e.g. signal needs +7% more prob to pass)
    const penalty = isUnderStress ? 0.07 : 0;
    const passed = !isUnderStress;

    return {
      score: passed ? 1.0 : 0.5,
      passed,
      penalty,
      reason: passed 
        ? "Account survival index optimal. Logic nodes authorized for full frequency."
        : `Loss cluster detected (${losses}/${this.WINDOW_SIZE}). Firm defensive mode engaged: +7% Probability Floor.`
    };
  }
}
