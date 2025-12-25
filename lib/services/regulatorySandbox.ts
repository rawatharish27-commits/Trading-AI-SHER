
import { SandboxStatus } from '../../types';

class RegulatorySandbox {
  private static readonly KEY = 'sher_sandbox_node';
  
  private status: SandboxStatus = {
    isActive: false,
    forcedMode: 'SIMULATION',
    auditHashChain: '0x00000000',
    regulatorBypass: false
  };

  constructor() {
    this.load();
  }

  private load() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(RegulatorySandbox.KEY);
    if (saved) this.status = JSON.parse(saved);
  }

  getStatus(): SandboxStatus {
    return this.status;
  }

  toggle(active: boolean) {
    this.status.isActive = active;
    this.status.forcedMode = active ? 'SIMULATION' : 'PAPER';
    this.save();
    console.warn(`🦁 [Sandbox] REGULATORY MODE: ${active ? 'ENGAGED (Execution Restricted)' : 'DISENGAGED'}`);
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(RegulatorySandbox.KEY, JSON.stringify(this.status));
    }
  }
}

export const regulatorySandbox = new RegulatorySandbox();
