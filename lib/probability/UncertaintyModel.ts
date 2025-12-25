import { EvidenceShard } from './types';

/**
 * 🧠 UNCERTAINTY MODEL
 * Goal: Measure the 'Consensus Conflict'.
 */
export class UncertaintyModel {
  /**
   * High entropy = Conflict = High Uncertainty.
   */
  static calculate(evidence: EvidenceShard[]): number {
    if (evidence.length < 3) return 0.8; // High uncertainty if few evidence nodes

    const bullish = evidence.filter(e => e.bias === 'BULLISH').length;
    const bearish = evidence.filter(e => e.bias === 'BEARISH').length;
    const total = evidence.length;

    // Conflict Ratio: if 2 say Buy and 2 say Sell, uncertainty is 1.0
    const conflict = 1 - Math.abs(bullish - bearish) / total;
    
    return parseFloat(conflict.toFixed(2));
  }
}