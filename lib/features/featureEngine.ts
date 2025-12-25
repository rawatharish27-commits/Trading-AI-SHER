import { Indicators, Candle } from '../indicators';

export interface AIFeatureVector {
  // Trend Features
  trendScore: number;       // SMA 20/50 distance
  trendAlignment: number;   // 1 if price > 20 > 50, -1 if reverse
  
  // Momentum Features
  rsi: number;
  rsiSlope: number;         // Rate of change of RSI
  macd: number;
  
  // Volatility Features
  volatility: number;       // ATR / Price
  bbBandWidth: number;      // Width of Bollinger Bands
  
  // Structural Features
  liquidityPressure: number; // Volume delta vs MA
  isSqueezing: boolean;     // BB vs Keltner relationship
  
  // Raw Context
  lastClose: number;
}

export class FeatureEngine {
  /**
   * Transforms raw candle history into a normalized feature vector for the Meta-Brain.
   */
  static extract(candles: Candle[]): AIFeatureVector {
    if (candles.length < 50) throw new Error("Insufficient data for feature extraction");

    const prices = candles.map(c => c.close);
    const lastPrice = prices[prices.length - 1];

    // 1. Trend Analysis
    const sma20 = Indicators.SMA(prices, 20);
    const sma50 = Indicators.SMA(prices, 50);
    const trendScore = (lastPrice - sma20) / sma20;
    const trendAlignment = (lastPrice > sma20 && sma20 > sma50) ? 1 : (lastPrice < sma20 && sma20 < sma50 ? -1 : 0);

    // 2. Momentum
    const rsi = Indicators.RSI(prices);
    const rsiPrev = Indicators.RSI(prices.slice(0, -1));
    const rsiSlope = rsi - rsiPrev;
    const macd = Indicators.MACD(prices);

    // 3. Volatility
    const atr = Indicators.ATR(candles, 14);
    const volatility = atr / lastPrice;

    // 4. Volume/Liquidity
    const volumes = candles.map(c => c.volume);
    const volMA = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const liquidityPressure = volumes[volumes.length - 1] / volMA;

    return {
      trendScore,
      trendAlignment,
      rsi,
      rsiSlope,
      // Fixed: Assigned the macd value from the MACD result object to match the number type requirement
      macd: macd.macd,
      volatility,
      bbBandWidth: 0.05, // Placeholder for actual BB logic
      isSqueezing: volatility < 0.015,
      liquidityPressure,
      lastClose: lastPrice
    };
  }

  /**
   * Normalizes values to a 0-1 or -1 to 1 range for better neural performance.
   */
  static normalize(vector: AIFeatureVector): Record<string, number> {
    return {
      t_score: Math.max(-1, Math.min(1, vector.trendScore * 10)),
      t_align: vector.trendAlignment,
      m_rsi: vector.rsi / 100,
      m_rsi_s: Math.max(-1, Math.min(1, vector.rsiSlope / 5)),
      v_vol: Math.min(1, vector.volatility * 20),
      l_press: Math.min(1, vector.liquidityPressure / 3)
    };
  }
}