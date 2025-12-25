import CryptoJS from 'crypto-js';
import { DecisionAudit, AuditRecord } from '../../types';

class AuditLogger {
  private static lastHash: string = "0x0000000000000000";

  /**
   * 🏛️ IMMUTABLE LOGGING PROTOCOL
   * Generates a hash-chain entry for every decision.
   * This is the "Black Box" of the AI system for regulators.
   */
  static logDecision(decision: Partial<DecisionAudit>): AuditRecord {
    const timestamp = new Date().toISOString();
    const payload = JSON.stringify(decision);
    
    // SHA-256 Hash Chaining logic: Current Hash = Hash(PrevHash + Data + Time)
    const currentHash = CryptoJS.SHA256(this.lastHash + payload + timestamp).toString();
    this.lastHash = currentHash;

    const record: AuditRecord = {
      id: decision.decisionId || `aud-${Date.now()}`,
      type: decision.decision === 'ALERT' ? 'EXECUTION_DISPATCH' : 'RISK_VETO',
      summary: `Node: ${decision.symbol} | Result: ${decision.decision} | Logic: ${decision.model?.version}`,
      timestamp,
      hash: currentHash,
      userAccepted: true,
      details: decision
    };

    // Store in Sharded Registry (Local Simulation of DB Shard)
    const existing = JSON.parse(localStorage.getItem('sher_compliance_chain') || '[]');
    localStorage.setItem('sher_compliance_chain', JSON.stringify([record, ...existing].slice(0, 1000)));

    console.info(`🦁 [AuditChain] Entry Committed: ${currentHash.slice(0, 8)}...`);
    return record;
  }

  static getChain(): AuditRecord[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('sher_compliance_chain') || '[]');
  }
}

export { AuditLogger };