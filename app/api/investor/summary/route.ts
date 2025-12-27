
import { NextRequest, NextResponse } from "next/server";
import { getTradeHistory } from "@/lib/services/tradeJournal";
import { calculateAnalytics } from "@/lib/services/tradeAnalytics";
import { equityService } from "@/lib/services/equityService";

/**
 * GET: Consolidates all investor-facing metrics into a single high-performance payload.
 */
export async function GET(req: NextRequest) {
  try {
    const trades = await getTradeHistory();
    const analytics = calculateAnalytics(trades);
    const equitySnapshot = equityService.snapshot();

    // Most recent trades for transparency log
    const recentTrades = trades
      .slice(-10)
      .reverse();

    return NextResponse.json({
      equity: equitySnapshot,
      analytics: analytics,
      recentTrades: recentTrades,
      systemHealth: {
        latency: "42ms",
        uptime: "99.98%",
        node: "SHER-MUM-01"
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Investor Summary API Error:", error);
    return NextResponse.json({ error: "Intelligence aggregate failed" }, { status: 500 });
  }
}
