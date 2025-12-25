import { PortfolioItem } from "../../../types";

export class PortfolioRiskManager {
  /**
   * 🛡️ PORTFOLIO GATEKEEPER
   * Institutional Rule: Never take a trade that makes directional exposure > 30% or Correlation > 0.8
   */
  static isTradeAllowed(params: {
    symbol: string;
    action: 'BUY' | 'SELL';
    notionalValue: number;
    totalCapital: number;
    openPositions: PortfolioItem[];
    correlations: Record<string, number>; 
  }): { allowed: boolean; reason?: string } {
    
    // 1. Directional Concentration Check
    const currentDirectionalValue = params.openPositions
        .filter(p => (params.action === 'BUY' ? p.quantity > 0 : p.quantity < 0))
        .reduce((s, p) => s + (p.currentPrice * Math.abs(p.quantity)), 0);

    if (currentDirectionalValue + params.notionalValue > params.totalCapital * 0.35) {
      return { allowed: false, reason: 'CONCENTRATION_BREACH: Directional exposure exceeds 35% cap.' };
    }

    // 2. Correlation Clustering Check
    const highCorrPos = params.openPositions.find(p => (params.correlations[p.symbol] || 0) > 0.85);
    if (highCorrPos) {
      return { allowed: false, reason: `CORRELATION_BREACH: High cluster risk with ${highCorrPos.symbol}.` };
    }

    return { allowed: true };
  }
}