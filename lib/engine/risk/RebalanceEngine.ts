
import { PortfolioItem, RebalanceAction } from '../../../types';

export class RebalanceEngine {
  private static readonly DRIFT_TOLERANCE = 5; // 5%

  /**
   * Identifies symbols that have drifted from target allocation.
   */
  static detectDrift(items: PortfolioItem[], targetWeights: Record<string, number>): RebalanceAction[] {
    const totalAUM = items.reduce((sum, i) => sum + (i.currentPrice * i.quantity), 0);
    const actions: RebalanceAction[] = [];

    Object.entries(targetWeights).forEach(([symbol, targetWeight]) => {
      const item = items.find(i => i.symbol === symbol);
      const currentWeight = item ? ((item.currentPrice * item.quantity) / totalAUM) * 100 : 0;
      const drift = currentWeight - targetWeight;

      if (Math.abs(drift) > this.DRIFT_TOLERANCE) {
        const targetValue = (targetWeight / 100) * totalAUM;
        const currentValue = item ? (item.currentPrice * item.quantity) : 0;
        const diffValue = targetValue - currentValue;
        const price = item?.currentPrice || 100; // Fallback price
        
        actions.push({
          symbol,
          currentWeight: parseFloat(currentWeight.toFixed(2)),
          targetWeight,
          drift: parseFloat(drift.toFixed(2)),
          action: diffValue > 0 ? 'BUY' : 'SELL',
          quantity: Math.floor(Math.abs(diffValue) / price)
        });
      }
    });

    return actions;
  }
}
