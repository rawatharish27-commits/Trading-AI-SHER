/**
 * 🏛️ INSTITUTIONAL ALPHA STRATEGIES (PHASE 16)
 * Goal: Detecting Smart Money Footprints and Liquidity Traps.
 */

export class InstitutionalStrategies {
  /**
   * 🐳 SMART MONEY DETECTION
   * Logic: High Volume + Low Price Change = Absorption/Accumulation.
   */
  static detectSmartMoney(volumeRelative: number, priceChange: number) {
    // Volume > 3x Avg AND Price Change < 0.3%
    if (volumeRelative > 3 && Math.abs(priceChange) < 0.3) {
      return { signal: "ACCUMULATION", score: 0.85 };
    }
    return null;
  }

  /**
   * 🪤 TRAP DETECTION (FAKE BREAKOUT)
   * Logic: Rejection wicks on high volume.
   */
  static detectTrap(high: number, close: number, volumeRelative: number) {
    // Price prints a new high but closes significantly lower on high volume
    if (high > close && volumeRelative > 2.5) {
      return { signal: "BULL_TRAP", score: 0.75 };
    }
    return null;
  }

  /**
   * 📊 ORDER BOOK IMBALANCE
   * Logic: Deep book pressure analysis.
   */
  static getOrderBookImbalance(bids: { qty: number }[], asks: { qty: number }[]): number {
    const bidVol = bids.reduce((s, b) => s + b.qty, 0);
    const askVol = asks.reduce((s, a) => s + a.qty, 0);
    const total = bidVol + askVol;
    if (total === 0) return 0;
    
    // Returns -1 to 1 range
    return (bidVol - askVol) / total;
  }
}