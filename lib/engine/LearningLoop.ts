import { tradeJournal } from "../services/tradeJournal";

/**
 * 🔁 LEARNING LOOP
 * AI memory shard to adjust strategy weights based on real-world alpha.
 */
export class LearningLoop {
  private static readonly WEIGHT_STORAGE_KEY = 'sher_neural_weights';

  static recordOutcome(strategyName: string, pnl: number) {
    const weights = this.getWeights();
    const adjustment = pnl > 0 ? 0.02 : -0.05; // Penalize faster than reward (Institutional safety)
    
    weights[strategyName] = Math.min(Math.max((weights[strategyName] || 1.0) + adjustment, 0.2), 2.5);
    
    localStorage.setItem(this.WEIGHT_STORAGE_KEY, JSON.stringify(weights));
    console.log(`🦁 [Learner] Calibrated ${strategyName} weight to ${weights[strategyName].toFixed(2)}`);
  }

  static getWeights(): Record<string, number> {
    const saved = localStorage.getItem(this.WEIGHT_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }
}