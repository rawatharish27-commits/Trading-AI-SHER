
import { Plan, LicenseInfo } from '../../types';

export class SaasService {
  private static readonly LICENSE_KEY = 'sher_license_node';

  static getLicense(): LicenseInfo {
    const saved = localStorage.getItem(this.LICENSE_KEY);
    if (saved) return JSON.parse(saved);

    // Initial Trial Setup
    return {
      userId: 'u-initial',
      plan: Plan.FREE,
      expiryDate: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
      status: 'ACTIVE',
      deviceBindingId: this.generateDeviceId()
    };
  }

  static upgradePlan(plan: Plan) {
    const current = this.getLicense();
    const updated = { ...current, plan };
    localStorage.setItem(this.LICENSE_KEY, JSON.stringify(updated));
    console.debug(`[SaaS] Node upgraded to ${plan} tier.`);
  }

  private static generateDeviceId(): string {
    return 'dev-' + Math.random().toString(36).substr(2, 16);
  }
}
