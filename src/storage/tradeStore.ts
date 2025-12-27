import { prisma } from "./client";

export async function storeTrade(signal: any, tenantId: string) {
  return prisma.tradeSignal.create({
    data: {
      tenantId,
      symbol: signal.symbol,
      probability: signal.probability,
      confidence: signal.confidence,
      evidence: signal.evidenceList
    }
  });
}
