import { AISignal, MarketTick } from '../../types';

export type EventTopic = 
  | 'market.tick' 
  | 'alpha.discovery' 
  | 'probability.calibrated' 
  | 'risk.validation' 
  | 'exec.dispatch' 
  | 'audit.log'
  | 'ml.drift_detected'
  | 'ml.model.updated'
  | 'shadow.exec.result';

export interface SystemEvent {
  id: string;
  topic: EventTopic;
  payload: any;
  timestamp: number;
  origin: string;
}

type EventCallback = (event: SystemEvent) => void;

class SovereignEventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private eventLog: SystemEvent[] = [];
  private readonly MAX_LOG_SIZE = 100;

  subscribe(topic: EventTopic, callback: EventCallback) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, new Set());
    }
    this.listeners.get(topic)!.add(callback);
    return () => this.listeners.get(topic)?.delete(callback);
  }

  emit(topic: EventTopic, payload: any, origin: string) {
    const event: SystemEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      topic,
      payload,
      timestamp: Date.now(),
      origin
    };

    this.eventLog.push(event);
    if (this.eventLog.length > this.MAX_LOG_SIZE) this.eventLog.shift();

    setTimeout(() => {
      this.listeners.get(topic)?.forEach(cb => {
        try {
          cb(event);
        } catch (e) {
          this.emit('audit.log', { level: 'CRITICAL', msg: `Subscriber Error on ${topic}`, error: e }, 'EVENT_BUS');
        }
      });
    }, 0);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sher-bus-event', { detail: event }));
    }
  }

  getLiveStream(): SystemEvent[] {
    return this.eventLog;
  }
}

export const eventBus = new SovereignEventBus();