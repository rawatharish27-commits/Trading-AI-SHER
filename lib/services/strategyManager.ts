// Strategy Manager Service
// Manages active trading strategies and performance

import { getTradeHistory, getWinLossRatio } from './tradeJournal';
import { StrategyFeatures, AISignal } from '@/types/global';

export interface Strategy {
  name: string;
  type: string;
  weight: number;
  performance: {
    totalTrades: number;
    winRate: number;
    avgPnl: number;
    performanceScore: number; // 0-100
  };
  isActive: boolean;
}

// Default strategy weights
const DEFAULT_STRATEGIES: Record<string, Strategy> = {
  'SMA_CROSS_RSI': {
    name: 'SMA Cross RSI',
    type: 'TREND_FOLLOWING',
    weight: 1.0,
    performance: {
      totalTrades: 0,
      winRate: 65,
      avgPnl: 0,
      performanceScore: 50
    },
    isActive: true
  },
  'EMA_PULLBACK': {
    name: 'EMA Pullback',
    type: 'MEAN_REVERSION',
    weight: 1.0,
    performance: {
      totalTrades: 0,
      winRate: 68,
      avgPnl: 0,
      performanceScore: 55
    },
    isActive: true
  },
  'RANGE_BREAKOUT': {
    name: 'Range Breakout',
    type: 'VOLATILITY',
    weight: 1.0,
    performance: {
      totalTrades: 0,
      winRate: 70,
      avgPnl: 0,
      performanceScore: 60
    },
    isActive: true
  },
  'LIQUIDITY_SWEEP': {
    name: 'Liquidity Sweep Reversal',
    type: 'SMART_MONEY',
    weight: 1.0,
    performance: {
      totalTrades: 0,
      winRate: 75,
      avgPnl: 0,
      performanceScore: 70
    },
    isActive: true
  }
};

let strategies = { ...DEFAULT_STRATEGIES };

// Load strategies from storage (simulated)
export async function loadStrategies(): Promise<void> {
  try {
    const stored = localStorage.getItem('sher_strategies');
    if (stored) {
      strategies = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load strategies:', error);
    strategies = { ...DEFAULT_STRATEGIES };
  }
}

// Save strategies to storage
export async function saveStrategies(): Promise<void> {
  try {
    localStorage.setItem('sher_strategies', JSON.stringify(strategies));
  } catch (error) {
    console.error('Failed to save strategies:', error);
  }
}

// Get all strategies
export function getStrategies(): Record<string, Strategy> {
  return strategies;
}

// Get active strategies
export function getActiveStrategies(): Strategy[] {
  return Object.values(strategies).filter(s => s.isActive);
}

// Get strategy by name
export function getStrategy(name: string): Strategy | undefined {
  return strategies[name];
}

// Update strategy weight
export function updateStrategyWeight(name: string, weight: number): void {
  if (strategies[name]) {
    strategies[name].weight = Math.max(0, Math.min(5, weight));
    saveStrategies();
  }
}

// Update strategy performance
export async function updateStrategyPerformance(name: string): Promise<void> {
  const strategy = strategies[name];
  if (!strategy) return;

  const trades = await getTradeHistory(100);
  const strategyTrades = trades.filter(t => t.strategy === name);

  if (strategyTrades.length > 0) {
    const winLoss = await getWinLossRatio(name);
    const wins = winLoss.wins;
    const losses = winLoss.losses;
    const total = winLoss.total;

    const winRate = (wins / total) * 100;
    const avgPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / total;

    // Calculate performance score (0-100)
    // Weighted combination of win rate (60%), avg PnL (30%), trade count (10%)
    const performanceScore =
      (winRate * 0.6) +
      (avgPnl > 0 ? Math.min(100, avgPnl * 10) : 0) * 0.3 +
      (Math.min(100, total) / 10) * 0.1;

    strategies[name].performance = {
      totalTrades: total,
      winRate,
      avgPnl,
      performanceScore: Math.round(performanceScore)
    };
  }

  // Adjust weight based on performance
  if (winRate > 60 && avgPnl > 0) {
    strategies[name].weight = Math.min(5, strategy.weight + 0.5);
  } else if (winRate < 50 || avgPnl < 0) {
    strategies[name].weight = Math.max(0.5, strategy.weight - 0.5);
  }

  await saveStrategies();
}

// Activate/deactivate strategy
export function toggleStrategy(name: string, isActive: boolean): void {
  if (strategies[name]) {
    strategies[name].isActive = isActive;
    saveStrategies();
  }
}

// Calculate ensemble probability from active strategies
export function calculateEnsembleProbability(
  signals: AISignal[]
): { probability: number; confidence: string; evidenceCount: number } {
  const activeStrategies = getActiveStrategies();
  let totalWeight = 0;
  let weightedProbability = 0;

  for (const signal of signals) {
    const strategy = strategies[signal.strategy];
    if (strategy && strategy.isActive) {
      totalWeight += strategy.weight;
      weightedProbability += signal.probability * strategy.weight;
    }
  }

  if (totalWeight === 0) return {
    probability: 0,
    confidence: 'LOW',
    evidenceCount: 0
  };

  const ensembleProbability = weightedProbability / totalWeight;
  const confidence = ensembleProbability > 70 ? 'HIGH' : ensembleProbability > 50 ? 'MEDIUM' : 'LOW';
  const evidenceCount = signals.length;

  return {
    probability: Math.round(ensembleProbability),
    confidence,
    evidenceCount
  };
}

// Get strategy performance summary
export function getStrategyPerformanceSummary(): {
  totalStrategies: number;
  activeStrategies: number;
  bestStrategy: Strategy | null;
  worstStrategy: Strategy | null;
  avgWinRate: number;
} {
  const allStrategies = Object.values(strategies);
  const active = getActiveStrategies();

  if (allStrategies.length === 0) {
    return {
      totalStrategies: 0,
      activeStrategies: 0,
      bestStrategy: null,
      worstStrategy: null,
      avgWinRate: 0
    };
  }

  // Sort by performance score
  const sorted = [...allStrategies].sort((a, b) => b.performance.performanceScore - a.performance.performanceScore);

  const totalWinRate = allStrategies.reduce((sum, s) => sum + s.performance.winRate, 0) / allStrategies.length;

  return {
    totalStrategies: allStrategies.length,
    activeStrategies: active.length,
    bestStrategy: sorted[0] || null,
    worstStrategy: sorted[sorted.length - 1] || null,
    avgWinRate: Math.round(totalWinRate)
  };
}
