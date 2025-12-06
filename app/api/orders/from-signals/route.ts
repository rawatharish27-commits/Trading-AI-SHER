
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // 1. Auth Check
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { portfolioId, signalIds, mode } = body;
    const userId = (session.user as any).id;

    if (!portfolioId || !signalIds || !Array.isArray(signalIds)) {
      return NextResponse.json({ error: "Invalid payload: portfolioId and signalIds array required" }, { status: 400 });
    }

    const tradeMode = mode === 'LIVE' ? 'LIVE' : 'PAPER';

    // 2. Fetch User Risk Settings
    let riskSettings = await prisma.riskSettings.findUnique({
      where: { userId }
    });

    if (!riskSettings) {
       // Defaults if not set
       riskSettings = await prisma.riskSettings.create({
         data: {
            userId,
            maxOpenPositions: 10,
            allowShortSelling: false,
            autoTradeEnabled: false,
            maxRiskPerTradePct: 1,
            maxDailyLossPct: 5,
            maxCapitalPerTradePct: 20
         }
       });
    }

    // 3. Global Risk Checks
    if (tradeMode === 'LIVE' && !riskSettings.autoTradeEnabled) {
      return NextResponse.json({ error: "Live trading is disabled in your Risk Settings." }, { status: 403 });
    }

    // Check Max Open Positions
    const openPositionsCount = await prisma.position.count({
      where: {
        portfolioId: portfolioId,
        isClosed: false
      }
    });

    if (riskSettings.maxOpenPositions && openPositionsCount >= riskSettings.maxOpenPositions) {
       return NextResponse.json({ error: `Risk Block: Max open positions limit (${riskSettings.maxOpenPositions}) reached.` }, { status: 400 });
    }

    // 4. Fetch Signals Details
    const signals = await prisma.aiSignal.findMany({
      where: {
        id: { in: signalIds.map(String) }, 
      },
      include: {
        instrument: true
      }
    });

    if (signals.length === 0) {
        return NextResponse.json({ error: "No valid signals found." }, { status: 404 });
    }

    const results = [];

    // 5. Execution Loop (Transactional per order to ensure data integrity)
    for (const signal of signals) {
        let side = 'BUY';
        if (signal.action === 'SELL' || signal.action === 'EXIT') side = 'SELL';
        
        // Basic quantity for V1
        const quantity = 10; 

        // Execute Transaction
        const orderResult = await prisma.$transaction(async (tx: any) => {
            
            // Create the Order record
            const order = await tx.order.create({
                data: {
                    userId,
                    portfolioId,
                    instrumentId: signal.instrumentId,
                    aiSignalId: signal.id,
                    side,
                    orderType: 'MARKET',
                    quantity,
                    status: tradeMode === 'PAPER' ? 'FILLED' : 'PENDING',
                    mode: tradeMode,
                    placedAt: new Date()
                }
            });

            // --- PAPER TRADING SIMULATION ---
            if (tradeMode === 'PAPER') {
                // Determine Execution Price (Live -> Candle -> Default)
                let executionPrice = 0;
                const livePrice = await tx.livePrice.findUnique({ where: { instrumentId: signal.instrumentId }});
                
                if (livePrice) {
                    executionPrice = livePrice.lastPrice;
                } else {
                    const candle = await tx.candlePrice.findFirst({
                        where: { instrumentId: signal.instrumentId },
                        orderBy: { timestamp: 'desc' }
                    });
                    executionPrice = candle ? candle.close : 100.00;
                }

                // Create Trade Record
                await tx.trade.create({
                    data: {
                        userId,
                        portfolioId,
                        instrumentId: signal.instrumentId,
                        orderId: order.id,
                        side,
                        quantity,
                        price: executionPrice,
                        fees: 0,
                        realizedPnl: 0,
                        tradeTime: new Date()
                    }
                });

                // Update Portfolio Position
                const existingPosition = await tx.position.findFirst({
                    where: {
                        portfolioId,
                        instrumentId: signal.instrumentId,
                        isClosed: false
                    }
                });

                if (side === 'BUY') {
                    if (existingPosition) {
                        // Average Up/Down
                        const newQty = existingPosition.quantity + quantity;
                        const totalCost = (existingPosition.avgPrice * existingPosition.quantity) + (executionPrice * quantity);
                        const newAvg = totalCost / newQty;

                        await tx.position.update({
                            where: { id: existingPosition.id },
                            data: { quantity: newQty, avgPrice: newAvg }
                        });
                    } else {
                        // Open New Position
                        await tx.position.create({
                            data: {
                                portfolioId,
                                instrumentId: signal.instrumentId,
                                side: 'LONG',
                                quantity,
                                avgPrice: executionPrice,
                                openedAt: new Date(),
                                isClosed: false
                            }
                        });
                    }
                } else if (side === 'SELL') {
                    if (existingPosition) {
                        const newQty = existingPosition.quantity - quantity;
                        
                        if (newQty <= 0) {
                             // Close Position
                             const pnl = (executionPrice - existingPosition.avgPrice) * existingPosition.quantity;
                             await tx.position.update({
                                where: { id: existingPosition.id },
                                data: { quantity: 0, isClosed: true, closedAt: new Date() }
                            });
                        } else {
                            // Partial Sell
                            await tx.position.update({
                                where: { id: existingPosition.id },
                                data: { quantity: newQty }
                            });
                        }
                    }
                }
                
                // Update Order
                await tx.order.update({
                    where: { id: order.id },
                    data: { price: executionPrice }
                });

                // Audit Log
                await tx.auditLog.create({
                    data: {
                        userId,
                        eventType: 'ORDER_PLACED',
                        message: `Paper Order Executed: ${side} ${quantity} ${signal.instrument.symbol}`,
                        details: { orderId: order.id, price: executionPrice }
                    }
                });

                return { status: 'EXECUTED', orderId: order.id, price: executionPrice, symbol: signal.instrument.symbol };
            }

            // --- LIVE TRADING ---
            await tx.auditLog.create({
                data: {
                    userId,
                    eventType: 'ORDER_PLACED',
                    message: `Live Order Queued: ${side} ${quantity} ${signal.instrument.symbol}`,
                    details: { orderId: order.id }
                }
            });

            return { status: 'PENDING', orderId: order.id, symbol: signal.instrument.symbol };
        });
        
        results.push(orderResult);
    }

    return NextResponse.json({ success: true, results });

  } catch (error: any) {
    console.error("Order Execution Error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute orders" }, { status: 500 });
  }
}
