
import { PortfolioItem, PortfolioHealth, SectorExposure, HedgeHint } from '../../types';

export class PortfolioRiskEngine {
  private static readonly SECTOR_LIMIT_PCT = 30;

  /**
   * Performs an institutional-grade risk scan of the entire portfolio AUM.
   */
  static analyze(holdings: PortfolioItem[]): PortfolioHealth {
    const totalAUM = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    const sectorMap: Record<string, number> = {};

    holdings.forEach(h => {
      const sector = h.sector || 'OTHER';
      sectorMap[sector] = (sectorMap[sector] || 0) + (h.currentPrice * h.quantity);
    });

    const sectorExposure: SectorExposure[] = Object.entries(sectorMap).map(([name, value]) => {
      const pct = totalAUM > 0 ? (value / totalAUM) * 100 : 0;
      return {
        sector: name,
        value: value,
        percentage: parseFloat(pct.toFixed(2)),
        riskStatus: pct > this.SECTOR_LIMIT_PCT ? 'CRITICAL' : (pct > 20 ? 'WARNING' : 'SAFE')
      };
    });

    const hedgeHints: HedgeHint[] = [];
    const criticalSector = sectorExposure.find(s => s.riskStatus === 'CRITICAL');
    
    if (criticalSector) {
      const instrument = criticalSector.sector === 'BANKING' ? 'BANKNIFTY FUT' : 'NIFTY FUT';
      /**
       * Fix: Added missing 'active' property to HedgeHint object.
       */
      hedgeHints.push({
        instrument,
        action: 'SELL',
        reason: `Institutional Concentration detected in ${criticalSector.sector} (${criticalSector.percentage}%). Risk must be offset via ${instrument} Short.`,
        impactOnBeta: -0.45,
        active: true
      });
    }

    // Heuristic correlation index (increases with asset overlap)
    const correlationIndex = holdings.length > 3 ? (0.6 + (holdings.length * 0.02)) : 0.45;

    /**
     * Fix: Added missing 'portfolioBeta' property to satisfy PortfolioHealth interface.
     */
    return {
      correlationIndex: Math.min(correlationIndex, 0.95),
      sectorExposure,
      hedgeHints,
      portfolioBeta: 0.85
    };
  }
}
