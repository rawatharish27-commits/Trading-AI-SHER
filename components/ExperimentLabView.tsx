
import React, { useState, useEffect } from 'react';
import { ShadowStrategyStats } from '../types';
import { ShadowRunner } from '../lib/experiment/shadowRunner';
import { 
  FlaskConical, Activity, TrendingUp, ShieldCheck, 
  ChevronRight, Award, Zap, AlertTriangle, RefreshCw, BarChart, 
  Microscope, Terminal, Layers
} from 'lucide-react';

const ExperimentLabView: React.FC = () => {
  const [stats, setStats] = useState<Record<string, ShadowStrategyStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = () => {
      setStats(ShadowRunner.getAllStats());
      setIsLoading(false);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fix: Explicitly casting Object.values result to ShadowStrategyStats array to resolve 'unknown' type inference error.
  const entries = Object.values(stats) as ShadowStrategyStats[];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><FlaskConical size={200} className="text-sher-accent" /></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-sher-accent/10 rounded-[28px] flex items-center justify-center text-sher-accent border border-sher-accent/20 shadow-2xl">
            <FlaskConical size={40} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Shadow Shard <span className="text-sher-accent not-italic">Lab</span></h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <Activity size={12} className="text-emerald-500" /> Reputation Registry: ACTIVE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-10 bg-black/40 px-8 py-6 rounded-3xl border border-white/5 relative z-10">
           <div className="text-right">
              <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest opacity-50">Experimental Nodes</p>
              <p className="text-2xl font-black text-white">{entries.length}</p>
           </div>
           <button onClick={() => window.location.reload()} className="p-4 bg-slate-900 rounded-2xl text-sher-muted hover:text-white transition-all border border-white/5">
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         <div className="xl:col-span-8 space-y-6">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                  <Microscope size={18} className="text-sher-accent" /> Strategy Incubation
               </h3>
               <span className="text-[9px] font-black text-sher-muted uppercase">Min 30 trades for promotion</span>
            </div>

            {entries.length > 0 ? (
               <div className="grid grid-cols-1 gap-4">
                  {entries.map(s => (
                    <div key={s.strategy} className="bg-panel border border-border rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-sher-accent/30 transition-all shadow-xl relative overflow-hidden">
                       <div className={`absolute top-0 left-0 w-1.5 h-full ${s.eligibleForPromotion ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`} />
                       
                       <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-sher-muted border border-white/5 shadow-inner">
                             <Terminal size={24} />
                          </div>
                          <div>
                             <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-sher-accent transition-colors">{s.strategy}</h4>
                             <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">{s.trades} Simulated Deployments</p>
                          </div>
                       </div>

                       <div className="flex-1 max-w-xs w-full px-4">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                             <span className="text-sher-muted">Win Rate</span>
                             <span className={s.winRate >= 65 ? 'text-emerald-400' : 'text-white'}>{s.winRate.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                             <div className={`h-full transition-all duration-1000 ${s.winRate >= 65 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-sher-accent'}`} style={{ width: `${s.winRate}%` }} />
                          </div>
                       </div>

                       <div className="flex items-center gap-4">
                          {s.eligibleForPromotion ? (
                             <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2">
                                <Award size={14} /> Promote to Core
                             </button>
                          ) : (
                             <div className="px-6 py-3 bg-slate-900 border border-white/5 rounded-xl text-[8px] font-black text-sher-muted uppercase tracking-[0.2em] flex items-center gap-2">
                                <RefreshCw size={12} className="animate-spin-slow" /> Observing Shard...
                             </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            ) : (
               <div className="bg-panel border border-dashed border-border rounded-[48px] p-24 text-center opacity-30">
                  <FlaskConical size={64} className="mx-auto mb-6 text-sher-muted" />
                  <p className="text-xs font-black uppercase tracking-[0.4em]">Zero experimental nodes active.</p>
               </div>
            )}
         </div>

         <div className="xl:col-span-4 space-y-6">
            <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-8">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                  <Activity size={18} className="text-sher-accent" /> Incubation Rules
               </h3>
               <div className="space-y-4">
                  {[
                    { label: 'Minimum Sample', val: '30 Trades', icon: Layers },
                    { label: 'WinRate Target', val: '65%+', icon: TrendingUp },
                    { label: 'Max Drawdown', val: '< 5%', icon: AlertTriangle },
                    { label: 'Regime Resilience', val: 'High', icon: ShieldCheck },
                  ].map(rule => (
                    <div key={rule.label} className="p-5 bg-slate-950 rounded-[28px] border border-white/5 flex items-center justify-between group hover:bg-slate-900 transition-colors">
                       <div className="flex items-center gap-3">
                          <rule.icon size={14} className="text-sher-accent" />
                          <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">{rule.label}</span>
                       </div>
                       <span className="text-[10px] font-black text-white">{rule.val}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-gradient-to-br from-sher-accent to-blue-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-12 -right-12 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><Zap size={200} /></div>
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3 italic">
                  Shadow Mode
               </h3>
               <p className="text-[11px] font-bold leading-relaxed uppercase tracking-wider opacity-80 mb-8">
                 Shadow strategies run on 100% real-time data but bypass the Angel One execution bridge. This ensures zero capital risk while the neural core builds historical reputation.
               </p>
               <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/50">
                  <ShieldCheck size={14} /> Audit Trail: AES-256 Verified
               </div>
            </div>
         </div>
      </div>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExperimentLabView;
