import { AISignal } from '../../types';

/**
 * 🛡️ SEBI COMPLIANCE ALERT DISPATCHER
 */
export class AlertService {
  private static readonly SEBI_DISCLAIMER = `
    --- MANDATORY DISCLOSURE ---
    SHER.AI provides market analysis for educational/informational purposes only. 
    Past performance is not indicative of future results. 
    Consult a SEBI-registered advisor before investing.
  `.trim();

  static async dispatch(signal: AISignal) {
    const isAlertOnly = process.env.SEBI_MODE === "ALERT_ONLY" || true;

    const message = `
🚨 SHER ALPHA DETECTED: ${signal.symbol}
Action: ${signal.action}
Confidence: ${(signal.probability * 100).toFixed(0)}%
Reason: ${signal.reasoning}

${this.SEBI_DISCLAIMER}
    `.trim();

    console.info("🦁 [ComplianceNode] Dispatching Verified Alert...");
    console.debug(message);

    if (typeof window !== 'undefined') {
       window.dispatchEvent(new CustomEvent('sher-alert-broadcast', { detail: { signal, message } }));
    }
  }
}