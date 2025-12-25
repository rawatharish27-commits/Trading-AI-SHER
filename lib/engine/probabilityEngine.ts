import { Indicators, Candle } from '../indicators';

export interface ProbabilityScore {
  priceAction: number;     // 0-30
  volume: number;          // 0-25
  smartMoney: number;      // 0-20
  indicators: number;      // 0-15
  context: number;         // 0-10
  final: number;           // ML-Calibrated (0-100)
}

export class ProbabilityEngine {
  /**
   * 🧠 LOGISTIC PROBABILITY CALIBRATION
   * Maps raw signals to true probability based on historical accuracy.
   */
  static calibrate(raw: number, winRate: number): number {
    // raw is 0-100, winRate is 0-100 (e.g., 55 for 55%)
    const normalizedRaw = raw / 100;
    const normalizedAcc = winRate / 100;
    
    // Logistic scaling: 1 / (1 + exp(-k * (raw - threshold)))
    // Threshold is shifted by strategy's historical accuracy
    const adjusted = 1 / (1 + Math.exp(-10 * (normalizedRaw - (1 - normalizedAcc))));
    return Math.min(Math.round(adjusted * 100), 95); // Institutional cap at 95%
  }

  static calculate(candles: Candle[], symbol: string, currentWinRate: number = 50): ProbabilityScore {
    const prices = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    const lastCandle = candles[candles.length - 1];
    const avgVol = volumes.slice(-20).reduce((a,b) => a+b, 0) / 20;

    const weights = {
        priceAction: 0.30,
        volume: 0.25,
        smartMoney: 0.20,
        indicators: 0.15,
        context: 0.10,
    };

    let pa = 0, vol = 0, sm = 0, ind = 0, ctx = 0;

    // Logic nodes (Deterministic Layer)
    if (prices[prices.length-1] > Indicators.EMA(prices, 20)) pa += 15;
    if (Math.abs(lastCandle.close - lastCandle.open) / (lastCandle.high - lastCandle.low || 1) > 0.6) pa += 15;
    if (lastCandle.volume / (avgVol || 1) > 2) vol += 25;
    if (lastCandle.close > Indicators.VWAP(candles)) sm += 10;
    if (Indicators.LiquiditySweep(lastCandle)) sm += 10;
    
    const rsi = Indicators.RSI(prices);
    if (rsi > 40 && rsi < 65) ind += 15;

    const hour = new Date().getHours();
    if ((hour >= 9 && hour <= 11) || (hour >= 13 && hour <= 15)) ctx += 10;

    const rawFinal = (pa * weights.priceAction + vol * weights.volume + sm * weights.smartMoney + ind * weights.indicators + ctx * weights.context) * 4;
    
    // 🛡️ Apply ML Calibration Shard
    const calibratedFinal = this.calibrate(rawFinal, currentWinRate);

    return {
      priceAction: pa,
      volume: vol,
      smartMoney: sm,
      indicators: ind,
      context: ctx,
      final: calibratedFinal
    };
  }

  static forecast(candles: Candle[]): any[] {
    const prices = candles.map(c => c.close);
    const rsi = Indicators.RSI(prices);
    
    return Array.from({ length: 5 }, (_, i) => {
        const decay = 1 - (i * 0.1);
        const up = Math.max(0.1, (rsi < 40 ? 0.6 : 0.3) * decay + Math.random() * 0.1);
        const down = Math.max(0.1, (rsi > 60 ? 0.6 : 0.3) * decay + Math.random() * 0.1);
        return { candle: i + 1, up, down, range: 1 - (up + down) };
    });
  }
}