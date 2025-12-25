import { PortfolioItem, AISignal } from '../../../types';

export class RiskOverlay {
  private static readonly SECTOR_CAP_PCT = 25; // Institutional limit

  /**
   * 🛡️ PORTFOLIO FIREWALL
   * Checks if a trade is allowed based on whole-portfolio context.
   */
  static async validateExecution(signal: AISignal, holdings: PortfolioItem[], totalCapital: number): Promise<{ allowed: boolean; reason?: string }> {
    const tradeValue = signal.targets.entry * (signal.allocation || 1);
    
    // 1. Sector Concentration Audit
    const sectorMap: Record<string, number> = {};
    holdings.forEach(h => {
      const s = h.sector || "Unclassified";
      sectorMap[s] = (sectorMap[s] || 0) + (h.currentPrice * h.quantity);
    });

    const targetSector = signal.assetClass || "Equity";
    const currentSectorValue = sectorMap[targetSector] || 0;
    const nextSectorPct = ((currentSectorValue + tradeValue) / totalCapital) * 100;

    if (nextSectorPct > this.SECTOR_CAP_PCT) {
      return { 
        allowed: false, 
        reason: `CONCENTRATION_BREACH: Sector exposure would reach ${nextSectorPct.toFixed(1)}% (Cap: ${this.SECTOR_CAP_PCT}%)` 
      };
    }

    // 2. Correlation Shard Audit (Simplified)
    const existingSameAsset = holdings.filter(h => h.symbol === signal.symbol);
    if (existingSameAsset.length >= 2) {
       return { allowed: false, reason: "CORRELATION_BLOCK: Excessive same-symbol sharding detected." };
    }

    return { allowed: true };
  }
}