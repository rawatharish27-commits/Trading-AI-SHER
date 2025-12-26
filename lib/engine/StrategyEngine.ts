import { eventBus } from "./eventBus";
import { TickState } from "./TickEngine";
import { FeatureEngine } from "../features/featureEngine";
import { metaBrain } from "./metaBrain";
import { strategyManager } from "./strategyManager";
import { Candle } from "../indicators";

/**
 * 🦁 STRATEGY ENGINE
 * Listens to ticks, extracts features, and triggers Meta-Brain audits.
 */
class StrategyEngine {
  private activeSymbols: Set<string> = new Set();
  private processingLock: Set<string> = new Set();

  constructor() {
    this.initialize();
  }

  private initialize() {
    console.log("🦁 [StrategyEngine] Neural Watcher Engaged.");
    
    eventBus.subscribe('market.tick', (event) => {
      const tick = event.payload as TickState;
      this.evaluate(tick);
    });
  }

  /**
   * Evaluates if a tick pattern warrants a full Meta-Brain audit.
   */
  private async evaluate(tick: TickState) {
    if (this.processingLock.has(tick.symbol)) return;
    if (tick.tickHistory.length < 20) return; // Warm-up requirement

    // 1. Quick Technical Check (Fast Path)
    // We only trigger expensive AI audits if technicals are interesting
    const currentPrice = tick.ltp;
    const avgPrice = tick.tickHistory.reduce((a, b) => a + b, 0) / tick.tickHistory.length;
    const volatility = Math.abs(currentPrice - avgPrice) / avgPrice;

    if (volatility > 0.002 || this.isAtPivot(tick)) {
      this.triggerAudit(tick);
    }
  }

  private isAtPivot(tick: TickState): boolean {
    // Simple pivot logic: Current LTP near session High/Low
    const range = tick.high - tick.low;
    if (range === 0) return false;
    const relativePos = (tick.ltp - tick.low) / range;
    return relativePos > 0.95 || relativePos < 0.05;
  }

  private async triggerAudit(tick: TickState) {
    this.processingLock.add(tick.symbol);
    
    try {
      eventBus.emit('audit.log', { msg: `Neural Audit initiated for ${tick.symbol}`, ltp: tick.ltp }, 'STRATEGY_ENGINE');

      // Mocking candle data for feature engine from tick history
      const mockCandles: Candle[] = tick.tickHistory.map(p => ({
        open: p, high: p, low: p, close: p, volume: tick.volume / tick.tickHistory.length
      }));

      if (mockCandles.length < 50) {
        // Not enough data for institutional feature set
        this.processingLock.delete(tick.symbol);
        return;
      }

      const features = FeatureEngine.extract(mockCandles);
      const signal = await metaBrain.synthesize(tick.symbol, features, mockCandles);

      if (signal.probability > 0.85) {
        eventBus.emit('alpha.discovery', signal, 'STRATEGY_ENGINE');
      }

    } catch (e) {
      console.error(`🦁 [StrategyEngine] Audit Error for ${tick.symbol}:`, e);
    } finally {
      // Release lock after cooldown to prevent spamming
      setTimeout(() => this.processingLock.delete(tick.symbol), 30000);
    }
  }
}

export const strategyEngine = new StrategyEngine();