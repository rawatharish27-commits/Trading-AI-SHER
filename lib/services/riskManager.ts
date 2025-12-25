
import { RiskConfig, PortfolioItem } from "../../types";

class RiskManager {
  private config: RiskConfig = {
    maxCapitalPerTrade: 25000,
    maxDailyLoss: 5000,
    maxOpenPositions: 3,
    stopLossDefault: 2.0,
    trailingSLEnabled: true,
    killSwitchActive: false
  };

  private tradingEnabled = true;
  private dailyLoss = 0;
  private apiErrors = 0;
  private readonly MAX_API_ERRORS = 5;

  /**
   * Position Sizing: Institutional 1% Risk Rule
   * Formula: Qty = (Capital * Risk%) / (Price - SL)
   */
  calculatePositionSize(capital: number, price: number, slPoints: number): number {
    const riskAmt = capital * 0.01; // Max 1% account risk
    return Math.floor(riskAmt / slPoints);
  }

  /**
   * Trailing Stop Loss Logic (ATR Based)
   */
  updateTrailingStop(item: PortfolioItem, currentPrice: number, atr: number): number | undefined {
    if (!this.config.trailingSLEnabled) return item.trailingSL;
    
    const trailDistance = atr * 1.5;
    const potentialSL = currentPrice - trailDistance;

    // Only move SL UP for long positions
    if (!item.trailingSL || potentialSL > item.trailingSL) {
      return potentialSL;
    }
    return item.trailingSL;
  }

  /**
   * Global Kill-Switch Guard
   */
  checkKillSwitch(sessionPnL: number) {
    if (Math.abs(sessionPnL) >= this.config.maxDailyLoss && sessionPnL < 0) {
      this.config.killSwitchActive = true;
      this.disableTrading("MAX_DAILY_LOSS_REACHED");
    }
  }

  disableTrading(reason: string) {
    this.tradingEnabled = false;
    console.error(`[RiskManager] Trading DISABLED: ${reason}`);
  }

  enableTrading() {
    this.tradingEnabled = true;
    this.config.killSwitchActive = false;
    this.apiErrors = 0;
  }

  recordApiError(error: string) {
    this.apiErrors++;
    if (this.apiErrors >= this.MAX_API_ERRORS) {
      this.disableTrading("API_INSTABILITY_BREACH");
    }
  }

  isTradingAllowed(): boolean {
    return this.tradingEnabled && !this.config.killSwitchActive;
  }

  getStatus() {
    return {
      enabled: this.tradingEnabled,
      errors: this.apiErrors,
      killSwitch: this.config.killSwitchActive
    };
  }

  getConfig() { return this.config; }
  updateConfig(cfg: Partial<RiskConfig>) { this.config = { ...this.config, ...cfg }; }
}

export const riskManager = new RiskManager();
