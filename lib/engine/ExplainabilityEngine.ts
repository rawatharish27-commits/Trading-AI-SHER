import { ProbabilityComponents } from '../../types';

export class ExplainabilityEngine {
  static generateNarrative(components: ProbabilityComponents): string {
    const factors: string[] = [];

    if (components.technical > 0.75) factors.push("Strong structural trend alignment confirmed via multi-EMA shard.");
    if (components.volume > 0.70) factors.push("Institutional volume participation detected (RVOL > 1.8).");
    if (components.orderBook > 0.65) factors.push("Order-book bid imbalance suggests aggressive accumulation.");
    if (components.marketRegime > 0.9) factors.push("Market regime perfectly fits this strategy's DNA.");

    if (components.correlationPenalty > 0.1) factors.push("WARNING: High sector correlation; position size throttled for safety.");

    return factors.join(" | ");
  }

  static getReasoningPoints(components: ProbabilityComponents): string[] {
    const points = [
        `Technicals: ${(components.technical * 100).toFixed(0)}% Confidence`,
        `Volume Node: ${(components.volume * 100).toFixed(0)}% Participation`,
        `Order-flow: ${(components.orderBook * 100).toFixed(0)}% Depth Bias`
    ];
    return points;
  }
}