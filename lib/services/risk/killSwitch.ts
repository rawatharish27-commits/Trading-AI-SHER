import { eventBus } from '../../engine/eventBus';

class KillSwitchService {
  private isEngaged = false;
  private dailyLossThreshold = 5000; // Hard-coded institutional limit

  /**
   * ☢️ NUCLEAR HALT PROTOCOL
   * Instantly disables all execution pathways.
   */
  engage(reason: string) {
    this.isEngaged = true;
    localStorage.setItem('sher_kill_switch', 'ACTIVE');
    
    eventBus.emit('audit.log', { 
      level: 'CRITICAL', 
      msg: 'NUCLEAR HALT ENGAGED', 
      reason 
    }, 'KILL_SWITCH');
    
    console.error(`%c ☢️ [KillSwitch] Disengaged: ${reason}`, "color: #ff4b4b; font-weight: 900;");
  }

  disengage() {
    this.isEngaged = false;
    localStorage.removeItem('sher_kill_switch');
    console.info("🦁 [KillSwitch] System Restored.");
  }

  isActive(): boolean {
    const stored = localStorage.getItem('sher_kill_switch');
    return this.isEngaged || stored === 'ACTIVE';
  }

  /**
   * Daily Loss Firewall
   */
  auditLoss(currentPnL: number) {
    if (currentPnL <= -this.dailyLossThreshold) {
      this.engage(`DAILY_LOSS_BREACH: Threshold ₹${this.dailyLossThreshold} exceeded.`);
    }
  }
}

export const killSwitch = new KillSwitchService();