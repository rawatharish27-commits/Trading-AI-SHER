
import { PortfolioItem } from '../../types';

/**
 * 🔌 UNIVERSAL BROKER SHARD INTERFACE
 * Allows SHER AI to remain broker-agnostic.
 */
export interface IBrokerAdapter {
  name: string;
  connect(): Promise<boolean>;
  placeOrder(params: any): Promise<{ orderId: string; status: string }>;
  getHoldings(): Promise<PortfolioItem[]>;
  getFunds(): Promise<{ available: number; utilized: number }>;
  disconnect(): Promise<void>;
}

export class BrokerFactory {
  static getAdapter(brokerName: string): any {
    // In production, returns specific implementation (Angel, Zerodha, Upstox)
    console.log(`🔌 [BrokerFactory] Sharding for ${brokerName}...`);
    return null; 
  }
}
