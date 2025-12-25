
import { ReferralInfo, Plan } from '../../types';

export class ReferralService {
  /**
   * Generates a unique institutional referral code.
   */
  static generateCode(userId: string): string {
    return `SHER-${userId.slice(0, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  /**
   * Calculates affiliate commissions based on plan value (20% logic).
   */
  static calculateCommission(planValue: number): number {
    return planValue * 0.20;
  }

  /**
   * Mock fetch for user referral summary.
   */
  static async getSummary(userId: string): Promise<ReferralInfo> {
    await new Promise(r => setTimeout(r, 800));
    return {
      referrerId: userId,
      refereeCount: 2,
      totalEarnings: 199.80, // 20% of 999.00
      referralLink: `https://sher.ai/invite/${this.generateCode(userId)}`,
      unlockedPlan: Plan.FREE
    };
  }
}
