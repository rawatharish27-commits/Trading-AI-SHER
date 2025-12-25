import { eventBus } from '../engine/eventBus';

export interface BrokerHealthStatus {
  gateway: 'CONNECTED' | 'DISCONNECTED' | 'DEGRADED';
  latency: number;
  jitter: number;
  lastHeartbeat: number;
}

class BrokerHealthService {
  private status: BrokerHealthStatus = {
    gateway: 'DISCONNECTED',
    latency: 0,
    jitter: 0,
    lastHeartbeat: Date.now()
  };

  /**
   * 📡 EXCHANGE GATEWAY AUDIT
   * Periodically verifies the broker bridge health.
   */
  async checkHealth(): Promise<BrokerHealthStatus> {
    const start = performance.now();
    try {
      // Simulate Ping to Angel One REST Core
      const response = await fetch('/api/health'); // Using internal health as proxy
      const end = performance.now();
      
      const rtt = Math.round(end - start);
      const prevLatency = this.status.latency;
      
      this.status = {
        gateway: rtt < 500 ? 'CONNECTED' : 'DEGRADED',
        latency: rtt,
        jitter: Math.abs(rtt - prevLatency),
        lastHeartbeat: Date.now()
      };
    } catch (e) {
      this.status.gateway = 'DISCONNECTED';
      eventBus.emit('audit.log', { level: 'CRITICAL', msg: 'Broker Gateway Unreachable' }, 'BROKER_HEALTH');
    }
    return this.status;
  }

  getStatus() {
    return this.status;
  }
}

export const brokerHealth = new BrokerHealthService();