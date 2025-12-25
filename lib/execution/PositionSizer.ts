import { PositionSizingParams } from './types';

/**
 * 🧮 POSITION SIZER
 * Goal: Deploy capital proportional to edge and inverse to risk.
 */
export class PositionSizer {
  private static readonly MAX_RISK_PER_TRADE = 0.015; // 1.5% max unit risk
  private static readonly MIN_QUANTITY = 1;

  static calculate(params: PositionSizingParams, ltp: number): number {
    // 1. Basic Risk Amount (1% of Equity)
    let baseRiskAmt = params.equity * this.MAX_RISK_PER_TRADE;

    // 2. Confidence Multiplier (Fractional Kelly)
    // If confidence is 0.6 (low consensus), we only trade 60% of our max risk
    const edgeFactor = Math.max(0.4, params.confidence);
    
    // 3. Drawdown Throttling (Anti-Revenge Logic)
    // If drawdown > 2%, reduce risk by 50%
    const ddPenalty = params.currentDrawdown > 0.02 ? 0.5 : 1.0;
    
    // 4. Volatility Scaling
    const volPenalty = params.regimeVolatility > 2.0 ? 0.7 : 1.0;

    const finalRiskAmt = baseRiskAmt * edgeFactor * ddPenalty * volPenalty;
    
    // 5. Quantity derivation
    // Qty = RiskAmt / StopLossPoints
    if (params.stopLossPoints <= 0) return 0;
    
    const qty = Math.floor(finalRiskAmt / params.stopLossPoints);

    return Math.max(qty, this.MIN_QUANTITY);
  }
}