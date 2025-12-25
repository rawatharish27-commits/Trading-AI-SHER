import { PortfolioItem, AISignal } from '../../../types';

/**
 * 🧩 PORTFOLIO CORRELATION ENGINE
 * Goal: Sector Neutrality.
 */
export class CorrelationEngine {
  private static readonly SECTOR_LIMIT = 2; // Max 2 positions per sector

  // Map symbols to sectors (Simulated)
  private static SECTOR_MAP: Record<string, string> = {
    'RELIANCE': 'ENERGY',
    'TCS': 'IT',
    'INFY': 'IT',
    'HDFCBANK': 'FINANCE',
    'SBIN': 'FINANCE',
    'TATASTEEL': 'METALS'
  };

  static checkExposure(signal: AISignal, holdings: PortfolioItem[]): { allowed: boolean; reason?: string } {
    const targetSector = this.SECTOR_MAP[signal.symbol] || 'OTHER';
    
    const sectorPositions = holdings.filter(h => {
      const hSector = this.SECTOR_MAP[h.symbol] || 'OTHER';
      return hSector === targetSector && h.quantity > 0;
    });

    if (sectorPositions.length >= this.SECTOR_LIMIT) {
      return {
        allowed: false,
        reason: `CORRELATION_VETO: Portfolio already saturated in ${targetSector} sector.`
      };
    }

    return { allowed: true };
  }
}