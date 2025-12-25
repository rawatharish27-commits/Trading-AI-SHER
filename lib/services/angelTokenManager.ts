import { prisma } from '../prisma';
import { AngelAuthService } from './angelAuthService';

/**
 * 🧊 ANGEL TOKEN MANAGER
 * Lifecycle controller for session shards. Prevents unnecessary re-logins.
 * Restart-Safe: Survives Cloud Run container refreshes via DB persistence.
 */
export class AngelTokenManager {
  /**
   * Retrieves the active session shard.
   * Auto-refreshes if shard is expired or missing.
   */
  static async getValidToken(): Promise<string> {
    const session = await (prisma as any).angelSession.findFirst();
    const now = new Date();
    
    if (!session || new Date(session.expiresAt) < now) {
      console.info("🦁 [TokenManager] Shard missing or expired. Refreshing...");
      return await AngelAuthService.performInstitutionalLogin();
    }

    return session.accessToken;
  }

  static async getFeedToken(): Promise<string | null> {
    const session = await (prisma as any).angelSession.findFirst();
    return session?.feedToken || null;
  }
}