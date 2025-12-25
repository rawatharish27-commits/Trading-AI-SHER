
import { MarketDepth, FootprintBar } from '../../types';

export class DepthService {
  /**
   * Simulates/Calculates Footprint Delta for the current bar
   */
  static generateFootprint(price: number): FootprintBar[] {
    const bars: FootprintBar[] = [];
    const levels = 10;
    const step = 0.5;

    for (let i = 0; i < levels; i++) {
      const levelPrice = price - (levels / 2 * step) + (i * step);
      const buyVol = Math.floor(Math.random() * 500);
      const sellVol = Math.floor(Math.random() * 500);
      bars.push({
        price: levelPrice,
        buyVol,
        sellVol,
        delta: buyVol - sellVol
      });
    }
    return bars;
  }

  /**
   * Analyzes Market Depth for spoofing and absorption
   */
  static analyzeDepth(bids: any[], asks: any[]): MarketDepth {
    const totalBidQty = bids.reduce((acc, b) => acc + b.qty, 0);
    const totalAskQty = asks.reduce((acc, a) => acc + a.qty, 0);
    const imbalance = (totalBidQty - totalAskQty) / (totalBidQty + totalAskQty || 1);

    // Institutional Spoofing Check: Large orders far from LTP
    const spoofingDetected = bids.some((b, i) => i > 2 && b.qty > bids[0].qty * 5);
    
    // Absorption Check: High delta in footprint but price stationary (simulated flag)
    const absorptionDetected = Math.abs(imbalance) > 0.7;

    return {
      bids: bids.slice(0, 5),
      asks: asks.slice(0, 5),
      imbalance,
      spoofingDetected,
      absorptionDetected
    };
  }

  /**
   * Fix: Added getMockDepth static method to resolve compilation error in StockDetailView.
   * Generates a realistic mock market depth for a given price.
   */
  static getMockDepth(price: number): MarketDepth {
    const bids = Array.from({ length: 5 }, (_, i) => ({
      price: price - (i + 1) * 0.5,
      qty: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 5
    }));
    const asks = Array.from({ length: 5 }, (_, i) => ({
      price: price + (i + 1) * 0.5,
      qty: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 5
    }));
    
    return this.analyzeDepth(bids, asks);
  }
}
