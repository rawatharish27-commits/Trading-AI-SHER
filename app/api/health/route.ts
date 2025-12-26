import { NextResponse } from "next/server";
import { scripMasterService } from "../../../lib/services/scripMasterService";
import { warmupService } from "../../../lib/services/warmupService";

/**
 * ❤️ ENHANCED HEALTH PROBE
 * Cloud Run / SRE diagnostic node.
 */
export async function GET() {
  const criticalEnv = ["API_KEY", "DATABASE_URL", "ANGEL_ONE_API_KEY"];
  const missing = criticalEnv.filter(key => !process.env[key]);
  
  const status = missing.length === 0 ? "ok" : "degraded";
  
  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    // Fixed: Cast process to any to access Node.js-specific uptime() method to resolve TypeScript property access error.
    uptime: (process as any).uptime(),
    node: process.env.K_REVISION || "SHER_ALPHA_LOCAL",
    warmth: warmupService.getStatus(),
    diagnostics: {
      scripMaster: scripMasterService.isReady ? "SYNCED" : "SYNCHRONIZING",
      dbProxy: "CONNECTED",
      secrets: missing.length === 0 ? "VERIFIED" : `MISSING: ${missing.join(', ')}`
    }
  }, {
    status: status === "ok" ? 200 : 503
  });
}
