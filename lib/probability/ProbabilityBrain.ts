import { RegimeDetector } from './RegimeDetector';
import { BayesianUpdate } from './BayesianUpdate';
import { UncertaintyModel } from './UncertaintyModel';
import { NoTradeGuard } from './NoTradeGuard';
import { EvidenceShard, ProbabilityShard, MarketRegime } from './types';

/**
 * 🦁 PROBABILITY BRAIN (Ensemble Orchestrator)
 */
export class ProbabilityBrain {
  private static currentProbability = 0.5; // Starts at neutral

  static synthesize(
    prices: number[], 
    atr: number, 
    evidence: EvidenceShard[]
  ): { decision: 'BUY' | 'SELL' | 'NO_TRADE'; shard: ProbabilityShard; reason?: string } {
    
    // 1. Context Shard
    const regime = RegimeDetector.detect(prices, atr);
    
    // 2. Math Shard
    const updatedProb = BayesianUpdate.update(this.currentProbability, evidence);
    this.currentProbability = updatedProb;

    // 3. Confidence Shard
    const uncertainty = UncertaintyModel.calculate(evidence);

    const shard: ProbabilityShard = {
      final: updatedProb,
      prior: 0.5,
      uncertainty,
      regime,
      evidenceCount: evidence.length
    };

    // 4. Veto Audit
    const audit = NoTradeGuard.evaluate(shard);
    
    if (!audit.allowed) {
      return { decision: 'NO_TRADE', shard, reason: audit.reason };
    }

    return {
      decision: updatedProb > 0.5 ? 'BUY' : 'SELL',
      shard,
      reason: 'ALPHA_SHARD_CONFIRMED'
    };
  }

  static reset() {
    this.currentProbability = 0.5;
  }
}