import { StrategyFeatures, Evidence, EvidenceCluster, EvidenceType } from '../../../types';

export class EvidenceAggregator {
  static generateEvidences(features: StrategyFeatures, direction: "BUY" | "SELL"): Evidence[] {
    const evidences: Evidence[] = [];

    // MOMENTUM CLUSTER
    evidences.push({
      type: "MOMENTUM",
      description: features.momentumScore > 0.7 ? "Strong momentum expansion" : "Momentum slowing",
      strength: features.momentumScore,
      direction: features.momentumScore > 0.5 ? "BULLISH" : "BEARISH"
    });

    // TREND CLUSTER
    evidences.push({
      type: "TREND",
      description: features.trendScore > 0.8 ? "Confirmed structural trend" : "Trend exhaustion risk",
      strength: features.trendScore,
      direction: features.trendScore > 0.5 ? "BULLISH" : "BEARISH"
    });

    // SMART MONEY CLUSTER
    evidences.push({
      type: "SMART_MONEY",
      description: features.smartMoneyScore > 0.7 ? "Institutional accumulation detected" : "Retail participation dominant",
      strength: features.smartMoneyScore,
      direction: features.smartMoneyScore > 0.6 ? "BULLISH" : "BEARISH"
    });

    // STRUCTURE CLUSTER
    evidences.push({
      type: "STRUCTURE",
      description: features.structureScore > 0.7 ? "Base formation stable" : "Fragmented structure",
      strength: features.structureScore,
      direction: features.structureScore > 0.5 ? "BULLISH" : "BEARISH"
    });

    return evidences;
  }

  static aggregateClusters(evidences: Evidence[]): EvidenceCluster[] {
    const map: Record<string, Evidence[]> = {};
    evidences.forEach(e => {
        if (!map[e.type]) map[e.type] = [];
        map[e.type].push(e);
    });

    return Object.entries(map).map(([type, list]) => {
      const avg = list.reduce((s, e) => s + e.strength, 0) / list.length;
      const bullishCount = list.filter(e => e.direction === "BULLISH").length;
      const bearishCount = list.filter(e => e.direction === "BEARISH").length;

      return {
        type: type as EvidenceType,
        avgStrength: avg,
        direction: bullishCount > bearishCount ? "BULLISH" : (bearishCount > bullishCount ? "BEARISH" : "NEUTRAL")
      };
    });
  }

  /**
   * 📉 CONFLICT PENALTY MATH
   * Rule: If 3+ clusters disagree with the trade direction, penalize the probability.
   */
  static calculateConflictPenalty(clusters: EvidenceCluster[], tradeDir: "BUY" | "SELL"): number {
    let conflicts = 0;
    clusters.forEach(c => {
      if (tradeDir === "BUY" && c.direction === "BEARISH") conflicts++;
      if (tradeDir === "SELL" && c.direction === "BULLISH") conflicts++;
    });
    
    // Penalize 7% per conflicting cluster
    return conflicts >= 2 ? conflicts * 0.07 : 0;
  }
}