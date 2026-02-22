import { api } from './api';
import { Order, OrderDetail, CreateOrderInput, OrderFilters, OrderBook } from '@/types/order';
import { PaginatedResponse } from '@/types/api';

export const ordersApi = {
  /**
   * Get all orders with optional filters
   */
  async getOrders(filters?: OrderFilters): Promise<PaginatedResponse<Order>> {
    const response = await api.get<PaginatedResponse<Order>>('/orders', {
      ...(filters?.symbol && { symbol: filters.symbol }),
      ...(filters?.side && { side: filters.side }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.page && { page: filters.page }),
      ...(filters?.limit && { limit: filters.limit }),
    });
    return response.data;
  },

  /**
   * Get a single order by ID
   */
  async getOrder(id: string): Promise<OrderDetail> {
    const response = await api.get<OrderDetail>(`/orders/${id}`);
    return response.data;
  },

  /**
   * Create a new order
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await api.post<Order>('/orders', input);
    return response.data;
  },

  /**
   * Cancel an order
   */
  async cancelOrder(id: string): Promise<Order> {
    const response = await api.post<Order>(`/orders/${id}/cancel`);
    return response.data;
  },

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string): Promise<OrderBook> {
    const response = await api.get<OrderBook>(`/orders/book/${symbol}`);
    return response.data;
  },

  /**
   * Get today's orders count
   */
  async getTodayCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/orders/today/count');
    return response.data;
  },

  /**
   * Get pending orders
   */
  async getPendingOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/pending');
    return response.data;
  },
};
