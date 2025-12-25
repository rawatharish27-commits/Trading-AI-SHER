import { prisma } from '../prisma';

/**
 * 📜 TRADE AUDIT SERVICE
 * Goal: Regulatory compliance ledger (SEBI/MIFID II ready).
 */
export class TradeAuditService {
  static async log(data: {
    userId: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    pnl: number;
    strategy: string;
    reason: string;
  }) {
    return await prisma.tradeAudit.create({
      data: {
        ...data,
        createdAt: new Date()
      }
    });
  }

  static async getDailyAudit(userId: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return await prisma.tradeAudit.findMany({
      where: {
        userId,
        createdAt: { gte: start, lte: end }
      }
    });
  }
}
