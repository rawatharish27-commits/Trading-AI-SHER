
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { FeatureEngine } from "../../../../lib/features/featureEngine";
import { metaBrain } from "../../../../lib/services/metaBrain";
import { capitalAllocator } from "../../../../lib/services/capitalAllocator";
import { UsageTracker } from "../../../../lib/services/usageTracker";
import { Candle } from "../../../../lib/indicators";
import { AISignal, AssetClass, DecisionState } from "../../../../types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  const plan = (session.user as any).plan;

  // 🔐 QUOTA ENFORCEMENT
  const quota = await UsageTracker.canRequestSignal(userId, role, plan);
  if (!quota.allowed) {
    return NextResponse.json({ 
      error: "Daily Quota Exceeded", 
      message: `Your current ${plan} plan is limited to ${quota.limit} signals per day. Upgrade to ELITE for unlimited access.`
    }, { status: 403 });
  }

  try {
    const { symbol, capital = 1000000 } = await req.json();
    if (!symbol) return NextResponse.json({ error: "Symbol required" }, { status: 400 });

    const symbolUpper = symbol.toUpperCase();
    let candlesData: Candle[] = [];
    const instrument = await prisma.instrument.findUnique({ where: { symbol: symbolUpper } });

    if (instrument) {
      const candles = await prisma.candlePrice.findMany({
        where: { instrumentId: instrument.id, timeFrame: '1d' },
        orderBy: { timestamp: 'asc' }, take: 100
      });
      candlesData = candles.map(c => ({
          open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume
      }));
    }

    if (candlesData.length < 50) {
      let price = 1000;
      for (let i = 0; i < 100; i++) {
        price += (Math.random() - 0.48) * 10;
        candlesData.push({ open: price - 2, high: price + 5, low: price - 5, close: price, volume: 1000 + Math.random() * 500 });
      }
    }

    // 1. Feature Extraction
    const features = FeatureEngine.extract(candlesData);

    // 2. Meta-Brain Synthesis
    // Fixed: Passed candlesData as the third argument to synthesize as required by MetaBrain
    const signal = await metaBrain.synthesize(symbolUpper, features, candlesData);
    
    // 3. Capital Allocation
    const allocation = capitalAllocator.allocate(symbolUpper, signal.probability, signal.trapDetected === 'NONE' ? 'TRENDING_UP' : 'VOLATILE', signal.strategy, capital);

    // ✅ LOG USAGE AFTER SUCCESSFUL COMPUTATION
    await UsageTracker.incrementUsage(userId);

    return NextResponse.json({
        ...signal,
        allocation: allocation.amount,
        riskPerTrade: allocation.risk,
        allocationReason: allocation.reason,
        multiAccount: allocation.accounts,
        features: FeatureEngine.normalize(features),
        quotaRemaining: quota.remaining - 1
    });
  } catch (error: any) {
    console.error("Master Brain Routing Error:", error);
    return NextResponse.json({ error: "Neural core computation failed." }, { status: 500 });
  }
}
