import { prisma } from '../prisma';
import { Plan, UserRole } from '../../types';
import { SIGNAL_LIMITS } from '../plans';

export class UsageTracker {
  /**
   * Checks if a user is within their daily signal quota.
   * ADMIN role bypasses all limits.
   */
  static async canRequestSignal(userId: string, role: UserRole, plan: Plan): Promise<{ allowed: boolean; remaining: number; limit: number }> {
    if (role === UserRole.ADMIN) return { allowed: true, remaining: 999, limit: 999 };

    const limit = SIGNAL_LIMITS[plan] || 0;
    if (limit === 0) return { allowed: false, remaining: 0, limit };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usage = await prisma.signalUsage.findFirst({
      where: {
        userId,
        date: today
      }
    });

    const count = usage?.count || 0;
    return {
      allowed: count < limit,
      remaining: Math.max(0, limit - count),
      limit
    };
  }

  /**
   * Increments the signal usage count for the day.
   */
  static async incrementUsage(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.signalUsage.upsert({
      where: {
        userId_date: {
          userId,
          date: today
        }
      },
      update: { count: { increment: 1 } },
      create: { userId, date: today, count: 1 }
    });
  }
}