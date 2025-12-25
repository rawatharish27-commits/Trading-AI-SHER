
import { OrderIntent, AISignal } from '../../types';
import { lineageStore } from '../lineage/lineageStore';

/**
 * 🏹 ORDER INTENT SERVICE
 * Responsibility: Prevent ghost orders via client-side idempotency.
 */
export class OrderIntentService {
  private static intents: Map<string, OrderIntent> = new Map();

  static createIntent(signal: AISignal, qty: number): OrderIntent {
    const intentId = `INTENT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const intent: OrderIntent = {
      intentId,
      traceId: signal.id, // Linking to Signal Trace
      symbol: signal.symbol,
      side: signal.action as 'BUY' | 'SELL',
      quantity: qty,
      strategy: signal.strategy,
      timestamp: Date.now(),
      status: 'PENDING'
    };

    this.intents.set(intentId, intent);
    
    lineageStore.record({
      traceId: signal.id,
      eventType: 'INTENT',
      symbol: signal.symbol,
      payload: intent
    });

    return intent;
  }

  static updateStatus(intentId: string, status: OrderIntent['status']) {
    const intent = this.intents.get(intentId);
    if (intent) {
      intent.status = status;
      this.intents.set(intentId, intent);
    }
  }

  static getIntent(intentId: string) {
    return this.intents.get(intentId);
  }
}
