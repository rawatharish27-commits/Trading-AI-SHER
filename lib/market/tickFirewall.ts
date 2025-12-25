
import { DataMode } from '../../types';

/**
 * 🧱 INSTITUTIONAL TICK FIREWALL (v3.0)
 * Goal: Absolute Parity. Zero leakage of simulated data into live execution path.
 */
export class TickFirewall {
  /**
   * Validates the integrity and source of an incoming price node.
   */
  static validate(tick: any, expectedMode: DataMode): { valid: boolean; reason?: string } {
    // 1. Basic Structure Shard
    if (!tick.price && !tick.ltp) return { valid: false, reason: "MALFORMED_PACKET: Missing LTP." };
    if (!tick.symbol && !tick.token) return { valid: false, reason: "MISSING_IDENTITY: Token or Symbol required." };

    // 2. LIVE INTEGRITY CHECK (Non-Negotiable)
    if (expectedMode === DataMode.LIVE) {
      // Exchange ticks MUST have a timestamp from the exchange core
      const hasExchangeTs = !!tick.timestamp && tick.timestamp > 1700000000000;
      
      if (!hasExchangeTs) {
        return { valid: false, reason: "AUTHENTICITY_FAILURE: Tick lacks verifiable exchange timestamp." };
      }

      // 3. LATENCY GUARD: Block execution if data is stale (> 3s lag)
      const drift = Date.now() - tick.timestamp;
      if (drift > 3000) {
        return { valid: false, reason: `STALE_DATA_VETO: Shard drift ${drift}ms exceeds 3s ceiling.` };
      }

      // 4. SOURCE AUDIT
      if (tick.isReal === false) {
        return { valid: false, reason: "SECURITY_BREACH: Synthetic tick detected in LIVE channel." };
      }
    }

    // 5. SIMULATION ISOLATION
    if (expectedMode === DataMode.SIMULATED && tick.isReal === true) {
      // Prevent real price pressure from polluting backtests or demos unless intended
      return { valid: false, reason: "ISOLATION_BREACH: Live tick leaked into SIM environment." };
    }

    return { valid: true };
  }

  // REAL WS vs FAKE DATA DETECTOR
  static isRealAngelTick(tick: any): boolean {
    return (
      tick.exchange === "NSE" &&
      tick.token &&
      typeof tick.last_traded_price === "number" &&
      Math.abs(Date.now() - tick.timestamp) < 2000
    );
  }
}
