
import { DecisionAudit } from '../../types';
import { prisma } from '../prisma';
import { AuditLogger } from '../services/auditLogger';

/**
 * 🏛️ DECISION REPOSITORY (ENTERPRISE PATTERN)
 * Strictly follows Part-2 of the File-Level Integration Plan.
 */
class DecisionRepo {
  /**
   * Saves a decision and its explanation atomically.
   */
  async save(audit: DecisionAudit) {
    return prisma.$transaction(async (tx: any) => {
      const decision = await tx.decision.create({
        data: {
          symbol: audit.symbol,
          decision: audit.decision,
          probabilityRaw: audit.probability.raw,
          probabilityFinal: audit.probability.afterDecay,
          regime: audit.regime.type,
          regimeConfidence: audit.regime.confidence
        }
      });

      await tx.decisionExplanation.create({
        data: {
          decisionId: decision.id,
          liquidityStatus: audit.guards.liquidity,
          multiHorizonStatus: audit.guards.multiHorizon,
          probabilityStatus: audit.guards.probability,
          riskStatus: audit.guards.risk,
          lossClusterStatus: audit.guards.lossCluster,
          explanationJson: audit
        }
      });

      AuditLogger.logDecision(audit);
      return decision;
    });
  }

  async getAll() {
    return prisma.decision.findMany({
      include: { explanation: true }
    });
  }
}

export const decisionRepo = new DecisionRepo();
