import { prisma } from '../prisma';

/**
 * 🧑‍💼 ADMIN BILLING AUDITOR
 * Goal: MRR Visibility & Settlement Oversight.
 */
export class AdminBillingService {
  static async getFiscalSnapshot() {
    const transactions = (prisma as any).memoryDB.transactions;
    const totalRevenue = transactions.reduce((s: number, t: any) => s + t.amount, 0);
    
    return {
      totalRevenue,
      transactionCount: transactions.length,
      mrr: totalRevenue * 0.8, // Simplified institutional calc
      lastSettlement: new Date().toISOString()
    };
  }

  static async listAllSettlements() {
    return (prisma as any).memoryDB.transactions.sort((a: any, b: any) => b.createdAt - a.createdAt);
  }
}
