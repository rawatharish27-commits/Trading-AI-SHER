
import { DataMode } from '../../types';
import { SessionEngine } from './sessionEngine';

/**
 * 🛰️ DATA MODE RESOLVER
 * Objective: Resolve absolute truth of incoming price shards.
 */
export class DataModeResolver {
  /**
   * Resolves the current Data Mode based on session state and socket integrity.
   */
  static resolve(isSocketHealthy: boolean, isLiveOptIn: boolean): DataMode {
    const isOpen = SessionEngine.isMarketHours();

    // RULE 1: Market Closed -> Always EOD/FREEZE
    if (!isOpen) return DataMode.EOD;

    // RULE 2: Market Open + Socket Healthy + Live Opted-in -> LIVE
    if (isSocketHealthy && isLiveOptIn) return DataMode.LIVE;

    // RULE 3: Market Open but Socket Friction or No Opt-in -> SIMULATED
    return DataMode.SIMULATED;
  }

  static getBadgeColor(mode: DataMode): string {
    switch (mode) {
      case DataMode.LIVE: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case DataMode.SIMULATED: return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case DataMode.EOD: return 'text-sher-muted bg-slate-800/50 border-white/5';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  }
}
