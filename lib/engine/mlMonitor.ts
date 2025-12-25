
import { eventBus } from './eventBus';

export class MLMonitor {
  private static accuracyWindow: number[] = [];
  private static readonly DRIFT_THRESHOLD = 0.70;

  /**
   * Tracks signal outcomes to detect model decay.
   */
  static recordOutcome(probability: number, success: boolean) {
    const score = success ? 1 : 0;
    this.accuracyWindow.push(score);
    if (this.accuracyWindow.length > 50) this.accuracyWindow.shift();

    const avgAccuracy = this.accuracyWindow.reduce((a, b) => a + b, 0) / this.accuracyWindow.length;
    
    if (this.accuracyWindow.length >= 20 && avgAccuracy < this.DRIFT_THRESHOLD) {
      eventBus.emit('ml.drift_detected', {
        accuracy: avgAccuracy,
        threshold: this.DRIFT_THRESHOLD,
        status: 'CRITICAL_DECAY'
      }, 'ML_MONITOR_NODE');
    }
  }

  static getHealth() {
    const acc = this.accuracyWindow.length > 0 
      ? (this.accuracyWindow.reduce((a, b) => a + b, 0) / this.accuracyWindow.length) 
      : 0.82; // Default starting state
    return {
      accuracy: acc,
      drift: acc < this.DRIFT_THRESHOLD ? 'HIGH' : 'STABLE',
      lastTraining: '2024-05-18T10:00:00Z'
    };
  }
}
