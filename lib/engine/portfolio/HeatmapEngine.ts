
import { PortfolioItem, HeatmapNode } from '../../../types';

export class HeatmapEngine {
  /**
   * Generates hierarchical heatmap data.
   * X = Sector, Y = Symbol, Value = Exposure, Color = PnL
   */
  static generate(items: PortfolioItem[]): HeatmapNode[] {
    const totalExposure = items.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    
    return items.map(item => {
      const exposure = item.currentPrice * item.quantity;
      return {
        symbol: item.symbol,
        sector: item.sector || 'Unassigned',
        value: exposure,
        pnl: item.pnlPercent,
        weight: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);
  }

  static getSectorDistribution(nodes: HeatmapNode[]) {
    const sectors: Record<string, number> = {};
    nodes.forEach(n => {
      sectors[n.sector] = (sectors[n.sector] || 0) + n.value;
    });
    return sectors;
  }
}
