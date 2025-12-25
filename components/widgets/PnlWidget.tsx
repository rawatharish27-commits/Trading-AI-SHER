
import React, { useState, useEffect } from 'react';
import { PnLSnapshot } from '../../types';
import { Zap, Target, Activity, TrendingUp, TrendingDown } from 'lucide-react';

const PnlWidget: React.FC = () => {
  const [pnl, setPnl] = useState<PnLSnapshot>({ realized: 0, unrealized: 0, net: 0, timestamp: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPnl = async () => {
      try {
        const res = await fetch('/api/pnl');
        if (res.ok) {
          const data = await res.json();
          setPnl(data);
          setLoading(false);
        }
      } catch (e) {
        console.error("PnL Sync Error", e);
      }
    };
    
    fetchPnl();
    const interval = setInterval(fetchPnl, 2000);
    return () => clearInterval(interval);
  }, []);

  const isPositive = pnl.net >= 0;

  return (
    <div className="bg-panel border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={64} className="text-sher-accent" />
        </div>
        
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-sher-accent/10 rounded-xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
                    <Activity size={16} />
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Alpha Pulse</h3>
                    <p className="text-[8px] text-sher-muted font-bold uppercase tracking-widest">Realtime Performance</p>
                </div>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Zap size={10} fill="currentColor" className="animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest">Live</span>
            </div>
        </div>

        <div className="space-y-1">
            <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest">Net Session Result</p>
            <p className={`text-4xl font-black tabular-nums tracking-tighter transition-colors ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}₹{Math.abs(pnl.net).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/5">
            <div className="space-y-1">
               <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-emerald-500" /> Realized
               </p>
               <p className="text-sm font-black text-white tabular-nums">₹{pnl.realized.toLocaleString('en-IN')}</p>
            </div>
            <div className="space-y-1 border-l border-white/5 pl-4">
               <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-1.5">
                  <TrendingDown size={10} className="text-amber-500" /> Unrealized
               </p>
               <p className="text-sm font-black text-white tabular-nums">₹{pnl.unrealized.toLocaleString('en-IN')}</p>
            </div>
        </div>
    </div>
  );
};

export default PnlWidget;
