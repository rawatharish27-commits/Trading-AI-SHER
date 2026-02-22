"use client";

import { create } from 'zustand';
import { Order, OrderCreateData, OrderFilter } from '@/lib/orders-api';
import { ordersApi } from '@/lib/orders-api';

interface OrderState {
  orders: Order[];
  pendingOrders: Order[];
  todayOrders: Order[];
  selectedOrder: Order | null;
  isLoading: boolean;
  isPlacing: boolean;
  error: string | null;
  filters: OrderFilter;
  
  // Actions
  fetchOrders: (filters?: OrderFilter) => Promise<void>;
  fetchPendingOrders: () => Promise<void>;
  fetchTodayOrders: () => Promise<void>;
  placeOrder: (data: OrderCreateData) => Promise<Order>;
  cancelOrder: (id: number) => Promise<void>;
  selectOrder: (order: Order | null) => void;
  setFilters: (filters: Partial<OrderFilter>) => void;
  clearError: () => void;
  reset: () => void;
}

const initialFilters: OrderFilter = {
  page: 1,
  page_size: 20,
};

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  pendingOrders: [],
  todayOrders: [],
  selectedOrder: null,
  isLoading: false,
  isPlacing: false,
  error: null,
  filters: initialFilters,

  fetchOrders: async (filters?: OrderFilter) => {
    set({ isLoading: true, error: null });
    try {
      const appliedFilters = { ...get().filters, ...filters };
      const response = await ordersApi.getOrders(appliedFilters);
      set({ 
        orders: response.orders, 
        filters: appliedFilters,
        isLoading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to fetch orders', 
        isLoading: false 
      });
    }
  },

  fetchPendingOrders: async () => {
    try {
      const orders = await ordersApi.getPendingOrders();
      set({ pendingOrders: orders });
    } catch (error: any) {
      console.error('Failed to fetch pending orders:', error);
    }
  },

  fetchTodayOrders: async () => {
    try {
      const orders = await ordersApi.getTodayOrders();
      set({ todayOrders: orders });
    } catch (error: any) {
      console.error('Failed to fetch today orders:', error);
    }
  },

  placeOrder: async (data: OrderCreateData) => {
    set({ isPlacing: true, error: null });
    try {
      const order = await ordersApi.placeOrder(data);
      // Refresh orders
      get().fetchTodayOrders();
      get().fetchPendingOrders();
      set({ isPlacing: false });
      return order;
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to place order', 
        isPlacing: false 
      });
      throw error;
    }
  },

  cancelOrder: async (id: number) => {
    try {
      await ordersApi.cancelOrder(id);
      // Update local state
      set((state) => ({
        orders: state.orders.map(o => 
          o.id === id ? { ...o, status: 'CANCELLED' as const } : o
        ),
        pendingOrders: state.pendingOrders.filter(o => o.id !== id),
        todayOrders: state.todayOrders.map(o =>
          o.id === id ? { ...o, status: 'CANCELLED' as const } : o
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to cancel order' });
      throw error;
    }
  },

  selectOrder: (order) => set({ selectedOrder: order }),

  setFilters: (filters) => {
    set((state) => ({ 
      filters: { ...state.filters, ...filters } 
    }));
    get().fetchOrders({ ...get().filters, ...filters });
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    orders: [],
    pendingOrders: [],
    todayOrders: [],
    selectedOrder: null,
    isLoading: false,
    isPlacing: false,
    error: null,
    filters: initialFilters,
  }),
}));
