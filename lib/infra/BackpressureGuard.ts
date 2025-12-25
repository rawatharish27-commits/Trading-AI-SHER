import { eventBus } from '../engine/eventBus';

/**
 * 🧱 BACKPRESSURE GUARD
 * Goal: Prevent system meltdown during market spikes.
 */
export class BackpressureGuard {
  private static queueLength = 0;
  private static readonly CRITICAL_THRESHOLD = 100;
  private static isThrottled = false;

  static increment() {
    this.queueLength++;
    this.audit();
  }

  static decrement() {
    this.queueLength = Math.max(0, this.queueLength - 1);
    this.audit();
  }

  private static audit() {
    if (this.queueLength > this.CRITICAL_THRESHOLD && !this.isThrottled) {
      this.isThrottled = true;
      eventBus.emit('audit.log', { 
        msg: 'CRITICAL_BACKPRESSURE: Throttling Signal Ingestion', 
        severity: 'CRITICAL',
        queue: this.queueLength 
      }, 'BACKPRESSURE_GUARD');
    } else if (this.queueLength < (this.CRITICAL_THRESHOLD * 0.6)) {
      this.isThrottled = false;
    }
  }

  static shouldDropSignal(): boolean {
    // 5% random drop even if not throttled to simulate load shedding
    if (this.isThrottled) return true;
    return Math.random() > 0.98; 
  }

  static getQueueStatus() {
    return { length: this.queueLength, throttled: this.isThrottled };
  }
}