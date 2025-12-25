
import { Trade, StrategyStatus } from '../../types';
import { eventBus } from '../engine/eventBus';
import { DecayMonitor } from '../engine/governance/DecayMonitor';

export interface PerformanceStats {
  wins: number;
  losses: number;
  netPnL: number;
}

/**
 * 🦁 STRATEGY MANAGER (Learner Node)
 * Responsible for the "Memory" of the AI.
 * Adjusts technical weights based on real-world execution alpha.
 */
class StrategyManager {
  private stats: Map<string, PerformanceStats> = new Map();
  
  // Weights for individual features (used by ProbabilityEngineV3)
  private featureWeights: Record<string, number> = {
    TREND: 0.30,
    VOLUME: 0.25,
    ORDERFLOW: 0.25,
    STRUCTURE: 0.20
  };

  // Weights for specific strategies (used by CapitalAllocator)
  private strategyWeights: Map<string, number> = new Map([
    ['EMA Pullback', 1.0],
    ['VWAP Trend Ride', 1.0],
    ['Squeeze Breakout', 1.0],
    ['Liquidity Sweep', 1.0],
    ['SMA Cross + RSI', 1.0],
    ['Sher Sovereign Ensemble', 1.0]
  ]);

  constructor() {
    this.loadWeights();
  }

  private loadWeights() {
    if (typeof window === 'undefined') return;
    const savedFeatures = localStorage.getItem('sher_neural_weights_v4');
    if (savedFeatures) {
      this.featureWeights = JSON.parse(savedFeatures);
    }
    const savedStrats = localStorage.getItem('sher_strategy_weights_v1');
    if (savedStrats) {
      try {
        const parsed = JSON.parse(savedStrats);
        Object.entries(parsed).forEach(([k, v]) => this.strategyWeights.set(k, v as number));
      } catch (e) {
        console.error("Failed to load strategy weights", e);
      }
    }
  }

  private saveWeights() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('sher_neural_weights_v4', JSON.stringify(this.featureWeights));
    
    const stratObj: Record<string, number> = {};
    this.strategyWeights.forEach((v, k) => {
      stratObj[k] = v;
    });
    localStorage.setItem('sher_strategy_weights_v1', JSON.stringify(stratObj));
  }

  getWeights() {
    return this.featureWeights;
  }

  getWeight(name: string): number {
    return this.strategyWeights.get(name) || 1.0;
  }

  getWinRate(name: string): number {
    const perf = this.stats.get(name);
    if (!perf) return 50;
    const total = perf.wins + perf.losses;
    return total > 0 ? (perf.wins / total) * 100 : 50;
  }

  calibrate(trades: Trade[]) {
    const closed = trades.filter(t => t.status === 'CLOSED');
    if (closed.length === 0) return;

    const lastTrade = closed[closed.length - 1];
    const isWin = (lastTrade.pnl || 0) > 0;
    
    const lr = 0.01;

    if (isWin) {
      this.featureWeights.TREND = Math.min(0.5, this.featureWeights.TREND + lr);
      this.featureWeights.ORDERFLOW = Math.min(0.5, this.featureWeights.ORDERFLOW + lr);
    } else {
      this.featureWeights.TREND = Math.max(0.1, this.featureWeights.TREND - lr * 1.5);
      this.featureWeights.VOLUME = Math.max(0.1, this.featureWeights.VOLUME - lr);
    }

    const total = this.featureWeights.TREND + this.featureWeights.VOLUME + this.featureWeights.ORDERFLOW + this.featureWeights.STRUCTURE;
    this.featureWeights.TREND /= total;
    this.featureWeights.VOLUME /= total;
    this.featureWeights.ORDERFLOW /= total;
    this.featureWeights.STRUCTURE /= total;

    this.saveWeights();
    
    eventBus.emit('audit.log', { 
      msg: "Neural Weights Calibrated", 
      weights: this.featureWeights 
    }, 'STRATEGY_MANAGER');
  }

  recordTradeOutcome(strategyName: string, pnl: number) {
    const prev = this.stats.get(strategyName) || { wins: 0, losses: 0, netPnL: 0 };
    
    const outcome = {
      wins: prev.wins + (pnl > 0 ? 1 : 0),
      losses: prev.losses + (pnl <= 0 ? 1 : 0),
      netPnL: prev.netPnL + pnl
    };

    this.stats.set(strategyName, outcome);
    this.adjustStrategyWeight(strategyName, outcome);
    
    this.saveWeights();
  }

  private adjustStrategyWeight(name: string, stats: PerformanceStats) {
    const total = stats.wins + stats.losses;
    if (total < 5) return; 

    const winRate = stats.wins / total;
    const newWeight = Math.min(Math.max(winRate * 2, 0.5), 2.0);
    this.strategyWeights.set(name, newWeight);
  }

  evaluatePerformance(trades: Trade[]): StrategyStatus[] {
    const names = Array.from(this.strategyWeights.keys());
    return names.map(name => {
      const perf = this.stats.get(name) || { wins: 0, losses: 0, netPnL: 0 };
      const total = perf.wins + perf.losses;
      const winRate = total > 0 ? (perf.wins / total) * 100 : 64;

      // 🕵️ DECAY AUDIT
      const decayAudit = DecayMonitor.evaluate(name, trades);

      return {
        name,
        winRate,
        netPnL: perf.netPnL,
        expectancy: winRate > 50 ? 0.45 : -0.15,
        profitFactor: winRate > 50 ? 1.85 : 0.75,
        status: decayAudit.status,
        weight: this.strategyWeights.get(name) || 1.0,
        reason: decayAudit.reason,
        decayScore: decayAudit.score
      };
    });
  }
}

export const strategyManager = new StrategyManager();
