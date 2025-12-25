import { Candle } from '../../../lib/indicators';
import { ProbabilityEngine } from '../probabilityEngine';
import { strategyManager } from '../strategyManager';
import { FeatureEngine } from '../../features/featureEngine';
import { simulateTrade, BacktestTrade } from './simulator';
import { PerformanceMetrics } from './metrics';

export class BacktestRunner {
  /**
   * 📊 INSTITUTIONAL BACKTEST ENGINE
   * Uses the EXACT SAME logic as Live Execution.
   */
  static run(candles: Candle[], strategyName: string, initialCapital: number = 100000) {
    const trades: BacktestTrade[] = [];
    let currentBalance = initialCapital;

    // Simulation Loop (Windowed)
    for (let i = 50; i < candles.length - 1; i++) {
      const window = candles.slice(0, i + 1);
      const currentCandle = candles[i];
      const nextCandle = candles[i + 1];

      // 1. Feature Extraction
      const features = FeatureEngine.extract(window);
      
      // 2. Probability Calibration (using strategy's current winrate)
      const stratWinRate = strategyManager.getWinRate(strategyName);
      const probScore = ProbabilityEngine.calculate(window, 'BACKTEST', stratWinRate);

      // 3. Execution Logic (High Conviction ONLY)
      if (probScore.final > 85) {
        const action = features.trendAlignment === 1 ? 'BUY' : 'SELL';
        
        // Institutional Simulation: Entry @ Next Open
        const outcome = simulateTrade(nextCandle.open, nextCandle.close, 10, action as any);
        trades.push(outcome);
        currentBalance += outcome.pnl;
        
        // Cooldown period (to simulate institutional position sizing)
        i += 3; 
      }
    }

    const stats = PerformanceMetrics.calculate(trades, initialCapital);
    
    let balance = initialCapital;
    const equityCurve = trades.map((t, idx) => {
      balance += t.pnl;
      return { time: `Trade ${idx + 1}`, equity: balance };
    });

    return { stats, trades, equityCurve };
  }
}