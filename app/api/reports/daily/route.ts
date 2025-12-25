
import { NextRequest, NextResponse } from "next/server";
import { tradeJournal } from "../../../../lib/services/tradeJournal";
import { equityService } from "../../../../lib/services/equityService";
import { reportService } from "../../../../lib/services/reportService";

export async function GET() {
  const trades = tradeJournal.getTrades();
  const equity = equityService.snapshot();
  
  // Generating a small history for the demo
  const history = [];
  const now = new Date();
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const rep = reportService.generateDaily(trades, equity);
    rep.date = d.toISOString().split('T')[0];
    rep.netPnL = Math.floor((Math.random() - 0.4) * 15000);
    history.push(rep);
  }

  return NextResponse.json(history);
}
