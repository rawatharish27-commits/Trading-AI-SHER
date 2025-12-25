
import { RiskAudit, PositionSizeParams, RiskConfig } from '../../types';
import { pnlService } from '../services/pnlService';

/**
 * 🛡️ SHER RISK GOVERNOR V4
 * Core Responsibility: The Capital Firewall.
 * Institutional Rule: Risk Engine can VETO the AI.
 */
export class RiskGovernorV4 {
  private static readonly CONFIG: RiskConfig = {
    maxCapitalPerTrade: 50000,
    maxDailyLoss: 5000,
    maxOpenPositions: 10,
    stopLossDefault: 2.0,
    trailingSLEnabled: true,
    killSwitchActive: false
  };

  /**
   * Evaluates if a trade is safe to dispatch.
   */
  static async audit(params: PositionSizeParams): Promise<RiskAudit> {
    const sessionPnl = pnlService.snapshot();
    
    // 1. Daily Drawdown Guard
    if (sessionPnl.net <= -this.CONFIG.maxDailyLoss) {
      return {
        allowed: false,
        reason: 'NUCLEAR_HALT: Daily loss limit exceeded.',
        suggestedQty: 0,
        riskRating: 'CRITICAL',
        firewallCode: 'MAX_DD_HIT'
      };
    }

    // 2. Intelligence Confidence Gate
    if (params.probability < 0.75) {
      return {
        allowed: false,
        reason: 'CONFIDENCE_VETO: Signal probability below institutional floor (75%).',
        suggestedQty: 0,
        riskRating: 'MEDIUM',
        firewallCode: 'PROB_LOW'
      };
    }

    // 3. Dynamic Kelly Position Sizing
    // Formula: f* = (bp - q) / b where b=Reward/Risk
    const p = params.probability;
    const q = 1 - p;
    const b = 2; // Assuming 1:2 standard R/R for sizing
    const kellyF = (b * p - q) / b;
    
    // Fractional Kelly (20% for institutional safety)
    const riskMultiplier = Math.max(0.2, kellyF * 0.2); 
    
    // Regime Penalty
    let regimeFactor = 1.0;
    if (params.regime === 'PANIC') regimeFactor = 0.5;
    if (params.regime === 'CHOPPY') regimeFactor = 0.7;

    const riskAmt = params.capital * riskMultiplier * regimeFactor;
    const slPoints = Math.abs(params.price - params.stopLossPrice);
    
    const suggestedQty = slPoints > 0 ? Math.floor(riskAmt / slPoints) : 0;

    return {
      allowed: suggestedQty > 0,
      reason: suggestedQty > 0 ? 'RISK_ADJUSTED_APPROVAL' : 'INVALID_GEOMETRY',
      suggestedQty: Math.min(suggestedQty, 1000), // Hard cap per node
      riskRating: suggestedQty > 0 ? 'LOW' : 'CRITICAL',
      firewallCode: 'FIREWALL_OK'
    };
  }

  static isTradingAllowed(): boolean {
    const pnl = pnlService.snapshot();
    return pnl.net > -this.CONFIG.maxDailyLoss && !this.CONFIG.killSwitchActive;
  }
}
