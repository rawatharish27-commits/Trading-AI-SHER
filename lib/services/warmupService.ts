
import { scripMasterService } from "./scripMasterService";
import { brokerConfigService } from "./brokerConfigService";
import { connectBroker } from "../../services/brokerService";
import { ComplianceService } from "./complianceService";

/**
 * 🦁 SHER WARMUP NODE
 * Logic: Schedule -> Sync -> Auth -> Ready
 */
class WarmupService {
  private lastWarmup: string | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      // Background check every 15 minutes
      setInterval(() => this.checkSchedule(), 15 * 60000);
    }
  }

  /**
   * Checks if it's the pre-market window (08:45 - 09:15 AM IST)
   */
  async checkSchedule() {
    const now = new Date();
    const istTime = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).format(now);

    const [hour, minute] = istTime.split(':').map(Number);
    const todayStr = now.toISOString().split('T')[0];

    // Trigger window: 08:45 AM IST
    if (hour === 8 && minute >= 45 && this.lastWarmup !== todayStr) {
      console.log("🦁 [WarmupNode] Market Open sequence initiated...");
      await this.runWarmup(todayStr);
    }
  }

  async runWarmup(dateTag: string) {
    try {
      // 1. Force ScripMaster Refresh
      await scripMasterService.sync();
      
      // 2. Broker Session Warmup (if configured)
      const config = brokerConfigService.getConfig();
      if (config.apiKey && config.clientId) {
        console.log("🦁 [WarmupNode] Attempting institutional handshake...");
        await connectBroker(config);
      }

      this.lastWarmup = dateTag;
      ComplianceService.log('SYSTEM', 'WARMUP_SUCCESS', { date: dateTag }, 'INFO');
      console.log("🦁 [WarmupNode] Pre-market sync completed. All shards active.");
    } catch (e: any) {
      ComplianceService.log('SYSTEM', 'WARMUP_FAILED', { error: e.message }, 'WARN');
    }
  }

  getStatus() {
    return {
      lastWarmup: this.lastWarmup,
      status: this.lastWarmup === new Date().toISOString().split('T')[0] ? 'WARM' : 'COLD'
    };
  }
}

export const warmupService = new WarmupService();
