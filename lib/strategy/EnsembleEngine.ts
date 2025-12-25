import { StrategyBase } from './StrategyBase';
import { VwapTrendStrategy } from './impl/VwapTrendStrategy';
import { RsiExtremeStrategy } from './impl/RsiExtremeStrategy';
import { EnsembleDecision } from './types';
import { TickState } from '../engine/TickEngine';
import { MarketRegime } from '../probability/types';
import { ConflictResolver } from './ConflictResolver';

/**
 * 🦁 ENSEMBLE ENGINE
 * Goal: Multi-Strategy Voting & Governance
 */
class EnsembleEngine {
  private strategies: StrategyBase[] = [
    new VwapTrendStrategy(),
    new RsiExtremeStrategy()
    // LiquiditySweep and others would follow here
  ];

  async vote(tick: TickState, regime: MarketRegime): Promise<EnsembleDecision> {
    const opinions = this.strategies
      .map(s => s.evaluate(tick, regime))
      .filter(op => op.direction !== 'NEUTRAL');

    if (opinions.length === 0) {
      return { 
        decision: 'NO_TRADE', 
        consensusStrength: 0, 
        votes: { BUY: 0, SELL: 0, NEUTRAL: 1 }, 
        opinions: [], 
        reason: 'NO_STRATEGY_TRIGGERED' 
      };
    }

    return ConflictResolver.resolve(opinions);
  }

  getRegistry() {
    return this.strategies.map(s => s.metadata);
  }
}

export const ensembleEngine = new EnsembleEngine();