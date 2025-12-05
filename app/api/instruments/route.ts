
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// GET: Fetch instruments (optionally filter by exchange or query)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const exchange = searchParams.get("exchange");

    const whereClause: any = {
      active: true,
    };

    if (exchange) {
      whereClause.exchange = exchange;
    }

    if (query) {
      whereClause.OR = [
        { symbol: { contains: query.toUpperCase() } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }

    const instruments = await prisma.instrument.findMany({
      where: whereClause,
      take: 20, // Limit results for performance
      orderBy: { symbol: 'asc' }
    });

    return NextResponse.json(instruments);
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return NextResponse.json({ error: "Failed to fetch instruments" }, { status: 500 });
  }
}

// POST: Create or Update (Upsert) Instrument
// Useful for the Python ingestion script to populate the DB
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, name, exchange, segment, isin, lotSize, tickSize } = body;

    if (!symbol || !exchange) {
      return NextResponse.json({ error: "Symbol and Exchange are required" }, { status: 400 });
    }

    const instrument = await prisma.instrument.upsert({
      where: { symbol: symbol.toUpperCase() },
      update: {
        name,
        exchange,
        segment,
        isin,
        lotSize,
        tickSize,
        active: true,
        updatedAt: new Date(),
      },
      create: {
        symbol: symbol.toUpperCase(),
        name,
        exchange,
        segment: segment || 'EQ',
        isin,
        lotSize: lotSize || 1,
        tickSize: tickSize || 0.05,
        active: true,
      },
    });

    return NextResponse.json({ success: true, instrument });
  } catch (error) {
    console.error("Error storing instrument:", error);
    return NextResponse.json({ error: "Failed to store instrument" }, { status: 500 });
  }
}
