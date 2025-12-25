import { metaBrain } from '../services/metaBrain';
import { AISignal, EngineContext, DecisionState } from '../../types';
import { eventBus } from '../engine/eventBus';

/**
 * 🦁 ENGINE ORCHESTRATOR (Wrapper)
 * Goal: Wrap the existing MetaBrain without modifying its core logic.
 * Takes a lifecycle snapshot of every decision.
 */
class EngineOrchestrator {
  private snapshots: Map<string, any> = new Map();

  async process(symbol: string, features: any, candles: any[], ctx: EngineContext): Promise<AISignal> {
    const signalId = `shrd-${Date.now()}`;
    console.log(`🦁 [Orchestrator] INITIALIZING ${ctx.mode} lifecycle for ${symbol} (Node: ${signalId})`);

    // 1. Initial State Snapshot
    this.takeSnapshot(signalId, 'INIT', { symbol, mode: ctx.mode, timestamp: Date.now() });

    try {
      // 2. Delegate to Existing Core
      const signal = await metaBrain.synthesize(symbol, features, candles);
      
      // 3. Post-Process Enrichment
      const enrichedSignal: AISignal = {
        ...signal,
        id: signalId,
        runMode: ctx.mode,
        quality: this.calculateQuality(signal.probability)
      };

      this.takeSnapshot(signalId, 'DISPATCH', enrichedSignal);
      eventBus.emit('audit.log', { node: signalId, status: 'DISPATCHED', symbol }, 'ORCHESTRATOR');

      return enrichedSignal;
    } catch (err: any) {
      this.takeSnapshot(signalId, 'HALTED', { error: err.message });
      throw err;
    }
  }

  private takeSnapshot(id: string, stage: string, data: any) {
    const existing = this.snapshots.get(id) || {};
    this.snapshots.set(id, { ...existing, [stage]: data });
  }

  private calculateQuality(prob: number): any {
    const pct = prob * 100;
    return {
      probability: Math.round(pct),
      confidenceBand: pct > 85 ? "HIGH" : (pct > 70 ? "MEDIUM" : "LOW"),
      qualityBadge: pct > 90 ? "A+" : (pct > 80 ? "A" : "B")
    };
  }

  getSnapshot(id: string) {
    return this.snapshots.get(id);
  }
}

export const engineOrchestrator = new EngineOrchestrator();