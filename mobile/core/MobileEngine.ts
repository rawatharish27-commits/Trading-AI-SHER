
import { AISignal, PortfolioItem } from '../../types';

/**
 * 📱 MOBILE ALPHA ENGINE
 * Focus: High-speed notifications and read-only portfolio awareness.
 */
export class MobileEngine {
  private static readonly ALERT_THRESHOLD = 0.88;

  /**
   * Filter and shard signals suitable for mobile pulse delivery.
   */
  static processSignal(signal: AISignal) {
    if (signal.probability >= this.ALERT_THRESHOLD) {
      // In RN, this triggers native push notification
      console.log(`📱 [MobilePulse] Sending Institutional Alert: ${signal.symbol}`);
      return true;
    }
    return false;
  }

  /**
   * Optimized portfolio state for mobile bandwidth.
   */
  static shardPortfolio(items: PortfolioItem[]) {
    return items.map(i => ({
      s: i.symbol,
      p: i.pnlPercent.toFixed(2),
      v: (i.currentPrice * i.quantity).toLocaleString()
    }));
  }
}
