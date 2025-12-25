import { DecodedTick } from "../brokers/decoder";

export interface SymbolState {
  token: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  v_today: number;
  last_seq: number;
  last_update: number;
  is_stale: boolean;
}

/**
 * 🧊 TICK STATE STORE
 * Per-symbol single source of truth for market data.
 */
export class TickStateStore {
  private static registry = new Map<string, SymbolState>();
  private static readonly STALE_THRESHOLD = 5000; // 5 seconds

  static update(tick: DecodedTick) {
    const prev = this.registry.get(tick.token);
    
    // Integrity Check: Prevent out-of-order packets if exchange provides sequence
    if (prev && tick.timestamp < prev.last_update) return;

    const state: SymbolState = {
      token: tick.token,
      ltp: tick.ltp,
      open: tick.open || (prev?.open || tick.ltp),
      high: Math.max(prev?.high || tick.ltp, tick.high || tick.ltp),
      low: Math.min(prev?.low || tick.ltp, tick.low || tick.ltp),
      close: tick.close || (prev?.close || tick.ltp),
      v_today: tick.volume || (prev?.v_today || 0),
      last_seq: Date.now(),
      last_update: tick.timestamp,
      is_stale: false
    };

    this.registry.set(tick.token, state);
  }

  static get(token: string): SymbolState | undefined {
    const state = this.registry.get(token);
    if (!state) return undefined;

    // Staleness Detection
    if (Date.now() - state.last_seq > this.STALE_THRESHOLD) {
      state.is_stale = true;
    }
    
    return state;
  }

  static getAll() {
    return Array.from(this.registry.values());
  }
}