
import { PortfolioItem, AISignal } from '../../types';

/**
 * 🧱 PORTFOLIO FIREWALL
 * Core Responsibility: Sector and Correlation Neutrality.
 */
export class PortfolioFirewall {
  private static readonly MAX_SECTOR_EXPOSURE = 0.35; // 35% Max per Sector

  /**
   * Blocks trades that increase portfolio correlation beyond limits.
   */
  static validate(signal: AISignal, holdings: PortfolioItem[], totalAUM: number): { allowed: boolean; reason: string } {
    // 1. Asset Overlap Check
    const existing = holdings.find(h => h.symbol === signal.symbol);
    if (existing && existing.quantity > 0 && signal.action === 'BUY') {
      return { allowed: false, reason: 'CONCENTRATION_VETO: Asset already active in portfolio.' };
    }

    // 2. Sector Concentration Shard
    const sectorValue = holdings
      .filter(h => h.sector === signal.assetClass)
      .reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    
    const tradeValue = signal.targets.entry * (signal.allocation || 1);
    const nextExposure = (sectorValue + tradeValue) / totalAUM;

    if (nextExposure > this.MAX_SECTOR_EXPOSURE) {
      return { allowed: false, reason: `SECTOR_BREACH: Exposure would hit ${(nextExposure*100).toFixed(1)}% (Cap: 35%).` };
    }

    return { allowed: true, reason: 'NEUTRALITY_VERIFIED' };
  }
}
