import { StrategyFeatures, ProbabilityResult, ProbabilityComponents } from '../../types';
import { strategyManager } from '../services/strategyManager';

/**
 * 🧠 SHER PROBABILITY ENGINE V3 (CALIBRATED)
 * Shards market entropy into deterministic conviction scores.
 */
export class ProbabilityEngineV3 {
  /**
   * Calculates Ensemble Probability for a Signal Node.
   * Logic: Uses dynamic weights calibrated via the Neural Feedback Loop.
   */
  static calculate(features: StrategyFeatures, regime: string): ProbabilityResult {
    const weights = strategyManager.getWeights();

    // 1. Technical Alignment (0-1)
    const trendScore = features.trendScore; 
    
    // 2. Volume Participation (0-1)
    const volumeScore = features.volumeScore;

    // 3. Smart Money Pressure (Orderbook Imbalance) (0-1)
    const orderFlowScore = features.smartMoneyScore;

    // 4. Market Structure Integrity (0-1)
    const structureScore = features.structureScore;

    // 🦁 Institutional Summation (Weighted)
    let finalProb = (
      (trendScore * weights.TREND) +
      (volumeScore * weights.VOLUME) +
      (orderFlowScore * weights.ORDERFLOW) +
      (structureScore * weights.STRUCTURE)
    );

    // Regime Penalty Shard
    if (regime === 'PANIC') finalProb *= 0.6;
    if (regime === 'CHOPPY') finalProb *= 0.8;

    const finalPct = Math.round(finalProb * 100);

    const components: ProbabilityComponents = {
      technical: trendScore,
      volume: volumeScore,
      orderBook: orderFlowScore,
      marketRegime: regime === 'TRENDING' ? 1.0 : (regime === 'CHOPPY' ? 0.8 : 0.6),
      mlConfidence: 0.82, 
      correlationPenalty: 0
    };

    return {
      finalProbability: finalPct,
      components,
      approved: finalPct >= 75 // Institutional Gate
    };
  }
}