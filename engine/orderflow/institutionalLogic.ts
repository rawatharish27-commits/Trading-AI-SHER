
import { MarketDepthItem } from '../../types';
// Fix: Corrected import source for Candle from indicators core to resolve Module Not Found error.
import { Candle } from '../../lib/indicators';

export class InstitutionalLogic {
  /**
   * Detects Smart Money Accumulation/Distribution via Depth Imbalance.
   */
  static analyzeImbalance(bids: MarketDepthItem[], asks: MarketDepthItem[]) {
    const bidQty = bids.reduce((a, b) => a + b.qty, 0);
    const askQty = asks.reduce((a, b) => a + b.qty, 0);
    const ratio = bidQty / (askQty || 1);

    return {
      imbalance: ratio,
      bias: ratio > 1.5 ? 'ACCUMULATION' : (ratio < 0.6 ? 'DISTRIBUTION' : 'NEUTRAL'),
      strength: Math.abs(1 - ratio)
    };
  }

  /**
   * Detects Institutional Absorption (Large volume at level without price move).
   */
  static detectAbsorption(candle: Candle, avgVol: number) {
    const bodySize = Math.abs(candle.close - candle.open);
    const wickSize = (candle.high - candle.low) - bodySize;
    
    // Low body, high volume, high wicks = Absorption/Churn
    const isAbsorbing = candle.volume > avgVol * 2 && bodySize < (candle.high - candle.low) * 0.3;
    
    return {
      isAbsorbing,
      type: isAbsorbing ? (candle.close > candle.open ? 'BULLISH_ABSORPTION' : 'BEARISH_ABSORPTION') : 'NONE'
    };
  }
}
