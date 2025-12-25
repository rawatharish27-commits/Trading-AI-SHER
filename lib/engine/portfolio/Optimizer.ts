
import { AISignal, PortfolioItem } from '../../../types';

/**
 * 📊 SHER PORTFOLIO OPTIMIZER
 * Logic: Optimizes capital allocation based on inverse volatility and correlation penalties.
 */
export class PortfolioOptimizer {
  /**
   * Calculates the allocation weight for a signal node.
   * Formula: Weight = (Probability) / (Volatility * (1 + CorrelationPenalty))
   */
  static optimize(
    signal: AISignal, 
    volatility: number, 
    sectorExposure: number, 
    baseCapital: number
  ): number {
    // 1. Confidence Scaling
    const probWeight = Math.pow(signal.probability, 2);

    // 2. Correlation Penalty (Sector Crowding)
    // If sector exposure > 20%, start penalizing the new trade's size
    const correlationPenalty = sectorExposure > 0.20 ? (sectorExposure - 0.20) * 5 : 0;

    // 3. Volatility Normalization (Risk Parity Shard)
    // Higher vol -> smaller relative size to maintain constant risk contribution
    const volWeight = 1 / Math.max(volatility, 0.005);

    // 🦁 Institutional Core Math
    const rawWeight = (probWeight * volWeight) / (1 + correlationPenalty);
    
    // Clamp at 15% of AUM per single node to prevent "All-in" scenarios
    const maxWeight = 0.15;
    const finalWeight = Math.min(rawWeight, maxWeight);

    return Math.floor(baseCapital * finalWeight);
  }

  /**
   * Simplified Correlation Matrix calculation for Admin view.
   */
  static getCorrelation(aReturns: number[], bReturns: number[]): number {
    const meanA = aReturns.reduce((s, x) => s + x, 0) / aReturns.length;
    const meanB = bReturns.reduce((s, x) => s + x, 0) / bReturns.length;
    
    const num = aReturns.reduce((s, x, i) => s + (x - meanA) * (bReturns[i] - meanB), 0);
    const den = Math.sqrt(
      aReturns.reduce((s, x) => s + Math.pow(x - meanA, 2), 0) * 
      bReturns.reduce((s, x) => s + Math.pow(x - meanB, 2), 0)
    );

    return den === 0 ? 0 : num / den;
  }
}
