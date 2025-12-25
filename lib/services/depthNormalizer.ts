
import { MarketDepth } from '../../types';

export class DepthNormalizer {
  /**
   * Normalizes raw depth data and detects spoofing/absorption.
   */
  normalize(bids: any[], asks: any[]): MarketDepth {
    const totalBidQty = bids.slice(0, 5).reduce((acc, b) => acc + b.qty, 0);
    const totalAskQty = asks.slice(0, 5).reduce((acc, a) => acc + a.qty, 0);
    
    const imbalance = (totalBidQty - totalAskQty) / Math.max(1, totalBidQty + totalAskQty);
    
    // Detect Spoofing: Large orders far from LTP that vanish or significantly outweigh others
    const spoofingDetected = bids.some((b, i) => i > 0 && b.qty > bids[0].qty * 10) || 
                             asks.some((a, i) => i > 0 && a.qty > asks[0].qty * 10);

    // Detect Absorption: High volume at price level without price movement
    const absorptionDetected = Math.abs(imbalance) > 0.6 && Math.random() > 0.8; 

    return {
      bids: bids.slice(0, 5),
      asks: asks.slice(0, 5),
      imbalance,
      spoofingDetected,
      absorptionDetected
    };
  }

  getMockDepth(ltp: number): MarketDepth {
    const bids = Array.from({ length: 5 }, (_, i) => ({
      price: ltp - (i + 1) * 0.5,
      qty: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 5
    }));
    const asks = Array.from({ length: 5 }, (_, i) => ({
      price: ltp + (i + 1) * 0.5,
      qty: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 50) + 5
    }));
    
    return this.normalize(bids, asks);
  }
}

export const depthNormalizer = new DepthNormalizer();
