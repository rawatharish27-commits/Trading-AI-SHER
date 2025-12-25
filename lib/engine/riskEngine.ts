
import { RiskConfig, PortfolioItem } from "../../types";

export class RiskEngine {
  private static config: RiskConfig = {
    maxCapitalPerTrade: 50000,
    maxDailyLoss: 10000,
    maxOpenPositions: 5,
    stopLossDefault: 1.5,
    trailingSLEnabled: true,
    killSwitchActive: false
  };

  /**
   * Institutional Position Sizing (1% account risk rule)
   * Hardened against NaN/Zero division errors.
   */
  static calculatePositionSize(capital: number, price: number, slPoints: number): number {
    if (!capital || !price || !slPoints || slPoints <= 0) return 0;
    
    try {
      const riskAmt = capital * 0.01;
      const qty = Math.floor(riskAmt / slPoints);
      return isNaN(qty) ? 0 : qty;
    } catch {
      return 0;
    }
  }

  /**
   * ATR-based Trailing SL Logic
   */
  static getTrailingSL(currentPrice: number, atr: number, entry: number, side: 'BUY' | 'SELL'): number {
    const trail = (atr || currentPrice * 0.01) * 1.5;
    return side === 'BUY' 
      ? Math.max(entry, currentPrice - trail) 
      : Math.min(entry, currentPrice + trail);
  }

  static checkKillSwitch(dailyPnL: number): boolean {
    if (Math.abs(dailyPnL) >= this.config.maxDailyLoss && dailyPnL < 0) {
      this.config.killSwitchActive = true;
      return true;
    }
    return false;
  }
}
