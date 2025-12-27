import { NextRequest, NextResponse } from "next/server";
import { recordTrade, getTradeHistory, getWinLossRatio } from "@/lib/services/tradeJournal";

export async function POST(req: NextRequest) {
  try {
    const trade = await req.json();
    await recordTrade(trade);

    return NextResponse.json({ success: true, message: "Trade recorded" });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
    const history = await getTradeHistory(limit);

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
