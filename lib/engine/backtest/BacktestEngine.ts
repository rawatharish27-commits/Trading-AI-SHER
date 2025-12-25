import { Candle } from '../../indicators';

/**
 * 📊 ALPHA BACKTEST ENGINE
 * Goal: Proof of Process on historical shards.
 */
export class BacktestEngine {
  static run(
    candles: Candle[],
    strategyFn: (candles: Candle[], index: number) => { side: 'BUY' | 'SELL' } | null,
    capital = 100000
  ) {
    let balance = capital;
    const trades = [];

    // Skip initial window for indicators
    for (let i = 20; i < candles.length - 1; i++) {
      const signal = strategyFn(candles, i);

      if (!signal) continue;

      const entry = candles[i].close;
      const exit = candles[i + 1].close; // Simplistic next-bar exit for alpha calc

      const pnl = signal.side === "BUY"
        ? exit - entry
        : entry - exit;

      balance += pnl;

      trades.push({
        time: (candles[i] as any).time || new Date().toISOString(),
        side: signal.side,
        entry,
        exit,
        pnl,
        equity: balance
      });
    }

    const wins = trades.filter(t => t.pnl > 0).length;
    
    return {
      finalBalance: balance,
      totalReturnPct: ((balance - capital) / capital) * 100,
      totalTrades: trades.length,
      winRate: (wins / trades.length) * 100,
      trades
    };
  }
}
