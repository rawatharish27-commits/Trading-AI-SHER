import { prisma } from '../prisma';
import { USAGE_LIMITS } from '../config/usageLimits';

/**
 * 📡 DASHBOARD TELEMETRY SERVICE
 * Aggregates user profile, subscription, and activity for the Command Center.
 */
export class DashboardService {
  static async getUserSnapshot(userId: string) {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId }
    });

    if (!user) throw new Error("Identity Node Not Found");

    const subscription = await (prisma as any).subscription.findFirst({
      where: { userId }
    });

    const transactions = await (prisma as any).transaction.findMany({
      where: { userId }
    });

    const recentActivity = await (prisma as any).userActivity.findMany({
      where: { userId },
      take: 5
    });

    const plan = user.plan || 'FREE';
    const limits = USAGE_LIMITS[plan as keyof typeof USAGE_LIMITS];

    return {
      profile: {
        id: user.id,
        email: user.email,
        plan: plan,
        expiry: subscription?.endDate || null
      },
      fiscal: {
        totalSpent: transactions.reduce((s: number, t: any) => s + t.amount, 0),
        history: transactions
      },
      governance: {
        limits,
        // Normalized activity dates to prevent UI crashes if createdAt is missing
        activity: recentActivity.map((a: any) => ({
          ...a,
          createdAt: a.createdAt || new Date()
        }))
      }
    };
  }
}