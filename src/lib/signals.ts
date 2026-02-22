import { api } from './api';
import { Signal, SignalDetail, SignalFilters, CreateSignalInput } from '@/types/signal';
import { PaginatedResponse } from '@/types/api';

export const signalsApi = {
  /**
   * Get all signals with optional filters
   */
  async getSignals(filters?: SignalFilters): Promise<PaginatedResponse<Signal>> {
    const response = await api.get<PaginatedResponse<Signal>>('/signals', {
      ...(filters?.symbol && { symbol: filters.symbol }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.source && { source: filters.source }),
      ...(filters?.confidence && { confidence: filters.confidence }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.page && { page: filters.page }),
      ...(filters?.limit && { limit: filters.limit }),
    });
    return response.data;
  },

  /**
   * Get a single signal by ID
   */
  async getSignal(id: string): Promise<SignalDetail> {
    const response = await api.get<SignalDetail>(`/signals/${id}`);
    return response.data;
  },

  /**
   * Create a new signal
   */
  async createSignal(input: CreateSignalInput): Promise<Signal> {
    const response = await api.post<Signal>('/signals', input);
    return response.data;
  },

  /**
   * Update a signal
   */
  async updateSignal(id: string, input: Partial<CreateSignalInput>): Promise<Signal> {
    const response = await api.patch<Signal>(`/signals/${id}`, input);
    return response.data;
  },

  /**
   * Cancel a signal
   */
  async cancelSignal(id: string): Promise<Signal> {
    const response = await api.post<Signal>(`/signals/${id}/cancel`);
    return response.data;
  },

  /**
   * Execute a signal
   */
  async executeSignal(id: string): Promise<Signal> {
    const response = await api.post<Signal>(`/signals/${id}/execute`);
    return response.data;
  },

  /**
   * Get active signals count
   */
  async getActiveCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/signals/active/count');
    return response.data;
  },

  /**
   * Get signal performance metrics
   */
  async getPerformance(): Promise<{
    totalSignals: number;
    winRate: number;
    avgReturn: number;
    avgHoldingPeriod: number;
  }> {
    const response = await api.get<{
      totalSignals: number;
      winRate: number;
      avgReturn: number;
      avgHoldingPeriod: number;
    }>('/signals/performance');
    return response.data;
  },
};
