/**
 * 🧮 EXPECTED VALUE (EV) FILTER
 * Institutional Rule: Profits come from positive EV, not just high accuracy.
 */
export class EVFilter {
  /**
   * Formula: (WinProb * AvgWin) - (LossProb * AvgLoss)
   */
  static calculate(winProb: number, avgWin: number, avgLoss: number): number {
    const lossProb = 1 - winProb;
    return (winProb * avgWin) - (lossProb * avgLoss);
  }

  /**
   * The Ultimate "No-Trade" Barrier.
   */
  static isViable(winProb: number, avgWin: number, avgLoss: number): { allowed: boolean; ev: number } {
    const ev = this.calculate(winProb, avgWin, avgLoss);
    
    // Rule: EV must be positive to authorize capital deployment
    return {
      allowed: ev > 0,
      ev
    };
  }
}
