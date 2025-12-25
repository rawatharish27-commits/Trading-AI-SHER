import { NextResponse } from "next/server";

/**
 * 📈 SYSTEM METRICS SHARD
 * Goal: Observability for memory and process lifecycle.
 */
export async function GET() {
  // Fixed: Cast process to any to access Node.js-specific memoryUsage() method.
  const memory = (process as any).memoryUsage();
  
  return NextResponse.json({
    timestamp: Date.now(),
    // Fixed: Cast process to any to access Node.js-specific uptime() method.
    uptime: (process as any).uptime(),
    memory: {
      rss: `${Math.round(memory.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memory.external / 1024 / 1024)}MB`
    },
    // Fixed: Cast process to any to access Node.js-specific platform and version properties.
    platform: (process as any).platform,
    version: (process as any).version
  });
}
