
export enum ViewState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  DASHBOARD = 'DASHBOARD',
  PORTFOLIO = 'PORTFOLIO',
  SIGNALS = 'SIGNALS',
  WATCHLIST = 'WATCHLIST',
  BACKTEST = 'BACKTEST',
  SETTINGS = 'SETTINGS'
}

export interface Instrument {
  id: string;
  symbol: string;
  name: string;
  lastPrice: number;
  changePercent: number;
  volume: number;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface AISignal {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timestamp: string;
  reasoning: string;
  strategy: 'Momentum' | 'Breakout' | 'Mean Reversion';
}

export interface ChartDataPoint {
  date: string;
  equity: number;
}

export interface AnalysisResult {
  symbol: string;
  analysis: string;
  timestamp: number;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  twoFactorEnabled: boolean;
}

// --- Phase 4: Market Data Types ---

export interface MarketTick {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  volume: number;
}

export interface LivePriceResponse {
  symbol: string;
  lastPrice: number;
  lastUpdated: string;
  dayOpen?: number;
  dayHigh?: number;
  dayLow?: number;
  dayVolume?: number;
  change?: number;
  changePercent?: number;
}

export interface Candle {
  time: string; // HH:mm or ISO
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface HistoricalResponse {
  symbol: string;
  timeFrame: string;
  candles: Candle[];
}

export interface MarketState {
  isConnected: boolean;
  indices: {
    NIFTY50: MarketTick;
    BANKNIFTY: MarketTick;
    SENSEX: MarketTick;
  };
  portfolioTicks: Record<string, number>; // Symbol -> Current Price
}

// --- Phase 7: Advanced Views ---

export interface BacktestResult {
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: number;
  equityCurve: ChartDataPoint[];
}

export interface RiskConfig {
  maxCapitalPerTrade: number;
  maxDailyLoss: number;
  maxOpenPositions: number;
  stopLossDefault: number; // Percentage
}
