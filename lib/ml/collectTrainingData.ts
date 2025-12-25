import { prisma } from '../prisma';

/**
 * 🧾 NEURAL DATA COLLECTOR
 * Goal: Prepare sharded dataset for Logistic Regression Retraining.
 */
export class CollectTrainingData {
  static async execute() {
    const audits = await prisma.tradeAudit.findMany();
    
    return audits.map((t: any) => {
      // Logic: Extract features from reasoning string or separate JSON column
      // For this implementation, we assume metadata is stored in TradeAudit
      return {
        features: [
            t.metadata?.rsi || 0.5,
            t.metadata?.volume || 0.5,
            t.metadata?.momentum || 0.5,
            t.metadata?.depth || 0.5,
            t.metadata?.volatility || 0.5
        ],
        label: t.pnl > 0 ? 1 : 0 // 1 = Alpha Hit, 0 = Alpha Decay
      };
    });
  }
}
