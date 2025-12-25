import { NextResponse } from "next/server";
import { tradeJournal } from "../../../../lib/services/tradeJournal";
import { InvestorMetrics } from "../../../../lib/services/investorMetrics";

/**
 * 📈 INVESTOR METRICS API NODE
 * Goal: Deliver Fund-Ready performance data.
 */
export async function GET() {
  try {
    const trades = tradeJournal.getTrades();
    const metrics = InvestorMetrics.getSovereignReport(trades, 250000);
    
    return NextResponse.json({
        ...metrics,
        auditTimestamp: new Date().toISOString(),
        node: "SHER-ALPHA-01",
        status: "VERIFIED"
    });
  } catch (error) {
    return NextResponse.json({ error: "Metrics Synthesis Failed" }, { status: 500 });
  }
}
