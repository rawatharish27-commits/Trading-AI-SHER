
import { AISignal, AllocationResult } from '../../types';

export class NotificationService {
  /**
   * Formats a professional trade alert with institutional data.
   */
  formatAlert(signal: AISignal, allocation: AllocationResult): string {
    return `
      <b>SHER MASTER SIGNAL: ${signal.action} ${signal.symbol}</b>
      
      --------------------------
      Strategy: ${signal.strategy}
      Confidence: ${(signal.probability * 100).toFixed(1)}%
      Allocation: ₹${allocation.amount.toLocaleString()}
      Risk per Account: ₹${allocation.risk?.toLocaleString()}
      
      Rationale:
      ${signal.reasoning}
      
      Targets:
      Entry: ₹${signal.targets.entry}
      SL: ₹${signal.targets.sl}
      T1: ₹${signal.targets.t1}
    `;
  }

  async send(signal: AISignal, allocation: AllocationResult) {
    // INSTITUTIONAL RULE: Only notify if probability >= 0.75
    // Avoids noise and fatigue for the trader.
    if (signal.probability < 0.75) {
      console.debug("[Notifier] Signal filtered (Low Prob):", signal.symbol, signal.probability);
      return;
    }

    const message = this.formatAlert(signal, allocation);
    console.debug("[Notifier] External Alert Routed:", message);
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      // Check permission
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission === 'granted') {
        new Notification(`SHER: ${signal.action} ${signal.symbol}`, {
           body: `${signal.strategy} | Probability: ${(signal.probability * 100).toFixed(0)}% | Risk Adjusted`,
           icon: 'https://cdn-icons-png.flaticon.com/512/1150/1150592.png',
           tag: signal.symbol, // Prevent duplicate alerts for the same symbol
           silent: false
        });
      }
    }
  }
}

export const notificationService = new NotificationService();
