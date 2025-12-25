import { tokenStore } from "./tokenStore";
import { brokerConfigService } from "./brokerConfigService";

/**
 * 🦁 SOVEREIGN TOKEN MANAGER
 * Goal: Zero-Downtime Session Management
 */
class TokenManager {
  private refreshInterval: any = null;
  private readonly REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 Minutes before expiry

  /**
   * Initializes the token lifecycle node.
   * If tokens are stale, it triggers a re-authentication.
   */
  async initialize() {
    if (!tokenStore.isValid()) {
      console.warn("🦁 [TokenManager] Shard expired. Re-authentication required.");
      return false;
    }

    this.setupAutoRefresh();
    return true;
  }

  private setupAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    
    // Angel One tokens typically last until midnight, 
    // but we check every 15 minutes for safety.
    this.refreshInterval = setInterval(() => {
      this.auditSession();
    }, 15 * 60000);
  }

  private async auditSession() {
    const tokens = tokenStore.getTokens();
    if (!tokens.createdAt) return;

    const age = Date.now() - tokens.createdAt;
    const expiryLimit = 14 * 60 * 60 * 1000; // 14 hours

    if (age > (expiryLimit - this.REFRESH_THRESHOLD)) {
      console.info("🦁 [TokenManager] Token aging detected. Initiating shard refresh...");
      // In production, use refreshToken to get a new session
      // For this skeleton, we broadcast a re-login event
      window.dispatchEvent(new CustomEvent('sher-session-expired'));
    }
  }

  getFeedToken(): string | null {
    const tokens = tokenStore.getTokens();
    return tokens.feed || null;
  }

  getJWT(): string | null {
    const tokens = tokenStore.getTokens();
    return tokens.jwt || null;
  }

  terminate() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    tokenStore.clear();
  }
}

export const tokenManager = new TokenManager();