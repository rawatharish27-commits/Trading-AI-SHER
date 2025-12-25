import { eventBus } from '../engine/eventBus';

export type AlertSeverity = 'INFO' | 'WARN' | 'CRITICAL';

/**
 * 🚨 ALERT MANAGER
 * Goal: No-delay notification of system friction.
 */
export class AlertManager {
  static dispatch(msg: string, severity: AlertSeverity, metadata: any = {}) {
    console.error(`[ALERT] [${severity}] ${msg}`, metadata);
    
    eventBus.emit('audit.log', {
      msg: `SYSTEM_ALERT: ${msg}`,
      severity,
      metadata,
      timestamp: Date.now()
    }, 'ALERT_MANAGER');

    if (severity === 'CRITICAL') {
      this.triggerEmergencyProtocol(msg);
    }
  }

  private static triggerEmergencyProtocol(msg: string) {
    // In production, this hits PagerDuty / Telegram Shard
    // Here we ensure it's logged with priority
    localStorage.setItem('sher_incident_active', JSON.stringify({ msg, at: Date.now() }));
  }
}