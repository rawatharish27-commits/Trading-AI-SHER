
import React from 'react';
import { DataMode } from '../types';
import { DataModeResolver } from '../lib/market/dataModeResolver';
import { Zap, Activity, Clock, ShieldCheck } from 'lucide-react';

const MarketStatusBadge: React.FC<{ mode: DataMode }> = ({ mode }) => {
  const styles = DataModeResolver.getBadgeColor(mode);
  
  const Icon = mode === DataMode.LIVE ? Zap : (mode === DataMode.SIMULATED ? Activity : Clock);

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 shadow-lg shadow-black/20 ${styles}`}>
       <Icon size={12} className={mode === DataMode.LIVE ? 'animate-pulse' : ''} fill={mode === DataMode.LIVE ? 'currentColor' : 'none'} />
       <span className="text-[9px] font-black uppercase tracking-[0.2em]">
          {mode === DataMode.LIVE && 'LIVE_MARKET'}
          {mode === DataMode.SIMULATED && 'SIMULATED_FEED'}
          {mode === DataMode.EOD && 'MARKET_CLOSED'}
       </span>
    </div>
  );
};

export default MarketStatusBadge;
