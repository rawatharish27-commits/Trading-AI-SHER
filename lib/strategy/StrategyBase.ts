import { MarketRegime } from '../probability/types';
import { StrategyMetadata, StrategyOpinion, StrategyDirection } from './types';
import { TickState } from '../engine/TickEngine';

export abstract class StrategyBase {
  constructor(public metadata: StrategyMetadata) {}

  /**
   * Primary logic implementation for each shard.
   */
  abstract evaluate(tick: TickState, regime: MarketRegime): StrategyOpinion;

  /**
   * Helper to calculate regime compatibility.
   */
  protected getRegimeFit(regime: MarketRegime): number {
    return this.metadata.supportedRegimes.includes(regime) ? 1.0 : 0.2;
  }

  protected createOpinion(direction: StrategyDirection, confidence: number, strength: number, regime: MarketRegime): StrategyOpinion {
    return {
      strategyId: this.metadata.id,
      direction,
      confidence,
      evidenceStrength: strength,
      regimeFit: this.getRegimeFit(regime)
    };
  }
}