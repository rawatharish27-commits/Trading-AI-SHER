
import { Trade, TradeAnalytics } from '../../types';

export const calculateAnalytics = (trades: Trade[]): TradeAnalytics => {
  const closed = trades.filter(t => t.status === 'CLOSED' && t.pnl !== undefined);
  const wins = closed.filter(t => t.pnl! > 0);
  const losses = closed.filter(t => t.pnl! <= 0);

  const totalPnL = closed.reduce((acc, t) => acc + t.pnl!, 0);
  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  
  const avgWin = wins.length > 0 ? wins.reduce((acc, t) => acc + t.pnl!, 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((acc, t) => acc + t.pnl!, 0) / losses.length : 0;

  const grossProfit = wins.reduce((acc, t) => acc + t.pnl!, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnl!, 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

  const expectancy = (winRate / 100 * avgWin) + ((1 - winRate / 100) * avgLoss);

  // Added basic absolute drawdown calculation to satisfy TradeAnalytics interface requirement.
  let peak = 0;
  let currentAccumulatedPnL = 0;
  let maxDrawdownValue = 0;

  closed.forEach(t => {
    currentAccumulatedPnL += t.pnl!;
    if (currentAccumulatedPnL > peak) peak = currentAccumulatedPnL;
    const dd = peak - currentAccumulatedPnL;
    if (dd > maxDrawdownValue) maxDrawdownValue = dd;
  });

  return {
    totalTrades: closed.length,
    winRate,
    netPnL: totalPnL,
    avgWin,
    avgLoss,
    expectancy,
    profitFactor,
    maxDrawdown: maxDrawdownValue
  };
};
