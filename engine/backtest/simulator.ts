
/**
 * 📊 BACKTEST SIMULATOR CORE
 */
// Fix: Defining BacktestTrade interface directly to resolve circular reference and missing export.
export interface BacktestTrade {
  entry: number;
  exit: number;
  qty: number;
  pnl: number;
  pnlPct: number;
}

export function simulateTrade(entry: number, exit: number, qty: number, side: 'BUY' | 'SELL'): BacktestTrade {
  // Institutional Reality: Slippage (0.05%) + Taxes
  const slippage = entry * 0.0005;
  const realEntry = side === 'BUY' ? entry + slippage : entry - slippage;
  const realExit = side === 'BUY' ? exit - slippage : exit + slippage;

  const pnl = side === 'BUY'
      ? (realExit - realEntry) * qty
      : (realEntry - realExit) * qty;

  return { 
    entry: realEntry, 
    exit: realExit, 
    qty, 
    pnl,
    pnlPct: (pnl / (realEntry * qty)) * 100
  };
}
