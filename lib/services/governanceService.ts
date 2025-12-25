
export interface SystemServices {
  neuralDiscovery: boolean;
  brokerBridge: boolean;
  riskGuardrails: boolean;
  automatedExecution: boolean;
  backtestingEngine: boolean;
  multiAccountSharding: boolean;
  geneticEvolution: boolean;
  smartApiNode: boolean;
  orderReconciliation: boolean; // 🔄 New Sync Node
}

class GovernanceService {
  private services: SystemServices = {
    neuralDiscovery: true,
    brokerBridge: true,
    riskGuardrails: true,
    automatedExecution: false,
    backtestingEngine: true,
    multiAccountSharding: true,
    geneticEvolution: true,
    smartApiNode: true,
    orderReconciliation: true,
  };

  getServices(): SystemServices {
    if (typeof window === 'undefined') return this.services;
    const saved = localStorage.getItem('sher_system_governance_v4');
    return saved ? JSON.parse(saved) : this.services;
  }

  updateService(key: keyof SystemServices, enabled: boolean) {
    const current = this.getServices();
    const updated = { ...current, [key]: enabled };
    if (typeof window !== 'undefined') {
      localStorage.setItem('sher_system_governance_v4', JSON.stringify(updated));
    }
    window.dispatchEvent(new CustomEvent('sher-system-update', { detail: { service: key, status: enabled } }));
  }

  isServiceActive(key: keyof SystemServices): boolean {
    return this.getServices()[key];
  }
}

export const governanceService = new GovernanceService();
