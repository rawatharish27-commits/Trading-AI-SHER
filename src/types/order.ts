// Order types
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'STOP_LIMIT';
export type OrderStatus = 'PENDING' | 'OPEN' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED';
export type OrderTimeInForce = 'DAY' | 'GTC' | 'IOC' | 'FOK';

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  price: number;
  averagePrice?: number;
  stopPrice?: number;
  timeInForce: OrderTimeInForce;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  cancelledAt?: string;
  expiresAt?: string;
  signalId?: string;
  fees: number;
  totalValue: number;
}

export interface OrderDetail extends Order {
  fills: OrderFill[];
  signal?: import('./signal').Signal;
}

export interface OrderFill {
  id: string;
  orderId: string;
  price: number;
  quantity: number;
  timestamp: string;
  fees: number;
}

export interface CreateOrderInput {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: OrderTimeInForce;
  signalId?: string;
}

export interface OrderFilters {
  symbol?: string;
  side?: OrderSide;
  status?: OrderStatus;
  type?: OrderType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: string;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  orders: number;
}
