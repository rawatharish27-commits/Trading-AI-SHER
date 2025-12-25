import { AISignal } from '../../types';
import { AuditVault } from '../audit/AuditVault';
import { DecisionExplainer } from '../xai/DecisionExplainer';

/**
 * 🛡️ COMPLIANCE GUARD
 * Goal: Final "Go/No-Go" logic sharded through legal constraints.
 */
export class ComplianceGuard {
  private static readonly MAX_LEVERAGE = 1.0; // Enforce zero leverage for retail safety

  static async auditBeforeExecution(signal: AISignal, userId: string): Promise<{ approved: boolean; reason?: string; auditRef?: string }> {
    // 1. Check for valid probability (Hard floor 75% for live)
    if (signal.probability < 0.75) {
      return { approved: false, reason: "LOW_PROBABILITY_VETO" };
    }

    // 2. Generate Explainability Shard (XAI)
    const explanation = await DecisionExplainer.explain(signal);

    // 3. Commit to Immutable Ledger
    const auditShard = AuditVault.log({
      type: 'PRE_EXECUTION_AUDIT',
      userId,
      signalId: signal.id,
      explanation,
      constraints: { leverage: this.MAX_LEVERAGE }
    });

    // 4. Return Approval
    return { 
      approved: true, 
      auditRef: auditShard.currentHash,
      reason: explanation.narrative 
    };
  }

  static getDisclaimer(): string {
    return "DISCLOSURE: AI Signals are probabilistic. 90% of retail traders lose capital. No profit is guaranteed.";
  }
}