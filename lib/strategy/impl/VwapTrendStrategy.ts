import { StrategyBase } from '../StrategyBase';
import { StrategyOpinion } from '../types';
import { TickState } from '../../engine/TickEngine';
import { MarketRegime } from '../../probability/types';

export class VwapTrendStrategy extends StrategyBase {
  constructor() {
    super({
      id: 'vwap-trend-01',
      name: 'VWAP Trend Rider',
      category: 'TREND',
      supportedRegimes: ['TREND', 'EXPANSION'],
      weight: 1.2,
      minConfidence: 0.65
    });
  }

  evaluate(tick: TickState, regime: MarketRegime): StrategyOpinion {
    const history = tick.tickHistory;
    const last = tick.ltp;
    
    // Mock VWAP calculation
    const vwap = history.reduce((a, b) => a + b, 0) / history.length;
    const distance = (last - vwap) / vwap;
    
    let direction: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let confidence = 0;

    if (distance > 0.002) {
      direction = 'BUY';
      confidence = Math.min(distance * 100, 1);
    } else if (distance < -0.002) {
      direction = 'SELL';
      confidence = Math.min(Math.abs(distance) * 100, 1);
    }

    return this.createOpinion(direction, confidence, 0.8, regime);
  }
}