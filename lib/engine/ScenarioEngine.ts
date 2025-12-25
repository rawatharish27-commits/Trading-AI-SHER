
import { EvidenceCluster } from '../../types';

export class ScenarioEngine {
  /**
   * Adjusts the final probability based on 'Conflict' in the indicator clusters.
   */
  static applyHarmonyPenalty(baseProb: number, cluster: EvidenceCluster): number {
    /** 🧠 Fixed: Protected access to optional harmonyScore property with nullish coalescing */
    const harmony = cluster.harmonyScore ?? 1;
    // If indicators are fighting (Harmony < 0.6), penalize the trade
    if (harmony < 0.6) {
        const penalty = (0.6 - harmony) * 20; // Up to 12% penalty
        return Math.max(0, baseProb - penalty);
    }
    return baseProb;
  }

  /**
   * Institutional Safeguard: Block trades during extreme volatility.
   */
  static isEnvironmentSafe(cluster: EvidenceCluster): boolean {
    /** 🧠 Fixed: Protected access to optional volatility property with nullish coalescing */
    if ((cluster.volatility ?? 0) > 0.85) return false; // Too risky
    return true;
  }
}
