import { RiskAudit, PositionSizeParams } from '../../../types';
import { pnlService } from '../../services/pnlService';

/**
 * 🧱 SHER DEEP RISK PROCESSOR
 * Rule: AI is subordinate to the Risk Engine.
 */
export class DeepRiskProcessor {
  private static readonly MAX_DAILY_LOSS_PCT = 0.03; // 3%
  private static readonly MAX_RISK_PER_TRADE_PCT = 0.01; // 1%
  private static readonly MIN_RR_THRESHOLD = 2.0;

  /**
   * Evaluates if a trade is permissible under current capital constraints.
   */
  static async validate(params: PositionSizeParams): Promise<RiskAudit> {
    const pnl = pnlService.snapshot();
    const dailyDrawdown = Math.abs(pnl.net) / params.capital;

    // 1. Drawdown Guard (Hard Stop)
    if (dailyDrawdown >= this.MAX_DAILY_LOSS_PCT && pnl.net < 0) {
      return {
        allowed: false,
        reason: `DRAWDOWN_VETO: Daily loss limit (3%) reached. Node Halted.`,
        suggestedQty: 0,
        riskRating: 'CRITICAL',
        firewallCode: 'MAX_DD_BREACH'
      };
    }

    // 2. Probability Gate
    if (params.probability < 0.70) {
      return {
        allowed: false,
        reason: 'PROB_VETO: AI confidence below 70% threshold.',
        suggestedQty: 0,
        riskRating: 'MEDIUM',
        firewallCode: 'PROB_LOW'
      };
    }

    // 3. Position Sizer (Risk Amount / Risk Per Unit)
    const riskAmount = params.capital * this.MAX_RISK_PER_TRADE_PCT;
    const riskPerUnit = Math.abs(params.price - params.stopLossPrice);
    
    if (riskPerUnit <= 0) {
       return { allowed: false, reason: 'GEOMETRY_VETO: Invalid SL Price.', suggestedQty: 0, riskRating: 'CRITICAL', firewallCode: 'INVALID_SL' };
    }

    const suggestedQty = Math.floor(riskAmount / riskPerUnit);

    return {
      allowed: suggestedQty > 0,
      reason: 'RISK_CLEARED',
      suggestedQty: Math.min(suggestedQty, 500), // Hard cap for retail sanity
      riskRating: 'LOW',
      firewallCode: 'SYSTEM_OK'
    };
  }
}