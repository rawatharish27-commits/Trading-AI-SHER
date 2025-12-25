
import { DecodedTick } from "../brokers/decoder";
import { eventBus } from "./eventBus";

export interface TickState {
  symbol: string;
  ltp: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  lastUpdated: number;
  tickHistory: number[]; // For rolling calculations
}

/**
 * 🦁 TICK ENGINE (CORE STORAGE)
 * Maintains the 'Hot State' of all active symbols.
 */
class TickEngine {
  private static state = new Map<string, TickState>();
  // Fix: Make HISTORY_LIMIT static to be accessible in the static update method.
  private static readonly HISTORY_LIMIT = 100;

  static update(tick: DecodedTick) {
    const symbol = tick.token; // In production, we map token to symbol first
    const prev = this.state.get(symbol);

    const next: TickState = {
      symbol,
      ltp: tick.ltp,
      volume: tick.volume || (prev?.volume || 0),
      open: tick.open || (prev?.open || tick.ltp),
      high: Math.max(prev?.high ?? tick.ltp, tick.high || tick.ltp),
      low: Math.min(prev?.low ?? tick.ltp, tick.low || tick.ltp),
      close: tick.close || tick.ltp,
      lastUpdated: tick.timestamp,
      // Fix: Accessing static HISTORY_LIMIT via class name inside static method.
      tickHistory: [...(prev?.tickHistory || []), tick.ltp].slice(-TickEngine.HISTORY_LIMIT)
    };

    this.state.set(symbol, next);

    // Broadcast update to Strategy Engine
    eventBus.emit('market.tick', next, 'TICK_ENGINE');
  }

  static get(symbol: string): TickState | undefined {
    return this.state.get(symbol);
  }

  static getAll(): TickState[] {
    return Array.from(this.state.values());
  }
}

export { TickEngine };
