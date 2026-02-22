// Market data types
export interface MarketQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  avgVolume: number;
  marketCap?: number;
  pe?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  lastUpdated: string;
}

export interface MarketCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketChartData {
  symbol: string;
  interval: '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w' | '1M';
  data: MarketCandle[];
  lastUpdated: string;
}

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  type: 'GAINER' | 'LOSER' | 'ACTIVE';
}

export interface MarketOverview {
  indices: MarketIndex[];
  topGainers: MarketMover[];
  topLosers: MarketMover[];
  mostActive: MarketMover[];
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';
  lastUpdated: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  addedAt: string;
  notes?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
}

// WebSocket message types
export interface WebSocketMessage<T = unknown> {
  type: 'QUOTE' | 'SIGNAL' | 'ORDER' | 'PORTFOLIO' | 'ERROR' | 'HEARTBEAT';
  data: T;
  timestamp: string;
}

export interface QuoteUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}
