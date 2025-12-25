import { RISK_CONFIG } from '../../config/riskConfig';
import { ComplianceService } from '../complianceService';
import { PersistenceService } from '../persistenceService';

/**
 * 🧠 SHER RISK CORE (PHASE 10)
 * Persistence-enabled Capital Tracking and Risk Validation.
 */
export class RiskCore {
  private static readonly STATE_KEY = "GLOBAL_RISK_SHARD";

  /**
   * 🧮 PERSISTENT CAPITAL TRACKER
   */
  static async initCapital(balance: number) {
    const state = {
      startingBalance: balance,
      currentBalance: balance,
      dayPnL: 0,
      drawdownPercent: 0,
      tradesToday: 0,
      lastLossAt: null,
      isHalted: false
    };
    await PersistenceService.set(this.STATE_KEY, state);
  }

  static async recordTrade(pnl: number) {
    const state = await PersistenceService.get(this.STATE_KEY);
    if (!state) return;

    state.currentBalance += pnl;
    state.dayPnL += pnl;
    state.tradesToday += 1;

    const dd = ((state.startingBalance - state.currentBalance) / state.startingBalance) * 100;
    state.drawdownPercent = Math.max(0, dd);

    if (pnl < 0) {
      state.lastLossAt = new Date().toISOString();
    }

    // Auto-Halt if daily limit breached
    if (state.drawdownPercent >= RISK_CONFIG.MAX_DRAWDOWN_PERCENT) {
      state.isHalted = true;
      ComplianceService.log('SYSTEM', 'AUTO_HALT_BREACH', { dd: state.drawdownPercent }, 'CRITICAL');
    }

    await PersistenceService.set(this.STATE_KEY, state);
  }

  /**
   * 🚦 PERSISTENT RISK VALIDATOR (PRE-TRADE)
   */
  static async validateTrade(): Promise<{ allowed: boolean; reason?: string }> {
    const s = await PersistenceService.get(this.STATE_KEY);
    if (!s) return { allowed: true }; // Neutral start

    if (s.isHalted) return { allowed: false, reason: "GLOBAL_KILL_SWITCH_ACTIVE" };

    const dailyLossLimit = (RISK_CONFIG.MAX_DAILY_LOSS_PERCENT / 100) * s.startingBalance;

    if (s.tradesToday >= RISK_CONFIG.MAX_TRADES_PER_DAY) {
      return { allowed: false, reason: "MAX_TRADES_LIMIT_REACHED" };
    }

    if (Math.abs(s.dayPnL) > dailyLossLimit && s.dayPnL < 0) {
      return { allowed: false, reason: "DAILY_LOSS_LIMIT_BREACHED" };
    }

    if (s.lastLossAt) {
      const diffMs = Date.now() - new Date(s.lastLossAt).getTime();
      const cooldownMs = RISK_CONFIG.COOLDOWN_MINUTES * 60 * 1000;
      if (diffMs < cooldownMs) {
        return { allowed: false, reason: `LOSS_COOLDOWN: ${Math.ceil((cooldownMs - diffMs) / 60000)}m left.` };
      }
    }

    return { allowed: true };
  }

  static async enableKillSwitch(reason: string) {
    const s = await PersistenceService.get(this.STATE_KEY);
    if (s) {
        s.isHalted = true;
        await PersistenceService.set(this.STATE_KEY, s);
    }
    console.error(`%c ☢️ [NuclearHalt] Persistent Engage: ${reason}`, "color: #ef4444; font-weight: bold;");
  }

  static async disableKillSwitch() {
    const s = await PersistenceService.get(this.STATE_KEY);
    if (s) {
        s.isHalted = false;
        await PersistenceService.set(this.STATE_KEY, s);
    }
  }

  static async getState() {
    return await PersistenceService.get(this.STATE_KEY) || { drawdownPercent: 0, tradesToday: 0, isHalted: false };
  }
}
