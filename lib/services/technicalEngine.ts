
import { Indicators, Candle } from '../indicators';

export type Bias = 'BUY' | 'SELL' | 'NEUTRAL';

export interface TechAudit {
    rsi: number;
    ema20: number;
    ema50: number;
    bias: Bias;
    strength: number;
}

export class TechnicalEngine {
    static analyze(candles: Candle[]): TechAudit {
        const prices = candles.map(c => c.close);
        const rsi = Indicators.RSI(prices);
        const ema20 = Indicators.EMA(prices, 20);
        const ema50 = Indicators.EMA(prices, 50);
        const lastPrice = prices[prices.length - 1];

        let bias: Bias = 'NEUTRAL';
        let strength = 0;

        // BUY CONDITIONS: Trend is up + RSI not overbought
        if (lastPrice > ema20 && ema20 > ema50) {
            if (rsi < 70) {
                bias = 'BUY';
                strength = rsi < 40 ? 0.9 : 0.7; // Stronger if oversold but trending
            }
        } 
        // SELL CONDITIONS: Trend is down + RSI not oversold
        else if (lastPrice < ema20 && ema20 < ema50) {
            if (rsi > 30) {
                bias = 'SELL';
                strength = rsi > 60 ? 0.9 : 0.7;
            }
        }

        return { rsi, ema20, ema50, bias, strength };
    }
}
