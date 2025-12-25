
import { BacktestTrade } from './simulator';

export interface PerformanceStats {
    totalPnL: number;
    totalReturnPct: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    sharpeRatio: number;
    avgWin: number;
    avgLoss: number;
    expectancy: number;
    tradeCount: number;
}

export class PerformanceMetrics {
    static calculate(trades: BacktestTrade[], initialCapital: number): PerformanceStats {
        if (trades.length === 0) {
            return { totalPnL: 0, totalReturnPct: 0, winRate: 0, profitFactor: 0, maxDrawdown: 0, sharpeRatio: 0, avgWin: 0, avgLoss: 0, expectancy: 0, tradeCount: 0 };
        }

        const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
        const wins = trades.filter(t => t.pnl > 0);
        const losses = trades.filter(t => t.pnl <= 0);

        const winRate = (wins.length / trades.length) * 100;
        const grossProfit = wins.reduce((acc, t) => acc + t.pnl, 0);
        const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl, 0));
        
        const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
        const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
        const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

        // Drawdown Calculation
        let peak = initialCapital;
        let current = initialCapital;
        let maxDD = 0;

        trades.forEach(t => {
            current += t.pnl;
            if (current > peak) peak = current;
            const dd = (peak - current) / peak;
            if (dd > maxDD) maxDD = dd;
        });

        // Simplified Sharpe (Daily approx)
        const returns = trades.map(t => t.pnlPct);
        const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const stdDev = Math.sqrt(returns.map(x => Math.pow(x - meanReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
        const sharpeRatio = stdDev === 0 ? 0 : (meanReturn / stdDev) * Math.sqrt(252); // Annualized

        return {
            totalPnL,
            totalReturnPct: (totalPnL / initialCapital) * 100,
            winRate,
            profitFactor,
            maxDrawdown: maxDD * 100,
            sharpeRatio,
            avgWin,
            avgLoss,
            expectancy: (winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss),
            tradeCount: trades.length
        };
    }
}
