import { jwtUtils } from '../utils/jwt';
import { sessionManager } from '../services/sessionManager';

/**
 * 🛡️ AUTH GUARD SHARD
 * Rule: Validate token and Role clearance before allowing logic execution.
 */
export const authGuard = {
  async verifyClearance(requiredRole?: string): Promise<boolean> {
    const token = sessionManager.getAccessToken();
    if (!token) return false;

    const payload = jwtUtils.verify(token);
    if (!payload) {
      // Attempt silent refresh
      const newToken = await sessionManager.refreshSession();
      if (!newToken) return false;
      return this.verifyClearance(requiredRole);
    }

    if (requiredRole && payload.role !== requiredRole) {
      console.warn(`🦁 [AuthGuard] CLEARANCE_DENIED: Required ${requiredRole}, Got ${payload.role}`);
      return false;
    }

    return true;
  }
};
