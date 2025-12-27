// Signal Stream Service
// Manages real-time signal streaming to clients

import { getActiveStrategies } from './strategyManager';
import { AISignal } from '@/types/global';

export interface SignalStream {
  id: string;
  symbol: string;
  signal: AISignal;
  timestamp: string;
}

export class SignalStreamService {
  private streams: Map<string, WebSocket> = new Map();
  private subscribers: Map<string, Set<WebSocket>> = new Map();

  subscribe(symbol: string, ws: WebSocket) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    this.subscribers.get(symbol)?.add(ws);
  }

  unsubscribe(symbol: string, ws: WebSocket) {
    this.subscribers.get(symbol)?.delete(ws);
  }

  async broadcastSignal(signal: AISignal) {
    const subscribers = this.subscribers.get(signal.symbol);
    if (!subscribers || subscribers.size === 0) return;

    const streamData: SignalStream = {
      id: `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol: signal.symbol,
      signal,
      timestamp: new Date().toISOString()
    };

    const message = JSON.stringify(streamData);

    for (const ws of subscribers) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } catch (error) {
        console.error(`Failed to send stream to client for ${signal.symbol}:`, error);
        this.unsubscribe(signal.symbol, ws);
      }
    }
  }

  async generateAndBroadcast(symbol: string, features: any) {
    const strategies = getActiveStrategies();

    // Simulate signal generation (in real app, call AI engine)
    const signal: AISignal = {
      id: `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      symbol,
      action: 'BUY', // or based on analysis
      probability: 72, // calculated probability
      confidence: 'HIGH',
      reasoning: `Strong trend, positive momentum for ${symbol}`,
      strategy: 'SMA_CROSS_RSI',
      decisionState: 'DISPATCH_READY',
      targets: {
        entry: features.price || 0,
        sl: features.price ? features.price * 0.95 : 0,
        t1: features.price ? features.price * 1.05 : 0,
        t2: features.price ? features.price * 1.10 : 0
      },
      timestamp: new Date().toLocaleTimeString(),
      marketRegime: 'TRENDING'
    };

    await this.broadcastSignal(signal);
  }

  getSubscriberCount(symbol?: string): number {
    if (symbol) {
      return this.subscribers.get(symbol)?.size || 0;
    }

    return this.subscribers.size;
  }

  clearAll(): void {
    this.subscribers.clear();
    this.subscribers.forEach(set => set.clear());
    this.streams.clear();
  }
}

// Namespace export for component compatibility
export const signalStreamService = new SignalStreamService();
