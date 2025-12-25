
import { PortfolioItem, PortfolioHealth, HedgeHint, AssetClass } from '../../types';
import { eventBus } from './eventBus';

export class HedgeOrchestrator {
  private static readonly MAX_BETA = 1.2;

  /**
   * Automatically dispatches hedge orders if portfolio risk breaches the Beta ceiling.
   */
  static evaluate(holdings: PortfolioItem[], health: PortfolioHealth) {
    const totalAUM = holdings.reduce((s, h) => s + (h.currentPrice * h.quantity), 0);
    
    health.hedgeHints.forEach(hint => {
      if (hint.active && Math.abs(health.portfolioBeta) > this.MAX_BETA) {
        // Dispatch to Order Engine via Bus
        eventBus.emit('exec.dispatch', {
          symbol: hint.instrument,
          action: hint.action,
          quantity: Math.floor((totalAUM * 0.1) / hint.impactOnBeta), // 10% AUM Offset
          type: 'MARKET',
          reason: `Auto-Hedge: Portfolio Beta (${health.portfolioBeta}) exceeded ${this.MAX_BETA}`
        }, 'HEDGE_ORCHESTRATOR');
      }
    });
  }
}
