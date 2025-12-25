
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { AngelOneAdapter } from "../../../../lib/brokers/angelOneAdapter";
import { tokenStore } from "../../../../lib/services/tokenStore";

// Static mapping for demo (In prod, this is in DB)
const TOKEN_MAP: Record<string, string> = {
  'RELIANCE': '2885',
  'SBIN': '3045',
  'TCS': '11536',
  'INFY': '1594',
  'HDFCBANK': '1333',
  'NIFTY50': '99926000',
  'BANKNIFTY': '99926009',
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get("symbol")?.toUpperCase();
  const timeFrame = url.searchParams.get("timeFrame") ?? "ONE_DAY"; // Map intervals to Angel One constants
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : 60;

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    // 1. ATTEMPT REAL DATA IF BROKER IS LINKED
    if (tokenStore.isValid() && TOKEN_MAP[symbol]) {
        try {
            const adapter = new AngelOneAdapter({
              apiKey: process.env.ANGEL_ONE_API_KEY || "",
              clientCode: "", // Retrieved from storage in prod
              pin: "", 
              totp: "" 
            });

            const now = new Date();
            const past = new Date(now.getTime() - (limit * 24 * 60 * 60 * 1000)); // Dynamic range based on limit
            
            const formatDate = (d: Date) => {
                const pad = (n: number) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };

            const data = await adapter.getHistoricalCandles({
                exchange: symbol.includes('NIFTY') ? 'NSE' : 'NSE',
                symboltoken: TOKEN_MAP[symbol],
                interval: timeFrame as any,
                fromdate: formatDate(past),
                todate: formatDate(now)
            });

            if (data && Array.isArray(data)) {
                return NextResponse.json({
                    symbol,
                    timeFrame,
                    candles: data.map(c => ({
                        time: c[0],
                        open: c[1],
                        high: c[2],
                        low: c[3],
                        close: c[4],
                        volume: c[5]
                    }))
                });
            }
        } catch (brokerErr) {
            console.warn("[BrokerHistory] Fallback to simulated data:", brokerErr);
        }
    }

    // 2. PRISMA/MOCK FALLBACK
    const instrument = await prisma.instrument.findUnique({
      where: { symbol },
    });

    let candles = [];

    if (instrument) {
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
      
      candles = dbCandles.map(c => ({
        time: c.timestamp.toISOString(),
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        volume: c.volume
      })).reverse();
    }

    if (candles.length === 0) {
      let price = 2000;
      const now = new Date();
      for (let i = limit; i > 0; i--) {
        const time = new Date(now.getTime() - i * 60000); 
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
