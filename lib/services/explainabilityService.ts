
import { FeatureImpact, Trade } from '../../types';

/**
 * 🧠 SHER EXPLAINABILITY ENGINE
 * Goal: Identifying which technical features are actually driving alpha.
 */
class ExplainabilityService {
  private impactRegistry: Map<string, FeatureImpact[]> = new Map();

  /**
   * Learns from trade outcomes.
   * If a trade was a win, the contributing features are rewarded.
   */
  recordTradeImpact(strategy: string, features: Record<string, number>, pnl: number) {
    const isWin = pnl > 0;
    const impacts: FeatureImpact[] = Object.entries(features).map(([key, val]) => ({
      feature: key,
      impact: isWin ? val : -val,
      consistency: isWin ? 0.8 : 0.4
    }));

    this.impactRegistry.set(strategy, impacts);
    
    // Persist for Admin Dashboard
    if (typeof window !== 'undefined') {
       localStorage.setItem(`sher_impact_${strategy}`, JSON.stringify(impacts));
    }
  }

  getImpacts(strategy: string): FeatureImpact[] {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(`sher_impact_${strategy}`);
    return saved ? JSON.parse(saved) : [
      { feature: 'TREND', impact: 0.85, consistency: 0.9 },
      { feature: 'VOLUME', impact: 0.62, consistency: 0.7 },
      { feature: 'ORDERFLOW', impact: 0.45, consistency: 0.5 },
      { feature: 'STRUCTURE', impact: 0.12, consistency: 0.3 }
    ];
  }
}

export const explainabilityService = new ExplainabilityService();
