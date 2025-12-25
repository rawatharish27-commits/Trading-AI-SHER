import { prisma } from '../prisma';

/**
 * 📅 FISCAL REPORTING NODE
 * Goal: Institutional EOD Clarity.
 */
export class DailyReportService {
  static async generate(userId: string, date: Date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const trades = await prisma.tradeAudit.findMany({
      where: { userId, createdAt: { gte: start, lte: end } }
    });

    const netPnL = trades.reduce((sum: number, t: any) => sum + t.pnl, 0);

    return {
      date: start.toISOString().split('T')[0],
      tradeCount: trades.length,
      netPnL,
      pnlCurrency: 'INR',
      status: netPnL >= 0 ? 'FAVORABLE' : 'ADVERSE',
      audited: true
    };
  }
}
