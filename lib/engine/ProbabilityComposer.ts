export interface EvidenceShard {
  ruleScore: number;       // 0 - 1
  volumeScore: number;     // 0 - 1
  orderBookScore: number;  // 0 - 1
  mlConfidence: number;    // 0 - 1
}

/**
 * 🎼 PROBABILITY COMPOSER
 * Merges diverse market signals into a unified conviction level.
 */
export class ProbabilityComposer {
  private static readonly WEIGHTS = {
    RULES: 0.40,
    VOLUME: 0.25,
    ORDERBOOK: 0.20,
    ML: 0.15
  };

  static compose(shard: EvidenceShard): number {
    const finalP = 
      (shard.ruleScore * this.WEIGHTS.RULES) +
      (shard.volumeScore * this.WEIGHTS.VOLUME) +
      (shard.orderBookScore * this.WEIGHTS.ORDERBOOK) +
      (shard.mlConfidence * this.WEIGHTS.ML);

    return Math.min(Math.max(finalP, 0), 1);
  }

  static getConvictionLabel(p: number): string {
    if (p > 0.85) return 'INSTITUTIONAL';
    if (p > 0.72) return 'HIGH';
    if (p > 0.60) return 'MODERATE';
    return 'SPECULATIVE';
  }
}