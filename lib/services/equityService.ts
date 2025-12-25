
import { ChartDataPoint, EquitySnapshot } from '../../types';

class EquityService {
  private initialCapital = 250000;
  private curve: ChartDataPoint[] = [];
  private peakEquity = 250000;
  private maxDrawdown = 0;

  constructor() {
    // Seed historical data for visualization
    const now = new Date();
    let current = this.initialCapital - 10000;
    for (let i = 30; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 86400000);
      current += (Math.random() - 0.4) * 2000; // General uptrend
      this.curve.push({
        date: time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        equity: current
      });
      if (current > this.peakEquity) this.peakEquity = current;
      const dd = (this.peakEquity - current) / this.peakEquity;
      if (dd > this.maxDrawdown) this.maxDrawdown = dd;
    }
  }

  update(realizedPnL: number, unrealizedPnL: number) {
    const currentEquity = this.initialCapital + realizedPnL + unrealizedPnL;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Update curve (keep last 60 points)
    this.curve.push({ date: now, equity: currentEquity });
    if (this.curve.length > 60) this.curve.shift();

    // Drawdown tracking
    if (currentEquity > this.peakEquity) {
      this.peakEquity = currentEquity;
    }
    const currentDrawdown = (this.peakEquity - currentEquity) / this.peakEquity;
    if (currentDrawdown > this.maxDrawdown) {
      this.maxDrawdown = currentDrawdown;
    }
  }

  snapshot(): EquitySnapshot {
    return {
      curve: this.curve,
      maxDrawdown: this.maxDrawdown,
      peakEquity: this.peakEquity,
      currentEquity: this.curve[this.curve.length - 1]?.equity || this.initialCapital
    };
  }
}

export const equityService = new EquityService();
