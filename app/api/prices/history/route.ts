
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol");
  const timeFrame = url.searchParams.get("timeFrame") ?? "1d";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 60;

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    const instrument = await prisma.instrument.findUnique({
      where: { symbol },
    });

    let candles = [];

    if (instrument) {
      // Fetch from DB
      const dbCandles = await prisma.candlePrice.findMany({
        where: {
          instrumentId: instrument.id,
          timeFrame,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
      });
      
      // Transform to standardized response
      candles = dbCandles.map(c => ({
        time: c.timestamp.toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      })).reverse();
    }

    // Fallback Mock Data if empty
    if (candles.length === 0) {
      let price = 2000;
      const now = new Date();
      for (let i = limit; i > 0; i--) {
        const time = new Date(now.getTime() - i * 60000); // 1 min intervals for demo
        price = price + (Math.random() - 0.5) * 10;
        candles.push({
          time: time.toISOString(),
          open: price,
          high: price + 5,
          low: price - 5,
          close: price + (Math.random() - 0.5) * 2,
          volume: Math.floor(Math.random() * 1000)
        });
      }
    }

    return NextResponse.json({
      symbol,
      timeFrame,
      candles: candles,
    });

  } catch (error) {
    console.error("History API Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
