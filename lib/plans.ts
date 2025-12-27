import { Plan } from '../types/global';

export interface PlanConfig {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  aiLimit: number;
  gatewayIds: {
    stripe?: string;
    razorpay?: string;
  };
}

export const PLANS_CONFIG: Record<Plan, PlanConfig> = {
  FREE: {
    name: 'Free Tier',
    description: 'Basic features for casual traders',
    price: 0,
    currency: 'INR',
    interval: 'month' as const,
    features: [
      '10 AI calls/day',
      'Rule-based fallback',
      'Basic probability',
      'No audit trail'
    ],
    aiLimit: 10,
    gatewayIds: {}
  },
  PRO: {
    name: 'Pro Tier',
    description: 'Professional features for serious traders',
    price: 299,
    currency: 'INR',
    interval: 'month' as const,
    features: [
      '200 AI calls/day',
      'Investor-grade probability',
      'Evidence & Explainability',
      'Trade logging',
      'Monthly billing'
    ],
    aiLimit: 200,
    gatewayIds: {
      stripe: 'price_1OABC',
      razorpay: 'plan_1OXYZ'
    }
  },
  INSTITUTIONAL: {
    name: 'Institutional Tier',
    description: 'Enterprise features for institutional clients',
    price: 2499,
    currency: 'INR',
    interval: 'month' as const,
    features: [
      '1000 AI calls/day',
      'ML-assisted calibration',
      'Full audit trail',
      'White-label branding',
      'Dedicated support'
    ],
    aiLimit: 1000,
    gatewayIds: {
      stripe: 'price_1OABC',
      razorpay: 'plan_1OXYZ'
    }
  }
};

export function getPlanConfig(plan: Plan): PlanConfig | undefined {
  return PLANS_CONFIG[plan];
}

export function getPlanLimits(plan: Plan): { aiLimit: number } {
  const config = PLANS_CONFIG[plan];
  if (!config) {
    return { aiLimit: 10 }; // Default to FREE
  }
  return { aiLimit: config.aiLimit };
}

// Export for usage tracking
export const SIGNAL_LIMITS: Record<Plan, number> = {
  FREE: PLANS_CONFIG.FREE.aiLimit,
  PRO: PLANS_CONFIG.PRO.aiLimit,
  INSTITUTIONAL: PLANS_CONFIG.INSTITUTIONAL.aiLimit
};
