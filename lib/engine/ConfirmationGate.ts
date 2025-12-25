import { MarketRegime } from "./RegimeDetector";

/**
 * 🚧 CONFIRMATION GATE
 * The final "Go/No-Go" barrier for execution.
 */
export class ConfirmationGate {
  static evaluate(params: {
    probability: number,
    regime: MarketRegime,
    confirmations: string[],
    minRequired: number
  }): { approved: boolean; reason?: string } {
    
    // 1. Probability Threshold
    if (params.probability < 0.68) {
      return { approved: false, reason: 'CONVICTION_THRESHOLD_FAIL: Evidence probability below 68%.' };
    }

    // 2. Confirmation Count
    if (params.confirmations.length < params.minRequired) {
      return { approved: false, reason: `INSUFFICIENT_EVIDENCE: Only ${params.confirmations.length} of ${params.minRequired} shards confirmed.` };
    }

    // 3. Panic Stop
    if (params.regime === 'PANIC' && params.probability < 0.82) {
      return { approved: false, reason: 'SYSTEM_PANIC_PROTECTION: High conviction (>82%) required in current regime.' };
    }

    return { approved: true };
  }
}