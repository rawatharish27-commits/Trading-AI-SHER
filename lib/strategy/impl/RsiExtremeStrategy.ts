import { StrategyBase } from '../StrategyBase';
import { StrategyOpinion } from '../types';
import { TickState } from '../../engine/TickEngine';
import { MarketRegime } from '../../probability/types';

export class RsiExtremeStrategy extends StrategyBase {
  constructor() {
    super({
      id: 'rsi-extreme-01',
      name: 'RSI Over-extension',
      category: 'MEAN_REVERSION',
      supportedRegimes: ['CHOP'],
      weight: 0.8,
      minConfidence: 0.7
    });
  }

  evaluate(tick: TickState, regime: MarketRegime): StrategyOpinion {
    // Mock RSI logic
    const last = tick.ltp;
    const prev = tick.tickHistory[tick.tickHistory.length - 20] || last;
    const change = (last - prev) / prev;
    
    let direction: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;

    if (change > 0.02) { // "Overbought" simulation
      direction = 'SELL';
      confidence = 0.75;
    } else if (change < -0.02) { // "Oversold"
      direction = 'BUY';
      confidence = 0.75;
    }

    return this.createOpinion(direction, confidence, 0.6, regime);
  }
}