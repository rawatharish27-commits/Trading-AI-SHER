class TokenStore {
  private readonly STORAGE_KEY = 'sher_broker_vault_secure_v2';
  
  public jwt?: string;
  public feed?: string;
  public refresh?: string;
  public createdAt?: number;
  private readonly TOKEN_EXPIRY_MS = 14 * 60 * 60 * 1000; // ~14 Hours (Active till midnight rule)

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    
    const dataRaw = localStorage.getItem(this.STORAGE_KEY);
    if (!dataRaw) return;

    try {
      const data = JSON.parse(dataRaw);
      if (data.createdAt && Date.now() - data.createdAt < this.TOKEN_EXPIRY_MS) {
        this.jwt = data.jwt;
        this.feed = data.feed;
        this.refresh = data.refresh;
        this.createdAt = data.createdAt;
      } else {
        this.clear();
      }
    } catch (e) {
      console.error("Vault load failed - clearing stale data", e);
      this.clear();
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    
    if (this.jwt && this.feed && this.createdAt) {
      const data = {
        jwt: this.jwt,
        feed: this.feed,
        refresh: this.refresh,
        createdAt: this.createdAt
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  setToken(jwt: string, feed: string, refresh?: string) {
    this.jwt = jwt;
    this.feed = feed;
    this.refresh = refresh;
    this.createdAt = Date.now();
    this.saveToStorage();
  }

  isValid(): boolean {
    if (!this.jwt || !this.createdAt) return false;
    return Date.now() - this.createdAt < this.TOKEN_EXPIRY_MS;
  }

  clear() {
    this.jwt = undefined;
    this.feed = undefined;
    this.refresh = undefined;
    this.createdAt = undefined;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Fix: Added createdAt to return object to resolve session auditing errors in tokenManager.ts.
   */
  getTokens() {
    return {
      jwt: this.jwt,
      feed: this.feed,
      refresh: this.refresh,
      createdAt: this.createdAt
    };
  }
}

export const tokenStore = new TokenStore();