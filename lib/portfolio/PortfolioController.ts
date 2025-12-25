import { PortfolioSnapshot } from '../execution/types';

/**
 * 🛡️ PORTFOLIO CONTROLLER
 * Goal: Prevent "Correlation Disaster".
 */
export class PortfolioController {
  private static readonly SECTOR_CAP = 0.30; // 30% max per sector
  private static readonly TOTAL_EXPOSURE_CAP = 4.0; // 4x Leverage Max
  
  static validate(snapshot: PortfolioSnapshot, newTradeValue: number, sector: string): { allowed: boolean; reason?: string } {
    // 1. Total Leverage Check
    const nextTotalExposure = (snapshot.totalExposure + newTradeValue);
    if (nextTotalExposure > snapshot.totalExposure * this.TOTAL_EXPOSURE_CAP) {
      return { allowed: false, reason: 'LEVERAGE_VETO: Total portfolio exposure limit reached.' };
    }

    // 2. Sector Concentration Sharding
    const currentSectorValue = snapshot.sectorConcentration[sector] || 0;
    const nextSectorPct = (currentSectorValue + newTradeValue) / snapshot.totalExposure;
    
    if (nextSectorPct > this.SECTOR_CAP && snapshot.totalExposure > 0) {
      return { allowed: false, reason: `CONCENTRATION_VETO: Sector ${sector} already at ${this.SECTOR_CAP * 100}% cap.` };
    }

    // 3. Daily Loss Breach (Nuclear Option)
    if (snapshot.dailyPnL < -(snapshot.totalExposure * 0.02)) {
      return { allowed: false, reason: 'DAILY_STOP_VETO: Daily drawdown limit breached.' };
    }

    return { allowed: true };
  }
}