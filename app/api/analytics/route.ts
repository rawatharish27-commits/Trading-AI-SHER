
import { NextRequest, NextResponse } from "next/server";
import { tradeJournal } from "../../../lib/services/tradeJournal";
import { calculateAnalytics } from "../../../lib/services/tradeAnalytics";

export async function GET(req: NextRequest) {
  const trades = tradeJournal.getTrades();
  const analytics = calculateAnalytics(trades);
  return NextResponse.json(analytics);
}
