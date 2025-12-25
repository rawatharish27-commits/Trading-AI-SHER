import { eventBus } from '../engine/eventBus';

/**
 * 🧱 HARD-STOP ENGINE
 * Goal: Capital survival over AI discovery.
 */
class HardStopEngine {
  private isKillEngaged = false;
  private readonly MAX_DAILY_LOSS_PCT = 0.02; // 2% Hard Stop

  constructor() {
    this.isKillEngaged = localStorage.getItem('sher_kill_active') === 'TRUE';
  }

  /**
   * ☢️ NUCLEAR HALT
   */
  engageKill(reason: string) {
    this.isKillEngaged = true;
    localStorage.setItem('sher_kill_active', 'TRUE');
    
    eventBus.emit('audit.log', { 
      level: 'CRITICAL', 
      msg: 'GLOBAL KILL SWITCH ENGAGED', 
      reason 
    }, 'HARD_STOP_ENGINE');
  }

  disengageKill() {
    this.isKillEngaged = false;
    localStorage.removeItem('sher_kill_active');
    console.info("🦁 [Risk] System Restored.");
  }

  /**
   * 📊 FISCAL FIREWALL
   */
  auditDailyPnL(currentPnL: number, totalCapital: number) {
    const lossThreshold = totalCapital * this.MAX_DAILY_LOSS_PCT;
    
    if (currentPnL <= -lossThreshold) {
      this.engageKill(`DAILY_LOSS_BREACH: Threshold ₹${lossThreshold} (2%) exceeded.`);
      return false;
    }
    return true;
  }

  isHalted(): boolean {
    return this.isKillEngaged;
  }
}

export const hardStopEngine = new HardStopEngine();