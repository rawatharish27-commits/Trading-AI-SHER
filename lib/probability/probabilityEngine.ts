/**
 * 🧠 CALIBRATED PROBABILITY ENGINE (PHASE 11/12)
 * Goal: Transform raw technical signals into statistically valid conviction scores.
 */

export type SignalInput = {
  rsi: number;
  volumeSpike: number;
  vwapDistance: number;
  momentum: number;
  marketDepthImbalance: number;
  volatility: number;
};

export class ProbabilityEngine {
  /**
   * Normalizes values for the probability shard.
   */
  static normalize(value: number, min: number, max: number): number {
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * Scodes and weights signals for institutional filtering.
   */
  static scoreSignals(s: SignalInput) {
    return [
      { name: "RSI", score: this.normalize(s.rsi, 30, 70), weight: 0.15 },
      { name: "Volume", score: this.normalize(s.volumeSpike, 1, 3), weight: 0.2 },
      { name: "VWAP", score: this.normalize(s.vwapDistance, -1, 1), weight: 0.15 },
      { name: "Momentum", score: this.normalize(s.momentum, -2, 2), weight: 0.2 },
      { name: "Depth", score: this.normalize(s.marketDepthImbalance, -1, 1), weight: 0.2 },
      { name: "Volatility", score: this.normalize(1 / (s.volatility || 0.01), 0, 1), weight: 0.1 }
    ];
  }

  /**
   * Computes calibrated rule-based probability.
   * Uses Sigmoid smoothing: 1 / (1 + exp(-6 * (raw - 0.5)))
   */
  static computeRuleBased(signals: SignalInput) {
    const scored = this.scoreSignals(signals);
    const weightedSum = scored.reduce((s, x) => s + x.score * x.weight, 0);
    const totalWeight = scored.reduce((s, x) => s + x.weight, 0);
    
    const raw = weightedSum / (totalWeight || 1);

    // Institutional Sigmoid Calibration
    const probability = 1 / (1 + Math.exp(-6 * (raw - 0.5)));

    return {
      probability,
      confidence: Math.abs(probability - 0.5) * 2
    };
  }
}
