import { SymbolMemory } from '../../types';

export class DecisionMemory {
  private static readonly STORAGE_KEY = 'sher_asset_memory';

  static record(symbol: string, result: 'WIN' | 'LOSS', regime: string) {
    const memory = this.getMemory(symbol);
    
    memory.totalTrades++;
    memory.lastOutcome = result;
    if (result === 'WIN') memory.winRate = ((memory.winRate * (memory.totalTrades - 1)) + 100) / memory.totalTrades;
    else memory.winRate = (memory.winRate * (memory.totalTrades - 1)) / memory.totalTrades;

    // Track Regime Bias
    memory.regimeBias[regime] = (memory.regimeBias[regime] || 1) + (result === 'WIN' ? 0.1 : -0.1);
    
    const allMemory = this.getAll();
    allMemory[symbol] = memory;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allMemory));
  }

  static getMemory(symbol: string): SymbolMemory {
    const all = this.getAll();
    return all[symbol] || {
      symbol,
      winRate: 50,
      totalTrades: 0,
      lastOutcome: 'WIN',
      regimeBias: { 'TREND': 1, 'RANGE': 1 },
      trapFrequency: 0.1
    };
  }

  private static getAll(): Record<string, SymbolMemory> {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  }
}