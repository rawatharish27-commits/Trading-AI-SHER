import { PortfolioItem } from "../../types";

/**
 * 🛡️ RISK ENGINE V2
 * Advanced capital protection node.
 */
export class RiskEngineV2 {
  private static readonly MAX_SECTOR_RISK = 0.25; // 25% cap per sector
  private static readonly KELLY_CAP = 0.05;       // Max 5% per trade

  static calculateSize(params: {
    capital: number,
    prob: number,
    rr: number,
    price: number,
    regime: string
  }): number {
    // 1. Fractional Kelly: f = (bp - q) / b
    const p = params.prob;
    const q = 1 - p;
    const b = params.rr;
    
    let kellyF = (b * p - q) / b;
    
    // Safety Padding (Institutional Rule: Never full Kelly)
    kellyF = Math.min(kellyF * 0.3, this.KELLY_CAP);

    // 2. Regime Throttling
    if (params.regime === 'PANIC') kellyF *= 0.5;
    if (params.regime === 'LOW_LIQUIDITY') kellyF *= 0.3;

    if (kellyF <= 0) return 0;

    return Math.floor((params.capital * kellyF) / params.price);
  }

  static checkCorrelation(symbol: string, openPositions: PortfolioItem[]): boolean {
    // Simulated Correlation Guard: Limit symbols in same sector
    // Production: Map symbols to sectors from scripMaster
    const count = openPositions.filter(p => p.symbol === symbol).length;
    return count < 2; 
  }
}