
import { StrategyFeatures, EvidenceCluster } from '../../types';

export class EvidenceAggregator {
  static aggregate(features: StrategyFeatures): EvidenceCluster {
    const momentum = features.momentumScore;
    const trend = features.trendScore;
    const orderFlow = features.smartMoneyScore;
    const volatility = 1 - features.structureScore; // Assume lower structure score = lower stability/higher vol

    // Harmony Math: Difference between the highest and lowest core clusters
    // Institutional Rule: High conflict (e.g. Trend UP, Momentum DOWN) reduces probability
    const coreClusters = [momentum, trend, orderFlow];
    const max = Math.max(...coreClusters);
    const min = Math.min(...coreClusters);
    const conflict = max - min;
    const harmonyScore = Math.max(0, 1 - conflict);

    // Fix: Corrected object literal to strictly match EvidenceCluster interface by removing unmapped properties and adding required ones.
    return {
      type: "GENERAL",
      avgStrength: (momentum + trend + orderFlow) / 3,
      direction: (momentum + trend + orderFlow) / 3 > 0.5 ? 'BULLISH' : 'BEARISH',
      volatility,
      harmonyScore
    };
  }
}
