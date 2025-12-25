export type TradeState = 'PLANNED' | 'EXECUTING' | 'ACTIVE' | 'EXITING' | 'CLOSED' | 'VETOED';

export interface PositionSizingParams {
  equity: number;
  stopLossPoints: number;
  confidence: number; // 0.0 - 1.0
  regimeVolatility: number;
  currentDrawdown: number; // 0.0 - 1.0
}

export interface ExecutionIntent {
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  orderType: 'MARKET' | 'LIMIT' | 'AGGRESSIVE_LIMIT';
  limitPrice?: number;
  slippageTolerance: number;
}

export interface PortfolioSnapshot {
  totalExposure: number;
  directionalBias: number; // -1.0 to 1.0
  sectorConcentration: Record<string, number>;
  activeTradesCount: number;
  dailyPnL: number;
}