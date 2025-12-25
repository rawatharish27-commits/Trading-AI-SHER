import { Plan } from '../../types';

/**
 * 🚦 INSTITUTIONAL USAGE LIMITS
 * Hard-coded constraints for the execution pipeline.
 */
export const USAGE_LIMITS = {
  [Plan.FREE]: {
    tradesPerDay: 0,
    maxLeverage: 0,
    discoveryNodes: 2,
    advancedAnalytics: false
  },
  [Plan.PRO]: {
    tradesPerDay: 5,
    maxLeverage: 2,
    discoveryNodes: 10,
    advancedAnalytics: true
  },
  [Plan.ELITE]: {
    tradesPerDay: 999,
    maxLeverage: 10,
    discoveryNodes: 999,
    advancedAnalytics: true
  },
  [Plan.INSTITUTIONAL]: {
    tradesPerDay: 9999,
    maxLeverage: 25,
    discoveryNodes: 9999,
    advancedAnalytics: true
  }
} as const;
