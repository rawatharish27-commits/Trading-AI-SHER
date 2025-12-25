
import { Trade } from '../../types';

class TradeJournal {
  private trades: Trade[] = [];

  constructor() {
    // Initial mock data for demonstration
    this.trades = [
       { id: 't1', symbol: 'RELIANCE', side: 'BUY', quantity: 10, entryPrice: 2450.00, exitPrice: 2480.00, pnl: 300.00, strategy: 'Momentum', entryTime: new Date(Date.now() - 3600000).toISOString(), exitTime: new Date(Date.now() - 1800000).toISOString(), status: 'CLOSED' },
       { id: 't2', symbol: 'TCS', side: 'SELL', quantity: 5, entryPrice: 3950.00, exitPrice: 3890.00, pnl: 300.00, strategy: 'Mean Reversion', entryTime: new Date(Date.now() - 7200000).toISOString(), exitTime: new Date(Date.now() - 3600000).toISOString(), status: 'CLOSED' }
    ];
  }

  addTrade(trade: Trade) {
    this.trades.push(trade);
  }

  updateTrade(id: string, updates: Partial<Trade>) {
    const index = this.trades.findIndex(t => t.id === id);
    if (index !== -1) {
      this.trades[index] = { ...this.trades[index], ...updates };
    }
  }

  getTrades() {
    return this.trades;
  }
}

export const tradeJournal = new TradeJournal();
