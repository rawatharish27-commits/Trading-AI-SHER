
import { Plan, UserRole } from '../../types';

export class EntitlementService {
  private static readonly FEATURES: Record<string, Plan[]> = {
    'REALTIME_SIGNALS': [Plan.PRO, Plan.ELITE, Plan.INSTITUTIONAL],
    'PORTFOLIO_HEATMAP': [Plan.PRO, Plan.ELITE, Plan.INSTITUTIONAL],
    'AUTO_EXECUTION': [Plan.ELITE, Plan.INSTITUTIONAL],
    'BACKTEST_ADVANCED': [Plan.PRO, Plan.ELITE, Plan.INSTITUTIONAL],
    'WHITE_LABEL': [Plan.INSTITUTIONAL],
    'PITCH_METRICS': [Plan.ELITE, Plan.INSTITUTIONAL],
    'STRATEGY_PLUGINS': [Plan.ELITE, Plan.INSTITUTIONAL]
  };

  static canAccess(plan: Plan, role: UserRole, feature: string): boolean {
    if (role === UserRole.ADMIN) return true;
    const allowedPlans = this.FEATURES[feature];
    return allowedPlans ? allowedPlans.includes(plan) : true;
  }

  static getUsageLimit(plan: Plan, feature: string): number {
    const limits: Record<Plan, Record<string, number>> = {
      [Plan.FREE]: { 'DAILY_SIGNALS': 0, 'BACKTESTS': 5 },
      [Plan.PRO]: { 'DAILY_SIGNALS': 5, 'BACKTESTS': 50 },
      [Plan.ELITE]: { 'DAILY_SIGNALS': 999, 'BACKTESTS': 999 },
      [Plan.INSTITUTIONAL]: { 'DAILY_SIGNALS': 9999, 'BACKTESTS': 9999 }
    };
    return limits[plan]?.[feature] ?? 0;
  }
}
