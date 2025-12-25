import { StrategyFeatures, ProbabilityResult, ProbabilityComponents } from '../../types';
import { MarketRegime } from './RegimeDetector';

export class ProbabilityEngineV2 {
  private static readonly WEIGHTS = {
    TECHNICAL: 0.40,
    VOLUME: 0.25,
    ORDERBOOK: 0.20,
    ML: 0.15
  };

  private static readonly REGIME_MULTIPLIER: Record<MarketRegime, number> = {
    TREND: 1.0,
    RANGE: 0.85,
    PANIC: 0.7,
    LOW_LIQUIDITY: 0.6
  };

  static calculate(
    features: StrategyFeatures, 
    regime: MarketRegime, 
    mlProb: number = 0.5,
    sectorCorrelationHigh: boolean = false
  ): ProbabilityResult {
    
    // 1. Technical Score (Normalized momentum, trend, structure)
    const techScore = (features.momentumScore * 0.4) + (features.trendScore * 0.4) + (features.structureScore * 0.2);
    
    // 2. Volume Score
    const volumeScore = features.volumeScore; // Pre-normalized by strategy

    // 3. Smart Money (Order Book)
    const orderBookScore = features.smartMoneyScore;

    // 4. ML Confidence
    const mlConfidence = mlProb; // Sigmoid expected from source

    // 5. Apply Regime Multiplier
    const multiplier = this.REGIME_MULTIPLIER[regime];

    // 6. Correlation Penalty
    const correlationPenalty = sectorCorrelationHigh ? 0.15 : 0;

    // 🧠 INSTITUTIONAL PROBABILITY FORMULA
    let finalProb = (
      (techScore * this.WEIGHTS.TECHNICAL) +
      (volumeScore * this.WEIGHTS.VOLUME) +
      (orderBookScore * this.WEIGHTS.ORDERBOOK) +
      (mlConfidence * this.WEIGHTS.ML)
    ) * multiplier - correlationPenalty;

    finalProb = Math.min(1, Math.max(0, finalProb));
    const finalPct = Math.round(finalProb * 100);

    const components: ProbabilityComponents = {
        technical: techScore,
        volume: volumeScore,
        orderBook: orderBookScore,
        marketRegime: multiplier,
        mlConfidence: mlConfidence,
        correlationPenalty: correlationPenalty
    };

    return {
      finalProbability: finalPct,
      components,
      approved: finalPct >= 75 // Threshold rule: Eligible only if >= 75%
    };
  }
}