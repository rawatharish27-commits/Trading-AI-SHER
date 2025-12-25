
/**
 * 🏛️ MULTI-HORIZON ANALYZER (Priority #2)
 * Ensures structural alignment across LTF, MTF, and HTF timeframes.
 */
export class HorizonAnalyzer {
  /**
   * Evaluates alignment. Returns 1 for full alignment, 0.5 for partial, 0 for conflict.
   */
  static evaluateAlignment(horizons: {
    ltf: number; // e.g. 5m bias (-1 to 1)
    mtf: number; // e.g. 15m bias
    htf: number; // e.g. 1h bias
  }): { score: number; passed: boolean; reason: string } {
    
    // Strict alignment: all must be in the same direction (+ or -)
    const allPositive = horizons.ltf > 0 && horizons.mtf > 0 && horizons.htf > 0;
    const allNegative = horizons.ltf < 0 && horizons.mtf < 0 && horizons.htf < 0;
    
    if (allPositive || allNegative) {
      return {
        score: 1.0,
        passed: true,
        reason: "Full recursive alignment confirmed across entry and structural timeframes."
      };
    }

    // Partial alignment (HTF and MTF align, but LTF is retracing)
    const structuralAlignment = (horizons.mtf > 0 && horizons.htf > 0) || (horizons.mtf < 0 && horizons.htf < 0);
    if (structuralAlignment) {
      return {
        score: 0.5,
        passed: false, // In Enterprise mode, we reject partials to ensure top-tier alpha
        reason: "Timeframe conflict: LTF is fighting structural trend. Entry blocked for safety."
      };
    }

    return {
      score: 0,
      passed: false,
      reason: "Structural mismatch. High probability of chop or trend reversal node."
    };
  }
}
