
class RateLimiter {
  private lastCall: Map<string, number> = new Map();

  /**
   * Checks if a call is allowed based on a minimum gap in milliseconds.
   * @param key Unique key for the API endpoint or category
   * @param minGapMs Minimum allowed time between calls
   */
  allow(key: string, minGapMs: number): boolean {
    const now = Date.now();
    const last = this.lastCall.get(key) || 0;

    if (now - last < minGapMs) {
      console.warn(`[RateLimiter] Call blocked for ${key}. Gap: ${now - last}ms < ${minGapMs}ms`);
      return false;
    }

    this.lastCall.set(key, now);
    return true;
  }

  getLastCall(key: string): number {
    return this.lastCall.get(key) || 0;
  }
}

export const rateLimiter = new RateLimiter();
