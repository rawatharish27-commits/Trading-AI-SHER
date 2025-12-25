
import { AuditLog } from '../../types';

export class ComplianceService {
  private static readonly STORAGE_KEY = 'sher_compliance_logs_v4';
  
  /**
   * Logs every system action for audit transparency.
   * In production, this pushes to an immutable DB like Amazon QLDB.
   */
  static log(userId: string, action: string, payload: any, severity: 'INFO' | 'WARN' | 'CRITICAL' = 'INFO') {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      payload,
      timestamp: new Date().toISOString(),
      severity
    };

    const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    const next = [entry, ...existing].slice(0, 1000); // Keep last 1000 logs locally
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    
    if (severity === 'CRITICAL') {
      console.warn(`[COMPLIANCE] CRITICAL AUDIT: ${action}`, payload);
    }
  }

  static getLogs(): AuditLog[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
  }
}
