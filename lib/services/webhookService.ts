import { prisma } from '../prisma';
import { Plan } from '../../types';

/**
 * 🛰️ SETTLEMENT WEBHOOK NODE
 * Handles atomic subscription activation after payment capture.
 */
export class WebhookService {
  /**
   * Processes a verified 'payment.captured' event.
   */
  static async handlePaymentCaptured(payload: { userId: string, plan: Plan, amount: number, transactionId: string }) {
    console.info(`🏛️ [Settlement] Commit Identity Upgrade: ${payload.userId} -> ${payload.plan}`);

    return await prisma.$transaction(async (tx: any) => {
      // 1. Log Fiscal Transaction
      await tx.transaction.create({
        data: {
          userId: payload.userId,
          amount: payload.amount,
          gateway: 'RAZORPAY',
          externalId: payload.transactionId,
          status: 'SUCCESS'
        }
      });

      // 2. Rotate Subscription Shard
      await tx.subscription.create({
        data: {
          userId: payload.userId,
          plan: payload.plan,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 86400000)
        }
      });

      // 3. Sync User Profile
      await tx.user.update({
        where: { id: payload.userId },
        data: { 
          plan: payload.plan,
          onboardingCompleted: true 
        }
      });

      return true;
    });
  }
}
