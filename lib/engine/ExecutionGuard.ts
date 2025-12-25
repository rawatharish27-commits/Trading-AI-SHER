import CryptoJS from 'crypto-js';

/**
 * 🛡️ EXECUTION GUARD (IDEMPOTENCY v2)
 * Goal: Block duplicate signal dispatch within a 60s window.
 */
export class ExecutionGuard {
  private static activeOrders: Set<string> = new Set();

  /**
   * Generates a deterministic key for an order node.
   * Formula: Hash(Symbol + Side + Strategy + MinuteBucket)
   */
  static generateKey(symbol: string, side: string, strategy: string): string {
    const minuteBucket = Math.floor(Date.now() / 60000);
    const payload = `${symbol}-${side}-${strategy}-${minuteBucket}`;
    return CryptoJS.SHA256(payload).toString().slice(0, 20);
  }

  static isDuplicate(key: string): boolean {
    if (this.activeOrders.has(key)) {
      console.warn(`🦁 [ExecGuard] DUPLICATE BLOCK: Node ${key} already dispatched.`);
      return true;
    }
    
    this.activeOrders.add(key);
    // Cleanup after 70s to clear the minute bucket window
    setTimeout(() => this.activeOrders.delete(key), 70000);
    return false;
  }

  static clear() {
    this.activeOrders.clear();
  }
}