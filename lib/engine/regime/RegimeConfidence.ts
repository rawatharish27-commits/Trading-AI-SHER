
import { AIFeatureVector } from "../../features/featureEngine";

export interface RegimeConfidenceInput {
  volatility: number;
  trendStrength: number;
  volumeStability: number;
}

/**
 * 🏛️ REGIME CONFIDENCE NODE (Priority #1)
 * Calculates a 0-1 score representing how 'tradable' the current regime is.
 */
export class RegimeConfidence {
  private static readonly CONFIDENCE_THRESHOLD = 0.60;

  static evaluate(inputs: RegimeConfidenceInput): { score: number; passed: boolean; reason: string } {
    // Weighted summation of market clarity factors
    // Trend Strength (40%) + Volatility Inverse (30%) + Volume Stability (30%)
    
    // We want lower volatility (scaled) for higher confidence in trending modes
    const volInverse = Math.max(0, 1 - (inputs.volatility * 15)); 
    
    const score = (inputs.trendStrength * 0.4) + (volInverse * 0.3) + (inputs.volumeStability * 0.3);
    const clampedScore = Math.min(Math.max(score, 0), 1);
    const passed = clampedScore >= this.CONFIDENCE_THRESHOLD;

    return {
      score: clampedScore,
      passed,
      reason: passed 
        ? "Market regime exhibits sufficient structural clarity for signal deployment." 
        : "High market entropy detected. Probability of logic-failure is above safety threshold."
    };
  }
}
