
import { Candle, Indicators } from '../../../lib/indicators';

export function emaRsiStrategy(candles: Candle[]) {
  const prices = candles.map(c => c.close);
  if (prices.length < 50) return null;

  const rsi = Indicators.RSI(prices, 14);
  const ema20 = Indicators.EMA(prices, 20);
  const ema50 = Indicators.EMA(prices, 50);
  const lastPrice = prices[prices.length - 1];

  // Logic: Oversold + Trend Confirmation
  if (rsi < 35 && ema20 > ema50) {
    return { side: 'BUY' as const, price: lastPrice };
  }
  // Logic: Overbought + Trend Failure
  if (rsi > 65 && ema20 < ema50) {
    return { side: 'SELL' as const, price: lastPrice };
  }
  
  return null;
}
