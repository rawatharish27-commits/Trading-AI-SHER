/**
 * 🧠 PROBABILITY CALIBRATION NODE
 * Merges AI conviction with historical reality.
 */
export class CalibrationNode {
  /**
   * Bayes-inspired calibration.
   * Formula: (AI Prob * 0.6) + (Strategy Win Rate * 0.4)
   */
  static calibrate(aiProb: number, historicalWinRate: number): number {
    const winRateFactor = historicalWinRate / 100;
    const calibrated = (aiProb * 0.6) + (winRateFactor * 0.4);
    
    // Institutional Clamp
    return parseFloat(Math.min(0.95, Math.max(0.05, calibrated)).toFixed(2));
  }
}