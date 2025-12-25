
import { AISignal } from '../../types';

export class AlertRouter {
  /**
   * Dispatches signal to all active nodes with built-in safety to prevent process crashes.
   */
  static async dispatch(signal: AISignal) {
    try {
      // 🛡️ SANITY CHECKS
      if (!signal || !signal.symbol || !signal.targets) {
        console.warn("[AlertRouter] Blocked malformed signal dispatch.");
        return;
      }

      if (signal.probability < 0.85) return;

      const message = `
🚨 SHER ALPHA: ${signal.symbol} ${signal.action}
Strategy: ${signal.strategy || 'Neural Core'}
Prob: ${(signal.probability * 100).toFixed(1)}%
Entry: ₹${signal.targets.entry?.toLocaleString() || 'N/A'}
SL: ₹${signal.targets.sl?.toLocaleString() || 'N/A'}
T1: ₹${signal.targets.t1?.toLocaleString() || 'N/A'}
      `.trim();

      // LOG TO TERMINAL (SIMULATED TELEGRAM/DISCORD OUTBOUND)
      console.info(`[AlertRouter] Dispatched Node Alert for ${signal.symbol} via Neural Bridge.`);
      console.debug(message);
      
      // Real-time synchronization for mobile web listeners
      this.syncToMobile(signal);
    } catch (err) {
      // 🛡️ PREVENT GLOBAL CRASH
      console.error("[AlertRouter] Critical Dispatch Error Caught:", err);
    }
  }

  private static syncToMobile(signal: AISignal) {
    try {
      if (typeof window !== 'undefined') {
         window.dispatchEvent(new CustomEvent('sher-mobile-sync', { detail: signal }));
      }
    } catch (e) {
      console.warn("[AlertRouter] Mobile Sync Shield triggered.");
    }
  }
}
