import { Plan } from '../types';

/**
 * 🏛️ SOVEREIGN PLAN REGISTRY
 * Denominated in INR.
 */
export const PLANS_CONFIG = {
  [Plan.FREE]: { 
    amount: 0, 
    currency: 'INR',
    name: 'Alpha Access',
    durationDays: 0,
    limits: { signalsPerDay: 0 },
    gatewayIds: { razorpay: '', stripe: '' }
  },
  [Plan.PRO]: { 
    amount: 1999, 
    currency: 'INR',
    name: 'Prop Trader',
    durationDays: 30,
    limits: { signalsPerDay: 5 },
    gatewayIds: { razorpay: 'plan_pro_123', stripe: 'price_pro_123' }
  },
  [Plan.ELITE]: { 
    amount: 4999, 
    currency: 'INR',
    name: 'Master Node',
    durationDays: 30,
    limits: { signalsPerDay: 999 },
    gatewayIds: { razorpay: 'plan_elite_123', stripe: 'price_elite_123' }
  },
  [Plan.INSTITUTIONAL]: {
    amount: 25000,
    currency: 'INR',
    name: 'Institutional Node',
    durationDays: 365,
    limits: { signalsPerDay: 9999 },
    gatewayIds: { razorpay: 'plan_inst_123', stripe: 'price_inst_123' }
  }
} as const;

/**
 * Fix: Added SIGNAL_LIMITS export to resolve "Module '"../plans"' has no exported member 'SIGNAL_LIMITS'" error in usageTracker.ts
 */
export const SIGNAL_LIMITS: Record<string, number> = {
  [Plan.FREE]: 0,
  [Plan.PRO]: 5,
  [Plan.ELITE]: 999,
  [Plan.INSTITUTIONAL]: 9999
};
