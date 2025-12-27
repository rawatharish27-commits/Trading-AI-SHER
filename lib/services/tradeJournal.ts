// Trade Journal Service
// Records all trades for audit trail and ML training

import { prisma } from '@/lib/prisma/client';

export interface TradeJournalEntry {
  signalId: string;
  symbol: string;
  action: string;
  probability: number;
  confidence: string;
  strategy: string;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  outcome?: 'WIN' | 'LOSS' | 'PENDING';
  pnl?: number;
  duration?: number;
  marketRegime: string;
  evidence: string[];
  timestamp: string;
}

export async function recordTrade(entry: TradeJournalEntry) {
  return prisma.tradeSignal.create({
    data: {
      id: entry.signalId,
      tenantId: 'default', // TODO: Use actual tenant ID
      symbol: entry.symbol,
      probability: entry.probability,
      confidence: entry.confidence,
      evidence: JSON.stringify({
        evidence: entry.evidence,
        strategy: entry.strategy,
        marketRegime: entry.marketRegime
      }),
      outcome: entry.outcome
    }
  });
}

export async function updateTradeOutcome(signalId: string, outcome: 'WIN' | 'LOSS', pnl: number) {
  return prisma.tradeSignal.update({
    where: { id: signalId },
    data: {
      outcome,
      pnl
    }
  });
}

export async function getTradeHistory(limit: number = 100) {
  return prisma.tradeSignal.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
}

export async function getWinLossRatio(symbol?: string) {
  const trades = await prisma.tradeSignal.findMany({
    where: symbol ? { symbol } : undefined,
    where: {
      outcome: { in: ['WIN', 'LOSS'] }
    }
  });

  const wins = trades.filter(t => t.outcome === 'WIN').length;
  const losses = trades.filter(t => t.outcome === 'LOSS').length;
  const total = wins + losses;

  return {
    wins,
    losses,
    total,
    winRate: total > 0 ? (wins / total) * 100 : 0
  };
}

// Namespace export for component compatibility
export const tradeJournal = {
  recordTrade,
  updateTradeOutcome,
  getTradeHistory,
  getWinLossRatio
};
