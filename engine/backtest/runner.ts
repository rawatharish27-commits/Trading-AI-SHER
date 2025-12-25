
import { Candle } from '../../lib/indicators';
import { simulateTrade } from './simulator';
import { PerformanceMetrics } from './metrics';
import { emaRsiStrategy } from './strategies/emaRsi';

export class BacktestRunner {
    static run(candles: Candle[], strategyName: string, initialCapital: number = 100000) {
        const trades: any[] = [];
        let inPosition = false;
        let position: any = null;

        const strategyFunc = strategyName === 'EMA_RSI' ? emaRsiStrategy : (c: Candle[]) => null;

        for (let i = 50; i < candles.length; i++) {
            const currentSlice = candles.slice(0, i + 1);
            const currentCandle = candles[i];
            
            if (!inPosition) {
                const signal = strategyFunc(currentSlice);
                if (signal) {
                    position = {
                        side: signal.side,
                        entry: signal.price,
                        time: new Date().toISOString()
                    };
                    inPosition = true;
                }
            } else {
                // Simplified exit logic: 3 candles later
                if (i % 3 === 0 || i === candles.length - 1) {
                    const result = simulateTrade(position.entry, currentCandle.close, 10, position.side);
                    trades.push({
                        ...position,
                        exit: result.exit,
                        pnl: result.pnl,
                        pnlPct: result.pnlPct,
                        exitTime: new Date().toISOString()
                    });
                    inPosition = false;
                }
            }
        }

        const stats = PerformanceMetrics.calculate(trades, initialCapital);
        
        let balance = initialCapital;
        const equityCurve = trades.map(t => {
            balance += t.pnl;
            return { time: t.exitTime, equity: balance };
        });

        return { stats, trades, equityCurve };
    }
}
