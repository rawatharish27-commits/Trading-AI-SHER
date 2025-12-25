
import { LatencyReport } from '../../types';

class LatencyService {
  private marks: Map<string, number> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  generateReport(): LatencyReport {
    const tick = this.marks.get('tick_received') || 0;
    const feat = this.marks.get('features_done') || 0;
    const decision = this.marks.get('decision_done') || 0;
    const alert = this.marks.get('alert_sent') || 0;
    const execution = this.marks.get('execution_dispatched') || 0;

    return {
      tickReceivedToFeatures: Math.max(0, feat - tick),
      featuresToDecision: Math.max(0, decision - feat),
      decisionToAlert: Math.max(0, alert - decision),
      alertToExecution: Math.max(0, execution - alert),
      totalMs: Math.max(0, execution - tick)
    };
  }

  reset() {
    this.marks.clear();
  }
}

export const latencyService = new LatencyService();
