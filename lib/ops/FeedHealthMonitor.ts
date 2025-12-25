import { eventBus } from "../engine/eventBus";

export interface FeedMetrics {
  hertz: number;       // Ticks per second
  latency: number;     // Round-trip ms
  dropped: number;     // Packet loss count
  reconnects: number;  // Socket reset count
  status: 'OPTIMAL' | 'DEGRADED' | 'DEAD';
}

/**
 * 🩺 OPS HEALTH MONITOR
 * Telemetry shard for production feed stability.
 */
export class FeedHealthMonitor {
  private static tickCount = 0;
  private static droppedCount = 0;
  private static reconnectCount = 0;
  private static lastMetrics: FeedMetrics = { hertz: 0, latency: 0, dropped: 0, reconnects: 0, status: 'DEAD' };

  static recordTick() {
    this.tickCount++;
  }

  static recordDrop() {
    this.droppedCount++;
    eventBus.emit('audit.log', { msg: 'Packet Drop Detected', severity: 'WARN' }, 'OPS_MONITOR');
  }

  static recordReconnect() {
    this.reconnectCount++;
    eventBus.emit('audit.log', { msg: 'Socket Re-establishing...', severity: 'CRITICAL' }, 'OPS_MONITOR');
  }

  static computeMetrics(currentLatency: number): FeedMetrics {
    const hertz = this.tickCount;
    this.tickCount = 0; // Reset for next window

    const status = hertz > 0 ? (currentLatency < 500 ? 'OPTIMAL' : 'DEGRADED') : 'DEAD';
    
    this.lastMetrics = {
      hertz,
      latency: currentLatency,
      dropped: this.droppedCount,
      reconnects: this.reconnectCount,
      status
    };

    return this.lastMetrics;
  }

  static getStatus() {
    return this.lastMetrics;
  }
}