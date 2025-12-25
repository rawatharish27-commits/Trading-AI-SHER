/**
 * 🧱 SOVEREIGN RISK THRESHOLDS
 * Institutional constraints for capital survival.
 */
export const RISK_CONFIG = {
  MAX_DAILY_LOSS_PERCENT: 2.0,      // 2% Hard Stop
  MAX_TRADE_LOSS_PERCENT: 0.5,      // 0.5% per Unit node
  MAX_TRADES_PER_DAY: 10,           // Over-trading guard
  MAX_DRAWDOWN_PERCENT: 5.0,        // Global account firewall
  COOLDOWN_MINUTES: 30              // Patience protocol after losses
};
