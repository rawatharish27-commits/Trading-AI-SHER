/**
 * ⏱️ TICK VALIDATOR
 * Goal: Zero-Discretionary block on lagged data nodes.
 */
export class TickValidator {
  private static readonly STALE_THRESHOLD_MS = 3000;

  /**
   * Validates if a tick is fresh enough for logic sharding.
   */
  static isFresh(exchangeTimestamp: number): boolean {
    const delay = Date.now() - exchangeTimestamp;
    
    if (delay > this.STALE_THRESHOLD_MS) {
      console.error(`🦁 [TickGuard] DATA_LAG: Tick is ${delay}ms old. Blocking execution.`);
      return false;
    }
    
    return true;
  }
}