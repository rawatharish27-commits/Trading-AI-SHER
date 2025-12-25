
import { Indicators, Candle } from '../indicators';
import { ForecastPoint } from '../../types';

export class ProbabilityEngine {
  /**
   * Forecasts the probability distribution for the next 5 candles/ticks.
   * Logic: (Deterministic Bias * Regime Factor) + Volatility Drift
   */
  static forecast(candles: Candle[]): ForecastPoint[] {
    const prices = candles.map(c => c.close);
    const rsi = Indicators.RSI(prices);
    const atr = Indicators.ATR(candles);
    const lastPrice = prices[prices.length - 1];
    
    // Determine base bias
    let baseUp = 0.33, baseDown = 0.33, baseRange = 0.34;
    
    // Momentum influence
    if (rsi < 35) { baseUp += 0.20; baseDown -= 0.15; baseRange -= 0.05; }
    else if (rsi > 65) { baseDown += 0.20; baseUp -= 0.15; baseRange -= 0.05; }
    
    // Trend influence (SMA 20 vs 50)
    const sma20 = Indicators.SMA(prices, 20);
    const sma50 = Indicators.SMA(prices, 50);
    if (sma20 > sma50) { baseUp += 0.1; baseDown -= 0.1; }
    else { baseDown += 0.1; baseUp -= 0.1; }

    const results: ForecastPoint[] = [];
    const volatilityFactor = (atr / lastPrice) * 100;

    for (let i = 1; i <= 5; i++) {
      // Entropy increases over time (confidence drops)
      const decay = 1 - (i * 0.05);
      const up = Math.max(0.05, baseUp * decay + (Math.random() * 0.02));
      const down = Math.max(0.05, baseDown * decay + (Math.random() * 0.02));
      const range = 1 - (up + down);

      results.push({
        candle: i,
        up: parseFloat(up.toFixed(2)),
        down: parseFloat(down.toFixed(2)),
        range: parseFloat(range.toFixed(2))
      });
    }

    return results;
  }
}
