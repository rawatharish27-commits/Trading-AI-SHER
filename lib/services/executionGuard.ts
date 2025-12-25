
import { retry } from "../utils";
import { prisma } from "../prisma";

/**
 * 🛡️ EXECUTION FIREWALL (Runbook Step 5)
 * Logic: Triple-Attempt Dispatch -> Catch-Log -> Fail-Audit
 */
export class ExecutionGuard {
  static async executeSafely<T>(fn: () => Promise<T>, metadata: any = {}): Promise<T> {
    const MAX_RETRIES = 3;
    let lastErr: any;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        console.log(`🦁 [ExecGuard] Dispatching Shard... Attempt ${i + 1}`);
        return await fn();
      } catch (err: any) {
        lastErr = err;
        console.warn(`🦁 [ExecGuard] Attempt ${i + 1} Friction: ${err.message}`);
        
        if (i < MAX_RETRIES - 1) {
          // Exponential backoff
          const delay = 500 * (i + 1);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    // Persistent audit log for institutional review if all retries fail
    await prisma.failedOrder.create({
      data: {
        error: lastErr.message,
        metadata: JSON.stringify(metadata),
        timestamp: new Date()
      }
    });
    
    console.error(`%c 🛡️ [ExecutionGuard] Critical Halt after ${MAX_RETRIES} attempts.`, "color: #ef4444; font-weight: bold;");
    throw lastErr;
  }
}
