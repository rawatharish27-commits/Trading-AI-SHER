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
  return prisma.signal.create({
    data: {
      id: entry.signalId,
      symbol: entry.symbol,
      action: entry.action,
      probability: entry.probability,
      confidence: parseFloat(entry.confidence),
      reasoning: JSON.stringify({
        evidence: entry.evidence,
        strategy: entry.strategy,
        marketRegime: entry.marketRegime,
        entryPrice: entry.entryPrice,
        targetPrice: entry.targetPrice,
        stopLoss: entry.stopLoss
      }),
      strategy: entry.strategy,
      targets: JSON.stringify({
        entry: entry.entryPrice,
        sl: entry.stopLoss,
        t1: entry.targetPrice
      }),
      userId: 'default-user' // TODO: Use actual user ID
    }
  });
}

export async function updateTradeOutcome(signalId: string, outcome: 'WIN' | 'LOSS', pnl: number) {
  // Note: Signal model doesn't have outcome/pnl fields in the schema
  // This would need to be updated in the schema or stored in reasoning
  const signal = await prisma.signal.findUnique({ where: { id: signalId } });
  if (!signal) throw new Error('Signal not found');

  const reasoning = JSON.parse(signal.reasoning || '{}');
  reasoning.outcome = outcome;
  reasoning.pnl = pnl;

  return prisma.signal.update({
    where: { id: signalId },
    data: {
      reasoning: JSON.stringify(reasoning)
    }
  });
}

export async function getTradeHistory(limit: number = 100) {
  const signals = await prisma.signal.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Transform Signal to match Trade interface
  return signals.map(signal => {
    const reasoning = JSON.parse(signal.reasoning || '{}');
    return {
      id: signal.id,
      symbol: signal.symbol,
      side: signal.action,
      entryPrice: reasoning.entryPrice || 0,
      exitPrice: null,
      pnl: reasoning.pnl || 0,
      strategy: signal.strategy,
      entryTime: signal.createdAt,
      exitTime: null,
      status: reasoning.outcome === 'WIN' || reasoning.outcome === 'LOSS' ? 'CLOSED' : 'OPEN'
    };
  });
}

export async function getWinLossRatio(symbol?: string) {
  const signals = await prisma.signal.findMany({
    where: symbol ? { symbol } : undefined,
    take: 1000,
    orderBy: { createdAt: 'desc' }
  });

  let wins = 0;
  let losses = 0;

  signals.forEach(signal => {
    const reasoning = JSON.parse(signal.reasoning || '{}');
    if (reasoning.outcome === 'WIN') wins++;
    if (reasoning.outcome === 'LOSS') losses++;
  });

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
  getTrades: getTradeHistory, // Alias for backward compatibility
  getWinLossRatio
};
