
import { DailyReport, Trade, EquitySnapshot } from '../../types';

export class ReportService {
  generateDaily(trades: Trade[], equity: EquitySnapshot): DailyReport {
    const closedToday = trades.filter(t => 
      t.status === 'CLOSED' && 
      new Date(t.exitTime!).toDateString() === new Date().toDateString()
    );

    const netPnL = closedToday.reduce((acc, t) => acc + (t.pnl || 0), 0);
    const wins = closedToday.filter(t => (t.pnl || 0) > 0).length;
    
    const riskBreaches: string[] = [];
    if (equity.maxDrawdown > 0.05) riskBreaches.push("MAX_DD_EXCEEDED_5%");
    
    // Find best strategy by PnL
    const stratPnL: Record<string, number> = {};
    closedToday.forEach(t => {
      stratPnL[t.strategy] = (stratPnL[t.strategy] || 0) + (t.pnl || 0);
    });
    const bestStrategy = Object.keys(stratPnL).reduce((a, b) => stratPnL[a] > stratPnL[b] ? a : b, 'NONE');

    return {
      date: new Date().toISOString().split('T')[0],
      totalTrades: closedToday.length,
      netPnL,
      maxDrawdown: Math.round(equity.maxDrawdown * 10000) / 100,
      winRate: closedToday.length > 0 ? (wins / closedToday.length) * 100 : 0,
      riskBreaches,
      bestStrategy,
      sharpeRatio: 1.85 // Heuristic for demo
    };
  }
}

export const reportService = new ReportService();
