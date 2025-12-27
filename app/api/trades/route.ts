
import { NextRequest, NextResponse } from "next/server";
import { getTradeHistory } from "@/lib/services/tradeJournal";

export async function GET(req: NextRequest) {
  const trades = await getTradeHistory();
  return NextResponse.json(trades);
}
