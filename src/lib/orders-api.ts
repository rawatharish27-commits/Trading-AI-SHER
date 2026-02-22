// Orders API Service
import { api } from './api-client';

// Types
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOPLOSS_LIMIT' | 'STOPLOSS_MARKET';
export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';
export type ProductType = 'DELIVERY' | 'INTRADAY' | 'MARGIN' | 'BO' | 'CO';

export interface Order {
  id: number;
  user_id: number;
  order_id: string | null;
  client_order_id: string | null;
  symbol: string;
  exchange: string;
  side: OrderSide;
  order_type: OrderType;
  product_type: ProductType;
  quantity: number;
  filled_quantity: number;
  pending_quantity: number;
  price: number;
  trigger_price: number | null;
  average_price: number;
  stop_loss: number | null;
  square_off: number | null;
  trailing_sl: number | null;
  status: OrderStatus;
  rejection_reason: string | null;
  broker: string;
  broker_order_id: string | null;
  broker_message: string | null;
  signal_id: number | null;
  strategy: string | null;
  order_time: string;
  execution_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderCreateData {
  symbol: string;
  exchange?: string;
  side: OrderSide;
  order_type?: OrderType;
  product_type?: ProductType;
  quantity: number;
  price?: number;
  trigger_price?: number;
  stop_loss?: number;
  square_off?: number;
  trailing_sl?: number;
  signal_id?: number;
  strategy?: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface OrderFilter {
  status?: OrderStatus;
  side?: OrderSide;
  symbol?: string;
  product_type?: ProductType;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

// Orders API
export const ordersApi = {
  // Get all orders
  async getOrders(params?: OrderFilter): Promise<OrderListResponse> {
    return api.get<OrderListResponse>('/orders', params as any);
  },

  // Get single order
  async getOrder(id: number): Promise<Order> {
    return api.get<Order>(`/orders/${id}`);
  },

  // Get order by order_id
  async getOrderByOrderId(orderId: string): Promise<Order> {
    return api.get<Order>(`/orders/order/${orderId}`);
  },

  // Place order
  async placeOrder(data: OrderCreateData): Promise<Order> {
    return api.post<Order>('/orders', data);
  },

  // Cancel order
  async cancelOrder(id: number): Promise<Order> {
    return api.post<Order>(`/orders/${id}/cancel`);
  },

  // Modify order
  async modifyOrder(id: number, data: Partial<OrderCreateData>): Promise<Order> {
    return api.patch<Order>(`/orders/${id}`, data);
  },

  // Get today's orders
  async getTodayOrders(): Promise<Order[]> {
    return api.get<Order[]>('/orders/today');
  },

  // Get pending orders
  async getPendingOrders(): Promise<Order[]> {
    return api.get<Order[]>('/orders/pending');
  },

  // Get order statistics
  async getStats(): Promise<{
    total: number;
    filled: number;
    cancelled: number;
    rejected: number;
    fill_rate: number;
  }> {
    return api.get('/orders/stats');
  },
};

export default ordersApi;
