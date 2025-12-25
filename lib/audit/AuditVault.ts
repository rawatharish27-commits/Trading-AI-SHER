import CryptoJS from 'crypto-js';
import { AuditHashShard } from '../compliance/types';

/**
 * 🏛️ AUDIT VAULT
 * Goal: Immutable "Black Box" for regulatory defense.
 */
export class AuditVault {
  private static chain: AuditHashShard[] = [];
  private static lastHash: string = "0000000000000000000000000000000000000000000000000000000000000000";

  /**
   * Appends data to the immutable hash chain.
   */
  static log(data: any): AuditHashShard {
    const timestamp = Date.now();
    const payload = JSON.stringify(data) + this.lastHash + timestamp;
    const currentHash = CryptoJS.SHA256(payload).toString();

    const shard: AuditHashShard = {
      prevHash: this.lastHash,
      currentHash,
      data,
      timestamp
    };

    this.chain.push(shard);
    this.lastHash = currentHash;

    // In production, this persists to a WORM (Write Once Read Many) DB
    console.log(`🦁 [AuditVault] Shard committed: ${currentHash.slice(0, 8)}`);
    return shard;
  }

  static verifyChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const prev = this.chain[i - 1];
      const curr = this.chain[i];
      if (curr.prevHash !== prev.currentHash) return false;
    }
    return true;
  }

  static getLogs() { return this.chain; }
}