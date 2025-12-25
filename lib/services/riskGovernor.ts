
import { AISignal, RiskConfig } from "../../types";
import { pnlService } from "./pnlService";

/**
 * 🛡️ SHER RISK GOVERNOR (Institutional Node)
 * Logic: Monitor -> Validate -> Scale -> Halt
 */
class RiskGovernor {
  private config: RiskConfig = {
    maxCapitalPerTrade: 50000,
    maxDailyLoss: 5000,
    maxOpenPositions: 5,
    stopLossDefault: 1.5,
    trailingSLEnabled: true,
    // Runbook Step 6: Hard Stop via ENV
    killSwitchActive: process.env.KILL_SWITCH === 'ON'
  };

  private symbolExposure: Map<string, number> = new Map();

  async validateOrder(signal: AISignal, capital: number): Promise<{ allowed: boolean; reason?: string; scaledQty: number }> {
    // 1. Check Global Kill-Switch (ENV or Runtime)
    if (this.config.killSwitchActive || process.env.KILL_SWITCH === 'ON') {
      return { allowed: false, reason: "KILL_SWITCH_ACTIVE", scaledQty: 0 };
    }

    // 2. Check Daily PnL Breach
    const sessionPnl = pnlService.snapshot().net;
    if (sessionPnl <= -this.config.maxDailyLoss) {
      this.activateKillSwitch("MAX_DAILY_LOSS_BREACHED");
      return { allowed: false, reason: "HALT: Daily loss limit exceeded.", scaledQty: 0 };
    }

    // 3. AI Confidence Decay Scaling
    let scaleFactor = 1.0;
    if (signal.probability < 0.85) return { allowed: false, reason: "PROBABILITY_DECAY", scaledQty: 0 };
    if (signal.probability < 0.92) scaleFactor = 0.5;

    const baseQty = Math.floor(this.config.maxCapitalPerTrade / signal.targets.entry);
    const finalQty = Math.floor(baseQty * scaleFactor);

    if (finalQty <= 0) return { allowed: false, reason: "INVALID_QTY", scaledQty: 0 };

    return { allowed: true, scaledQty: finalQty };
  }

  activateKillSwitch(reason: string) {
    this.config.killSwitchActive = true;
    console.error(`%c ☢️ [KillSwitch] TRIGGERED: ${reason}`, "color: #ef4444; font-weight: bold; font-size: 16px;");
  }

  reset() {
    this.config.killSwitchActive = false;
  }

  isHalted() {
    return this.config.killSwitchActive || process.env.KILL_SWITCH === 'ON';
  }
}

export const riskGovernor = new RiskGovernor();
