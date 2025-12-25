/**
 * 🚦 DEFENSIVE RATE LIMITER (Institutional Shard)
 * Logic Node: Abuse Prevention Layer
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly WINDOW_MS = 60000; // 1 Minute
  private readonly MAX_REQ = 100;

  /**
   * Evaluates if a request is within the institutional allowance.
   */
  allow(clientId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];
    
    // Cleanup stale shards
    const active = timestamps.filter(t => now - t < this.WINDOW_MS);
    
    if (active.length >= this.MAX_REQ) {
      console.warn(`🦁 [RateLimiter] ABUSE_DETECTION: IP ${clientId} throttled.`);
      return { allowed: false, remaining: 0 };
    }

    active.push(now);
    this.requests.set(clientId, active);
    
    return { 
      allowed: true, 
      remaining: this.MAX_REQ - active.length 
    };
  }

  getMetrics() {
    return {
      activeClients: this.requests.size,
      totalTrackedRequests: Array.from(this.requests.values()).flat().length
    };
  }
}

export const globalRateLimiter = new RateLimiter();
