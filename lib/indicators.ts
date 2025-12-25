
/**
 * Sher Master Indicator Library (Advanced Math Core)
 */

export interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const Indicators = {
  SMA: (prices: number[], period: number) => {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    return prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  },

  EMA: (prices: number[], period: number) => {
    if (prices.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * k) + (ema * (1 - k));
    }
    return ema;
  },

  RSI: (prices: number[], period: number = 14) => {
    if (prices.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  },

  MACD: (prices: number[]) => {
    const ema12 = Indicators.EMA(prices, 12);
    const ema26 = Indicators.EMA(prices, 26);
    const macdLine = ema12 - ema26;
    // Approximation for signal line (EMA 9 of MACD line)
    return { macd: macdLine, signal: macdLine * 0.9 }; 
  },

  ATR: (candles: Candle[], period: number = 14) => {
    if (candles.length <= period) return 0;
    const trs = [];
    for (let i = 1; i < candles.length; i++) {
      const h = candles[i].high;
      const l = candles[i].low;
      const pc = candles[i - 1].close;
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
  },

  VWAP: (candles: Candle[]) => {
    let pv = 0;
    let v = 0;
    for (const c of candles) {
      pv += ((c.high + c.low + c.close) / 3) * c.volume;
      v += c.volume;
    }
    return pv / (v || 1);
  },

  /**
   * Detects institutional liquidity sweep (long wick rejection).
   */
  // Fix: Added safety check for undefined candle to prevent property access errors on null.
  LiquiditySweep: (candle: Candle) => {
    if (!candle) return false;
    const body = Math.abs(candle.close - candle.open);
    const totalRange = candle.high - candle.low;
    const wick = totalRange - body;
    return wick > body * 2;
  }
};
