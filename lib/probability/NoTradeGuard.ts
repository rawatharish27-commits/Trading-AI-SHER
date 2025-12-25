import { MarketRegime, ProbabilityShard } from './types';

/**
 * 🛑 NO-TRADE GUARD (The Institutional Veto)
 * Goal: Capital preservation via decision withholding.
 */
export class NoTradeGuard {
  private static readonly UNCERTAINTY_CEILING = 0.45;
  private static readonly PROB_FLOOR = 0.65;

  static evaluate(shard: ProbabilityShard): { allowed: boolean; reason?: string } {
    // 1. Panic Veto
    if (shard.regime === 'PANIC') {
      return { allowed: false, reason: 'REGIME_VETO: Panic/High-Entropy mode detected.' };
    }

    // 2. Uncertainty Veto
    if (shard.uncertainty > this.UNCERTAINTY_CEILING) {
      return { allowed: false, reason: `UNCERTAINTY_VETO: Consensus conflict @ ${shard.uncertainty}` };
    }

    // 3. Conviction Veto
    const conviction = Math.abs(shard.final - 0.5) * 2;
    if (conviction < (this.PROB_FLOOR - 0.5) * 2) {
      return { allowed: false, reason: 'CONVICTION_VETO: Probability below institutional floor.' };
    }

    return { allowed: true };
  }
}