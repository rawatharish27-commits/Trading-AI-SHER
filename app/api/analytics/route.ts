
import { NextRequest, NextResponse } from "next/server";
import { getTradeHistory } from "@/lib/services/tradeJournal";
import { calculateAnalytics } from "@/lib/services/tradeAnalytics";

export async function GET(req: NextRequest) {
  const trades = await getTradeHistory();
  const analytics = calculateAnalytics(trades);
  return NextResponse.json(analytics);
}
