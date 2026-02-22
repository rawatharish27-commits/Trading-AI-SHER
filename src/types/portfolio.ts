// Portfolio types
export interface Portfolio {
  id: string;
  userId: string;
  totalValue: number;
  cashBalance: number;
  investedValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  lastUpdated: string;
}

export interface Position {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  dayChange: number;
  dayChangePercent: number;
  weight: number; // Percentage of portfolio
  openedAt: string;
  lastUpdated: string;
}

export interface PositionDetail extends Position {
  orders: import('./order').Order[];
  signals: import('./signal').Signal[];
  history: PositionHistory[];
}

export interface PositionHistory {
  timestamp: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  pnl: number;
}

export interface PortfolioSummary {
  totalHoldings: number;
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  totalReturnsPercent: number;
  bestPerformer: {
    symbol: string;
    returns: number;
    returnsPercent: number;
  } | null;
  worstPerformer: {
    symbol: string;
    returns: number;
    returnsPercent: number;
  } | null;
  allocation: PortfolioAllocation[];
}

export interface PortfolioAllocation {
  symbol: string;
  value: number;
  percentage: number;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'BUY' | 'SELL' | 'DEPOSIT' | 'WITHDRAWAL' | 'DIVIDEND' | 'FEE';
  symbol?: string;
  quantity?: number;
  price?: number;
  amount: number;
  description: string;
  createdAt: string;
}
