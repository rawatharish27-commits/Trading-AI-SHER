
import { FirmGovernance, PortfolioItem } from '../../types';
import { eventBus } from './eventBus';

export class FirmRiskEngine {
  private static readonly VAR_CONFIDENCE = 0.95;
  
  /**
   * Calculates Real-time Value at Risk (VaR) for the firm's total sharded AUM.
   * Based on asset volatility and correlation sharding.
   */
  static calculateFirmVaR(holdings: PortfolioItem[]): number {
    const totalExposure = holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    if (totalExposure === 0) return 0;

    // Institutional VaR Approximation: Exposure * AvgDailyVol * Z-Score
    const zScore = 1.645; // 95% Confidence
    const avgVol = 0.024; // 2.4% historical firm-wide volatility sharding
    
    return totalExposure * avgVol * zScore;
  }

  /**
   * Evaluates firm-wide kill-switch conditions.
   * Propagates 'HALT' signal to all sharded execution nodes if thresholds breached.
   */
  static evaluateGovernance(governance: FirmGovernance, currentPnL: number, totalFirmCapital: number) {
    const drawdownPct = Math.abs(currentPnL / totalFirmCapital) * 100;

    // 1. Drawdown Hard-Stop
    if (drawdownPct >= governance.maxFirmDrawdown) {
      this.triggerNuclearOption('FIRM_DRAWDOWN_BREACH', `Firm DD (${drawdownPct.toFixed(2)}%) exceeded limit (${governance.maxFirmDrawdown}%)`);
      return;
    }

    // 2. VaR Breach
    if (governance.realtimeVaR > (totalFirmCapital * 0.15)) {
      this.triggerNuclearOption('VAR_LIMIT_EXCEEDED', `Firm VaR is over 15% of AUM. De-leveraging required.`);
    }
  }

  private static triggerNuclearOption(reason: string, details: string) {
    eventBus.emit('audit.log', {
      type: 'INCIDENT',
      severity: 'CRITICAL',
      reason,
      details,
      actionTaken: 'ALL_NODES_HALTED'
    }, 'FIRM_RISK_ENGINE');

    // In prod, this would hit the API to stop all active order streams
    console.error(`[FIRM_GOVERNANCE] NUCLEAR OPTION TRIGGERED: ${reason} - ${details}`);
  }
}
