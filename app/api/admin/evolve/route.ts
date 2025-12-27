import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/react";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { symbol, timeframe } = await req.json();

    // Simulated backtest logic
    const results = {
      symbol,
      timeframe,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      totalTrades: Math.floor(Math.random() * 50) + 10,
      winRate: Math.floor(Math.random() * 30) + 60,
      totalPnl: Math.floor(Math.random() * 30000) + 5000,
      sharpeRatio: (Math.random() * 2 + 1).toFixed(2),
      maxDrawdown: (Math.random() * 10 + 5).toFixed(2),
    };

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
