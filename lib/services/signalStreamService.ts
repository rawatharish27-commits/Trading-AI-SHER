import { AISignal, AssetClass, DecisionState } from '../../types';
import { governanceService } from './governanceService';
import { executionEngine } from './executionEngine';
import { AlertRouter } from '../engine/alertRouter';
import { BackpressureGuard } from '../infra/BackpressureGuard';
import { MetricsNode } from '../observability/MetricsNode';

type SignalCallback = (signal: AISignal) => void;
type StatusCallback = (status: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING') => void;

class SignalStreamService {
  private listeners: Set<SignalCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private intervalId: any = null;
  private connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' = 'DISCONNECTED';

  constructor() {
    this.connect();
  }

  private connect() {
    this.connectionStatus = 'RECONNECTING';
    this.notifyStatus();

    setTimeout(() => {
      this.connectionStatus = 'CONNECTED';
      this.notifyStatus();
      this.startSimulation();
    }, 1500);
  }

  subscribe(callback: SignalCallback) {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback); };
  }

  subscribeStatus(callback: StatusCallback) {
    this.statusListeners.add(callback);
    callback(this.connectionStatus);
    return () => { this.statusListeners.delete(callback); };
  }

  private notifyStatus() {
    this.statusListeners.forEach(cb => cb(this.connectionStatus));
  }

  private startSimulation() {
    const nextTick = () => {
      if (!governanceService.isServiceActive('neuralDiscovery')) {
          setTimeout(nextTick, 5000);
          return;
      }

      const delay = Math.random() * (45000 - 15000) + 15000;
      this.intervalId = setTimeout(() => {
        if (this.connectionStatus === 'CONNECTED') {
          try {
            // --- PHASE 5: BACKPRESSURE CHECK ---
            if (!BackpressureGuard.shouldDropSignal()) {
              this.generateHighProbSignal();
            } else {
              console.warn("🦁 [Infra] Signal Shedding: Load Threshold Exceeded.");
            }
          } catch (err) {
            console.error("[SignalStream] Error generating signal node:", err);
          }
        }
        nextTick();
      }, delay);
    };
    nextTick();
  }

  private generateHighProbSignal() {
    const start = performance.now();
    try {
      const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATASTEEL', 'SBIN', 'MARUTI', 'BAJFINANCE'];
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const action = Math.random() > 0.4 ? 'BUY' : 'SELL';
      const prob = 0.84 + (Math.random() * 0.11); 
      
      const entry = 1000 + Math.random() * 4000;
      const signal: AISignal = {
        id: `live-${Date.now()}`,
        symbol,
        assetClass: AssetClass.EQUITY,
        action,
        confidence: prob,
        probability: prob,
        trapDetected: 'NONE',
        smartMoneyFlow: Math.random() > 0.5 ? 'ACCUMULATION' : 'DISTRIBUTION',
        timestamp: new Date().toLocaleTimeString(),
        reasoning: 'Institutional imbalance detected via neural core v2.4.',
        strategy: 'VWAP Trend Ride',
        targets: {
          entry: Number(entry.toFixed(2)),
          sl: Number((entry * 0.99).toFixed(2)),
          t1: Number((entry * 1.02).toFixed(2)),
          t2: Number((entry * 1.04).toFixed(2))
        },
        decisionState: DecisionState.DISPATCH_READY
      };

      // 1. Notify UI
      this.listeners.forEach(cb => cb(signal));

      // 2. Alert & Execution
      AlertRouter.dispatch(signal);
      
      // 3. Metrics Tracking
      const end = performance.now();
      MetricsNode.record('signal_generation_latency', end - start);

      if (signal.probability > 0.94 && governanceService.isServiceActive('automatedExecution')) {
        executionEngine.autoExecute(signal);
      }
    } catch (criticalErr) {
      console.error("[SignalStream] Critical Generation Error", criticalErr);
    }
  }

  disconnect() {
    this.connectionStatus = 'DISCONNECTED';
    this.notifyStatus();
    if (this.intervalId) clearTimeout(this.intervalId);
  }
}

export const signalStreamService = new SignalStreamService();