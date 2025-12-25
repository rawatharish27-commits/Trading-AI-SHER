import { EvidenceShard } from './types';

/**
 * 🧮 BAYESIAN UPDATER
 * Goal: Update P(H|E) = P(E|H)P(H) / P(E)
 */
export class BayesianUpdate {
  private static readonly DECAY_FACTOR = 0.98; // Probability decays toward 0.5 over time

  /**
   * Updates the probability based on new evidence Consensus.
   */
  static update(currentProb: number, evidence: EvidenceShard[]): number {
    if (evidence.length === 0) return currentProb * this.DECAY_FACTOR + 0.5 * (1 - this.DECAY_FACTOR);

    let bullishWeight = 0;
    let bearishWeight = 0;
    let totalWeight = 0;

    evidence.forEach(e => {
      const w = e.weight * e.strength;
      if (e.bias === 'BULLISH') bullishWeight += w;
      if (e.bias === 'BEARISH') bearishWeight += w;
      totalWeight += e.weight;
    });

    const consensus = (bullishWeight - bearishWeight) / (totalWeight || 1);
    
    // Bayesian shift formula
    // We treat consensus as the "Likelihood" shift
    const nextProb = currentProb + (consensus * 0.1); 
    
    return Math.min(Math.max(nextProb, 0.05), 0.95);
  }
}