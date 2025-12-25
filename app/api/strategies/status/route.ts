
import { NextRequest, NextResponse } from "next/server";
import { tradeJournal } from "../../../lib/services/tradeJournal";
import { strategyManager } from "../../../lib/services/strategyManager";

export async function GET() {
  const trades = tradeJournal.getTrades();
  const performance = strategyManager.evaluatePerformance(trades);
  return NextResponse.json(performance);
}
