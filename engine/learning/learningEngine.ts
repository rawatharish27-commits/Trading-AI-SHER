
import { globalWeights, updateGlobalWeights } from './weights';

export class LearningEngine {
  /**
   * Adjusts strategy weights based on trade outcome.
   * Feedback Loop: Reward winning features, penalize losing ones.
   */
  static processTradeResult(pnl: number, conditions: { rsi: boolean, ema: boolean, vol: boolean }) {
    const current = { ...globalWeights };
    const step = 0.05;

    if (pnl > 0) {
      if (conditions.rsi) current.rsi += step;
      if (conditions.ema) current.ema += step;
      if (conditions.vol) current.volume += step;
    } else {
      if (conditions.rsi) current.rsi -= step * 0.5;
      if (conditions.ema) current.ema -= step * 0.5;
      if (conditions.vol) current.volume -= step * 0.5;
    }

    // Clamp weights to safe range [0.5, 2.0]
    current.rsi = Math.max(0.5, Math.min(2.0, current.rsi));
    current.ema = Math.max(0.5, Math.min(2.0, current.ema));
    current.volume = Math.max(0.5, Math.min(2.0, current.volume));

    updateGlobalWeights(current);
    console.debug("[LearningNode] Weights Calibrated:", current);
  }
}
