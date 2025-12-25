import { EngineStage, EngineContext, DecisionState, AISignal } from '../../../types';
import { eventBus } from '../eventBus';

/**
 * 🦁 SHER ENGINE PIPELINE
 * Condition: "Same engine, different data source"
 */
export class SherEngine {
  constructor(
    private readonly stages: EngineStage<any, any>[]
  ) {}

  async run(initialData: any, ctx: EngineContext): Promise<AISignal> {
    let data = initialData;
    
    console.log(`🦁 [SherEngine] INITIALIZING ${ctx.mode} PIPELINE for ${ctx.symbol}...`);

    for (const stage of this.stages) {
      try {
        const start = performance.now();
        data = await stage.execute(data, ctx);
        const end = performance.now();

        // AUDIT LOGGING (Wraps logic without breaking it)
        eventBus.emit('audit.log', {
          stage: stage.name,
          latency: (end - start).toFixed(2) + 'ms',
          symbol: ctx.symbol,
          mode: ctx.mode
        }, 'ENGINE_PIPELINE');

      } catch (err: any) {
        eventBus.emit('audit.log', {
          level: 'CRITICAL',
          stage: stage.name,
          error: err.message,
          symbol: ctx.symbol
        }, 'ENGINE_PIPELINE');
        
        throw err; // Halt pipeline on critical stage failure
      }
    }

    // Final Post-Process: Attach RunMode Shard
    const finalSignal: AISignal = {
        ...data,
        runMode: ctx.mode
    };

    return finalSignal;
  }
}