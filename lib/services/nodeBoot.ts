
import { validateEnvironment } from '../env';
import { brokerHealth } from './brokerHealth';
import { WarmupLoader } from './warmupLoader';
import { hardStopEngine } from '../risk/HardStopEngine';
import { prisma } from '../prisma';

/**
 * 🦁 SOVEREIGN BOOT ORCHESTRATOR (v4.7)
 * Goal: Ensure 100% Nodal Integrity before accepting market data.
 */
export async function initializeNode(): Promise<{ success: boolean; error?: string }> {
  console.info("🦁 [Boot] Starting Sovereign Handshake Protocol...");

  try {
    // 1. Env Shard Audit (Mandatory Check)
    if (!validateEnvironment()) return { success: false, error: "ENV_VALIDATION_FAILED" };

    // 2. Database Connectivity Shard
    try {
      // Direct ping to verify SQL persistence node
      await prisma.$executeRaw`SELECT 1`;
      console.log("🦁 [Boot] Database Shard: CONNECTED");
    } catch (e) {
      console.error("🦁 [Boot] DB Connection failure:", e);
      return { success: false, error: "PERSISTENCE_DB_UNREACHABLE" };
    }

    // 3. Broker Gateway Handshake
    const health = await brokerHealth.checkHealth();
    if (health.gateway === 'DISCONNECTED' && process.env.MARKET_MODE === 'LIVE') {
       console.error("🦁 [Boot] Live Mode requires active Broker Gateway.");
       return { success: false, error: "BROKER_GATEWAY_DISCONNECTED" };
    }

    // 4. Logic Shard Warmup (Indicator Buffers)
    await WarmupLoader.execute();

    // 5. Risk Shard Final Audit
    if (hardStopEngine.isHalted()) {
       console.warn("🦁 [Boot] Node initialized in LOCKED state due to Risk Firewall.");
    }

    console.log("%c 🦁 [Boot] Handshake Complete. Sovereign Node Stable.", "color: #10b981; font-weight: bold;");
    return { success: true };
  } catch (e: any) {
    console.error("🦁 [Boot] Critical Failure:", e.message);
    return { success: false, error: e.message || "BOOT_CRASH" };
  }
}
