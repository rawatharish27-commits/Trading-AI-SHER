// Capital Allocator Service
// Allocates capital across strategies based on performance

import { getStrategyPerformanceSummary } from './strategyManager';
import { getActiveStrategies } from './strategyManager';
import { getTradeHistory } from './tradeJournal';

export interface CapitalAllocation {
  strategy: string;
  weight: number;
  capital: number;
  reason: string;
}

export class CapitalAllocator {
  // ... (class implementation)
}

export async function calculateCapitalAllocation(
  totalCapital: number
): Promise<CapitalAllocation[]> {
  const summary = getStrategyPerformanceSummary();
  const strategies = getActiveStrategies();

  if (summary.totalStrategies === 0) {
    return [{
      strategy: 'CASH',
      weight: 1.0,
      capital: totalCapital,
      reason: 'No active strategies, all capital in cash'
    }];
  }

  const allocations: CapitalAllocation[] = [];

  // Allocate based on performance score
  const totalPerformanceScore = strategies.reduce(
    (sum, s) => sum + s.performance.performanceScore,
    0
  );

  for (const strategy of strategies) {
    const weight = strategy.performance.performanceScore / totalPerformanceScore;
    const capital = totalCapital * weight;

    allocations.push({
      strategy: strategy.name,
      weight,
      capital,
      reason: `Performance Score: ${strategy.performance.performanceScore}`
    });
  }

  return allocations;
}

export async function getCapitalEfficiency(): Promise<{
  totalPnl: number;
  totalCapital: number;
  efficiency: number;
}> {
  const trades = await getTradeHistory(100);
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const totalCapital = 1000000;

  const efficiency = totalCapital > 0 ? (totalPnl / totalCapital) * 100 : 0;

  return {
    totalPnl,
    totalCapital,
    efficiency
  };
}

export async function getRecommendedAllocation(
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'
): Promise<CapitalAllocation[]> {
  const totalCapital = 1000000;

  switch (riskTolerance) {
    case 'CONSERVATIVE':
      const summary = getStrategyPerformanceSummary();
      if (!summary.bestStrategy) {
        return [{ strategy: 'CASH', weight: 1.0, capital: totalCapital, reason: 'No strategies' }];
      }

      return [{
        strategy: summary.bestStrategy.name,
        weight: 0.7,
        capital: totalCapital * 0.7,
        reason: 'Best performer (Conservative)'
      }, {
        strategy: 'CASH',
        weight: 0.3,
        capital: totalCapital * 0.3,
        reason: 'Cash buffer'
      }];

    case 'MODERATE':
      return await calculateCapitalAllocation(totalCapital);

    case 'AGGRESSIVE':
      const summary2 = getStrategyPerformanceSummary();
      const best = summary2.bestStrategy;
      const secondBest = summary2.worstStrategy;

      if (!best) {
        return [{ strategy: 'CASH', weight: 1.0, capital: totalCapital, reason: 'No strategies' }];
      }

      const allocations = [{
        strategy: best.name,
        weight: 0.6,
        capital: totalCapital * 0.6,
        reason: 'Best performer (Aggressive)'
      }];

      if (secondBest) {
        allocations.push({
          strategy: secondBest.name,
          weight: 0.4,
          capital: totalCapital * 0.4,
          reason: 'Second best performer'
        });
      }

      return allocations;

    default:
      return await calculateCapitalAllocation(totalCapital);
  }
}

// Namespace export for component compatibility
export const capitalAllocator = {
  calculateCapitalAllocation,
  getCapitalEfficiency,
  getRecommendedAllocation,
  CapitalAllocator
};
