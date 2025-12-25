
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Activity, Cpu, AlertTriangle, 
  RefreshCw, Power, Zap, Radio, Database, HeartPulse, Clock, Wifi
} from 'lucide-react';
import { brokerHealth, BrokerHealthStatus } from '../lib/services/brokerHealth';
import { killSwitch } from '../lib/services/risk/killSwitch';
import { pnlService } from '../lib/services/pnlService';
import { WarmupLoader } from '../lib/services/warmupLoader';
import MarketStatusBadge from './MarketStatusBadge';
import { useMarketStream } from '../hooks/useMarketStream';

const GlobalStatusBar: React.FC = () => {
  const [health, setHealth] = useState<BrokerHealthStatus>(brokerHealth.getStatus());
  const [warmup, setWarmup] = useState(WarmupLoader.getStatus());
  const [, setTick] = useState(0);
  
  const isHalted = killSwitch.isActive();
  const pnl = pnlService.snapshot();
  
  // Connect to the stream for global data mode status
  const { dataMode } = useMarketStream(true);

  useEffect(() => {
    const inv = setInterval(async () => {
      const h = await brokerHealth.checkHealth();
      setHealth(h);
      setWarmup(WarmupLoader.getStatus());
      setTick(t => t + 1);
    }, 2000);
    
    WarmupLoader.execute();
    return () => clearInterval(inv);
  }, []);

  return (
    <div className={`h-11 border-b flex items-center justify-between px-6 z-[60] shrink-0 transition-all duration-700 ${
      isHalted ? 'bg-rose-600 border-rose-700' : 'bg-black border-border-dark'
    }`}>
      <div className="flex items-center gap-8">
        {/* Node Health */}
        <div className="flex items-center gap-3">
          <ShieldCheck size={14} className={health.gateway === 'CONNECTED' ? 'text-emerald-500' : 'text-amber-500'} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40">
            Node Status: <span className={health.gateway === 'CONNECTED' ? 'text-emerald-400' : 'text-amber-400'}>
              {isHalted ? 'LOCKED' : health.gateway}
            </span>
          </span>
        </div>

        <div className="h-4 w-px bg-white/10" />

        {/* Data Mode Sentinel Shard */}
        <MarketStatusBadge mode={dataMode} />

        <div className="h-4 w-px bg-white/10" />

        {/* Latency Shard */}
        <div className="flex items-center gap-6">
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-sher-muted uppercase tracking-widest">Gateway Latency</span>
              <div className="flex items-center gap-1.5">
                 <Wifi size={10} className={health.latency < 200 ? 'text-emerald-500' : 'text-rose-500'} />
                 <span className="text-[10px] font-black text-white/60 tabular-nums">{health.latency}ms</span>
              </div>
           </div>
           
           <div className="flex flex-col">
              <span className="text-[7px] font-black text-sher-muted uppercase tracking-widest">Warmup Load</span>
              <div className="flex items-center gap-2">
                 <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-sher-accent transition-all" style={{ width: `${warmup.progress}%` }} />
                 </div>
                 <span className="text-[10px] font-black text-white/60 tabular-nums">{warmup.progress}%</span>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className={`flex items-center gap-3 px-4 py-1 rounded-inst border ${pnl.net >= 0 ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-rose-500/5 border-rose-500/10'}`}>
          <Activity size={12} className={pnl.net >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
          <span className={`text-[10px] font-black tabular-nums ${pnl.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {pnl.net >= 0 ? '+' : ''}₹{Math.abs(pnl.net).toLocaleString()}
          </span>
        </div>

        <button 
          onClick={() => isHalted ? killSwitch.disengage() : killSwitch.engage('MANUAL_USER_TERMINATION')}
          className={`h-7 px-4 rounded-inst transition-all flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${
            !isHalted 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white' 
              : 'bg-white border-white text-rose-600 shadow-xl'
          }`}
        >
          {isHalted ? <Zap size={11} fill="currentColor" /> : <Power size={11} />}
          {isHalted ? 'Restore Node' : 'Nuclear Halt'}
        </button>
      </div>
    </div>
  );
};

export default GlobalStatusBar;
