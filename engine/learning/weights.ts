
export interface StrategyWeights {
  rsi: number;
  ema: number;
  volume: number;
  orderflow: number;
}

// Initialized at 1.0 (Neutral)
export let globalWeights: StrategyWeights = {
  rsi: 1.0,
  ema: 1.0,
  volume: 1.0,
  orderflow: 1.0,
};

export function updateGlobalWeights(newWeights: StrategyWeights) {
  globalWeights = newWeights;
}
