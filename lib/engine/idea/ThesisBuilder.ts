import { Evidence, TradeThesis } from '../../../types';

export class ThesisBuilder {
  /**
   * Synthesizes raw evidence into a human-readable and mathematically grounded thesis.
   */
  static build(symbol: string, direction: "BUY" | "SELL", evidences: Evidence[], sl: number): TradeThesis {
    const supporting = evidences.filter(
      e => (direction === "BUY" && e.direction === "BULLISH") ||
           (direction === "SELL" && e.direction === "BEARISH")
    );

    const invalidation = evidences.filter(e => !supporting.includes(e));

    const supportScore = supporting.reduce((s, e) => s + e.strength, 0);
    const invalidateScore = invalidation.reduce((s, e) => s + (e.strength * 1.5), 0); // Penalize counter-evidence more

    const rawStrength = (supportScore - invalidateScore) / Math.max(1, evidences.length);
    const thesisPct = Math.max(0, Math.min(100, (0.5 + rawStrength) * 100));

    return {
      symbol,
      direction,
      headline: this.generateHeadline(symbol, direction, supporting),
      supportingEvidence: supporting,
      invalidationEvidence: invalidation,
      thesisStrength: Math.round(thesisPct),
      invalidationPoint: sl
    };
  }

  private static generateHeadline(symbol: string, dir: string, supporting: Evidence[]): string {
    const primary = supporting.length > 0 ? supporting[0].type : "GENERAL";
    return `${symbol}: ${dir} thesis anchored by ${primary} alignment.`;
  }
}