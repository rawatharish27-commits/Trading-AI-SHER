
import { DecisionAudit } from '../../types';
import { decisionRepo } from '../repos/decisionRepo';

class TestDataGenerator {
  /**
   * Part-3 of Master Plan: Seeds high-fidelity audit trails.
   */
  static async seedDemo() {
    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'];
    const now = new Date();

    for (let i = 0; i < symbols.length; i++) {
      const mockAudit: DecisionAudit = {
        decisionId: `shrd-${i}-${Date.now()}`,
        symbol: symbols[i],
        timestamp: new Date(now.getTime() - i * 3600000).toISOString(),
        decision: i % 2 === 0 ? "ALERT" : "NO_TRADE",
        probability: {
          raw: 0.88,
          afterDecay: 0.84,
          threshold: 0.75
        },
        regime: {
          type: "TREND",
          confidence: 0.82
        },
        guards: {
          liquidity: "PASS",
          multiHorizon: "PASS",
          probability: "PASS",
          risk: "PASS",
          lossCluster: i === 3 ? "FAIL" : "PASS"
        },
        riskState: {
          capitalUsedPct: 12.4,
          drawdownPct: 1.2,
          lossClusterActive: i === 3,
          killSwitch: false
        },
        model: {
          version: "4.2.1-stable",
          certified: true
        },
        auditHash: `0x${Math.random().toString(16).slice(2, 10)}...`
      };

      await decisionRepo.save(mockAudit);
    }
    
    console.info("🦁 [Seeder] Enterprise Shards provisioned successfully.");
  }
}

export { TestDataGenerator };
