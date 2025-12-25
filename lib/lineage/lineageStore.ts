
import { LineageShard } from '../../types';

/**
 * 🕵️ LINEAGE STORE
 * Goal: Absolute auditability from Tick to PnL.
 */
class LineageStore {
  private static readonly STORAGE_KEY = 'sher_lineage_v1';
  private logs: LineageShard[] = [];

  constructor() {
    this.load();
  }

  record(event: Omit<LineageShard, 'timestamp'>) {
    const shard: LineageShard = {
      ...event,
      timestamp: Date.now()
    };
    this.logs.push(shard);
    
    // In-memory limit for UI performance, full persistence in SQL/NoSQL in prod
    if (this.logs.length > 500) this.logs.shift();
    this.save();
  }

  getTrace(traceId: string): LineageShard[] {
    return this.logs.filter(l => l.traceId === traceId);
  }

  getAll(): LineageShard[] {
    return [...this.logs].reverse();
  }

  private load() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(LineageStore.STORAGE_KEY);
    if (saved) this.logs = JSON.parse(saved);
  }

  private save() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LineageStore.STORAGE_KEY, JSON.stringify(this.logs));
  }
}

export const lineageStore = new LineageStore();
