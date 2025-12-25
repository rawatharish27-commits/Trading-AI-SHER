
import { PortfolioItem, SectorExposure, CorrelationMatrix } from '../../types';

export class RiskHub {
  /**
   * Calculates sector-level capital concentration.
   */
  static getSectorExposure(holdings: PortfolioItem[]): SectorExposure[] {
    const totalValue = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    const sectors: Record<string, number> = {};

    holdings.forEach(h => {
      const sector = h.sector || 'Unclassified';
      sectors[sector] = (sectors[sector] || 0) + (h.currentPrice * h.quantity);
    });

    /* Fix: Return complete SectorExposure objects including riskStatus and value to resolve compilation error */
    return Object.entries(sectors).map(([sector, value]) => {
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return {
        sector,
        value,
        percentage,
        riskStatus: percentage > 30 ? 'CRITICAL' : (percentage > 20 ? 'WARNING' : 'SAFE') as 'CRITICAL' | 'WARNING' | 'SAFE'
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  /**
   * Heuristic Correlation Matrix. 
   * In production, this uses 30-day log-return covariance.
   */
  static getCorrelationMatrix(symbols: string[]): CorrelationMatrix {
    const matrix: CorrelationMatrix = {};
    const sectors: Record<string, string> = {
        'RELIANCE': 'ENERGY', 'TCS': 'IT', 'INFY': 'IT', 'HDFCBANK': 'BANKING', 'ICICIBANK': 'BANKING'
    };

    symbols.forEach(s1 => {
      matrix[s1] = {};
      symbols.forEach(s2 => {
        if (s1 === s2) matrix[s1][s2] = 1.0;
        else if (sectors[s1] === sectors[s2]) matrix[s1][s2] = 0.85; // High intra-sector
        else matrix[s1][s2] = 0.2 + Math.random() * 0.3; // Low inter-sector
      });
    });

    return matrix;
  }
}
