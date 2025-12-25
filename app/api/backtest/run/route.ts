
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { BacktestRunner } from "../../../../engine/backtest/runner";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { symbol, strategyCode, initialCapital = 100000 } = await req.json();

    // 1. Fetch Historical Data (Simulated or Real)
    // For Sandbox: generating robust mock data if DB is empty
    let candles = [];
    const instrument = await prisma.instrument.findUnique({ where: { symbol: symbol.toUpperCase() } });
    
    if (instrument) {
        const dbCandles = await prisma.candlePrice.findMany({
            where: { instrumentId: instrument.id },
            orderBy: { timestamp: 'asc' },
            take: 500
        });
        candles = dbCandles.map(c => ({ open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume }));
    }

    if (candles.length < 100) {
        let price = 2500;
        for (let i = 0; i < 300; i++) {
            price += (Math.random() - 0.49) * 15;
            candles.push({ open: price-2, high: price+5, low: price-5, close: price, volume: 1000 });
        }
    }

    // 2. Run Engine Simulation
    const result = BacktestRunner.run(candles, strategyCode, initialCapital);

    return NextResponse.json({
        equity_curve: result.equityCurve,
        stats: {
            total_return_pct: result.stats.totalReturnPct,
            max_drawdown_pct: result.stats.maxDrawdown,
            win_rate: result.stats.winRate,
            num_trades: result.stats.tradeCount,
            profit_factor: result.stats.profitFactor,
            sharpe: result.stats.sharpeRatio,
            expectancy: result.stats.expectancy
        },
        trades: result.trades
    });
  } catch (error: any) {
    console.error("Backtest Runner Error:", error);
    return NextResponse.json({ error: "Simulation Logic Failure" }, { status: 500 });
  }
}
