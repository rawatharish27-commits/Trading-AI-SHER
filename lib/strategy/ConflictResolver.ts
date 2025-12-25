import { StrategyOpinion, StrategyDirection, EnsembleDecision } from './types';

export class ConflictResolver {
  private static readonly CONSENSUS_THRESHOLD = 0.6; // 60% agreement needed

  static resolve(opinions: StrategyOpinion[]): EnsembleDecision {
    const votes: Record<StrategyDirection, number> = { BUY: 0, SELL: 0, NEUTRAL: 0 };
    let totalWeight = 0;

    opinions.forEach(op => {
      // Weight is modified by confidence and regime fit
      const effectiveWeight = op.confidence * op.regimeFit;
      votes[op.direction] += effectiveWeight;
      totalWeight += effectiveWeight;
    });

    const buyStrength = votes.BUY / (totalWeight || 1);
    const sellStrength = votes.SELL / (totalWeight || 1);

    // 1. Conflict Veto: If both sides are strong, we stand down.
    if (buyStrength > 0.3 && sellStrength > 0.3) {
      return { 
        decision: 'NO_TRADE', 
        consensusStrength: 0, 
        votes, opinions, 
        reason: 'CONFLICT_VETO: Market bias is polarized.' 
      };
    }

    // 2. Consensus Check
    if (buyStrength >= this.CONSENSUS_THRESHOLD) {
      return { decision: 'BUY', consensusStrength: buyStrength, votes, opinions, reason: 'STRATEGY_CONSENSUS: Bullish Bias.' };
    }

    if (sellStrength >= this.CONSENSUS_THRESHOLD) {
      return { decision: 'SELL', consensusStrength: sellStrength, votes, opinions, reason: 'STRATEGY_CONSENSUS: Bearish Bias.' };
    }

    return { 
      decision: 'NO_TRADE', 
      consensusStrength: Math.max(buyStrength, sellStrength), 
      votes, opinions, 
      reason: 'INSUFFICIENT_CONSENSUS: Alpha conviction too low.' 
    };
  }
}