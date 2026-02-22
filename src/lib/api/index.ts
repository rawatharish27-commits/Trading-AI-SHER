// API Services Index - Export all API services
export { api, ApiClient } from './api-client';
export { authApi } from './auth-api';
export { signalsApi } from './signals-api';
export { ordersApi } from './orders-api';
export { portfolioApi } from './portfolio-api';
export { marketApi } from './market-api';

// Re-export types
export type { User, LoginCredentials, RegisterData, TokenResponse } from './auth-api';
export type { Signal, SignalListResponse, SignalStatsResponse, SignalFilter } from './signals-api';
export type { Order, OrderCreateData, OrderListResponse, OrderFilter } from './orders-api';
export type { Position, Portfolio, PortfolioStats, PositionListResponse } from './portfolio-api';
export type { Quote, OHLCV, MarketIndex, MarketMover, MarketStatus } from './market-api';
