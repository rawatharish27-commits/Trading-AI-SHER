import { StrategyDNA } from '../../types';

class GeneticEvolver {
  private population: StrategyDNA[] = [
    { id: '1', name: 'Momentum v1', indicators: ['RSI', 'EMA'], thresholds: { rsi_buy: 30 }, riskMultiplier: 1.0, evolutionGeneration: 1, fitness: 0.72 },
    { id: '2', name: 'Mean Rev v4', indicators: ['BB', 'VWAP'], thresholds: { bb_dev: 2.0 }, riskMultiplier: 1.2, evolutionGeneration: 4, fitness: 0.88 },
    { id: '3', name: 'Breakout v2', indicators: ['Vol', 'ATR'], thresholds: { vol_spike: 1.5 }, riskMultiplier: 0.8, evolutionGeneration: 2, fitness: 0.65 }
  ];

  getPopulation(): StrategyDNA[] {
    return this.population;
  }

  mutate(dna: StrategyDNA): StrategyDNA {
    return {
      ...dna,
      evolutionGeneration: dna.evolutionGeneration + 1,
      fitness: Math.min(0.99, dna.fitness + (Math.random() - 0.4) * 0.1),
      riskMultiplier: Math.max(0.5, dna.riskMultiplier * (1 + (Math.random() - 0.5) * 0.1))
    };
  }

  evolveStep() {
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
    const top = sorted[0];
    const mutant = this.mutate(top);
    this.population = [mutant, ...sorted.slice(0, 4)];
    return mutant;
  }
}

export const geneticEvolver = new GeneticEvolver();