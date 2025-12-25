
import { UserRole, Plan } from '../types';
import { FEATURE_ACCESS, Feature } from './permissions';

/**
 * 🔐 ACCESS ENGINE: SOVEREIGN LOGIC
 * RULE 1: ADMIN ROLE = GOD MODE (Absolute Access)
 * RULE 2: Restricted by Plan for standard users.
 */
export function hasAccess(
  role: UserRole,
  plan: Plan,
  feature: Feature
): boolean {
  // 🦁 ADMIN BYPASS: If identity is ADMIN, grant full shard access
  if (role === UserRole.ADMIN) return true;

  // Standard User Logic
  if (feature === 'ADMIN_PANEL') return false;

  const allowedPlans = FEATURE_ACCESS[feature] as readonly Plan[];
  if (!allowedPlans) return false;
  
  return allowedPlans.includes(plan);
}

export function getRequiredPlan(feature: Feature): Plan {
  const plans = FEATURE_ACCESS[feature] as readonly Plan[];
  if (!plans || plans.length === 0) return Plan.ELITE;

  if (plans.includes(Plan.FREE)) return Plan.FREE;
  if (plans.includes(Plan.PRO)) return Plan.PRO;
  return Plan.ELITE;
}
