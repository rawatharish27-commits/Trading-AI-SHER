import { jwtUtils } from '../utils/jwt';

/**
 * 🛰️ SESSION LIFECYCLE NODE
 * Handles JWT rotation and token persistence.
 */
class SessionManager {
  private readonly ACCESS_KEY = 'sher_access_shard';
  private readonly REFRESH_KEY = 'sher_refresh_shard';

  storeTokens(access: string, refresh: string) {
    localStorage.setItem(this.ACCESS_KEY, access);
    localStorage.setItem(this.REFRESH_KEY, refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  async refreshSession(): Promise<string | null> {
    const refresh = localStorage.getItem(this.REFRESH_KEY);
    if (!refresh) return null;

    const payload = jwtUtils.verify(refresh);
    if (!payload) {
      this.terminate();
      return null;
    }

    // Provision new short-lived access shard
    const nextAccess = jwtUtils.sign({ id: payload.id, role: payload.role }, '15m');
    localStorage.setItem(this.ACCESS_KEY, nextAccess);
    
    console.info("🦁 [SessionManager] Access Shard Rotated.");
    return nextAccess;
  }

  terminate() {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem('sher_user_profile');
  }
}

export const sessionManager = new SessionManager();
