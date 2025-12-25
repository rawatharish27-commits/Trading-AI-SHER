
class WSWatchdog {
  private lastTick = Date.now();
  private healthyThreshold = 5000; // 5 seconds

  /**
   * Called on every market tick to update the heartbeat.
   */
  onTick() {
    this.lastTick = Date.now();
  }

  /**
   * Checks if the stream is currently healthy.
   */
  isHealthy(): boolean {
    const gap = Date.now() - this.lastTick;
    return gap < this.healthyThreshold;
  }

  getLatency(): number {
    return Date.now() - this.lastTick;
  }
}

export const wsWatchdog = new WSWatchdog();
