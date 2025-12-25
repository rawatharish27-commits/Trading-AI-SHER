import React from 'react';
import { TradeThesisContract } from '../../types';
import { X, ShieldCheck, Activity, Target, ShieldAlert, TrendingUp, ChevronRight, Info } from 'lucide-react';

interface TradeThesisDrawerProps {
  thesis: TradeThesisContract;
  isOpen: boolean;
  onClose: () => void;
}

const TradeThesisDrawer: React.FC<TradeThesisDrawerProps> = ({ thesis, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex justify-end animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="w-full max-w-lg bg-slate-950 border-l border-white/10 h-full relative z-10 shadow-[0_0_100px_rgba(0,0,0,1)] flex flex-col animate-in slide-in-from-right duration-500">
        <div className="p-8 border-b border-white/5 bg-panel flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20">
                <Target size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Trade Thesis</h2>
                <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.3em]">{thesis.symbol} Node Audit</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-sher-muted hover:text-white bg-white/5 rounded-full"><X size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
           {/* Headline Shard */}
           <div className="space-y-4">
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${thesis.direction === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {thesis.direction} Shard
              </span>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">{thesis.headline}</h1>
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                 <div className="flex-1">
                    <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-2">Thesis Conviction</p>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                       <div className="h-full bg-sher-accent shadow-[0_0_10px_rgba(59,130,246,0.6)]" style={{ width: `${thesis.thesisStrength}%` }} />
                    </div>
                 </div>
                 <span className="text-2xl font-black text-white">{thesis.thesisStrength}%</span>
              </div>
           </div>

           {/* Supporting Factors */}
           <div className="space-y-6">
              <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2">
                 <ShieldCheck size={16} /> Supporting Evidence
              </h3>
              <div className="grid grid-cols-1 gap-3">
                 {thesis.supportingFactors.map((f, i) => (
                    <div key={i} className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                       <span className="text-[11px] font-black text-gray-300 uppercase tracking-widest">{f.label}</span>
                       <div className="flex items-center gap-4">
                          <div className="h-1 w-12 bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${f.strength * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-white">{(f.strength * 100).toFixed(0)}%</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Risk Shards */}
           <div className="space-y-6">
              <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-2">
                 <ShieldAlert size={16} /> Vulnerability Audit
              </h3>
              <div className="grid grid-cols-1 gap-3">
                 {thesis.riskFactors.map((f, i) => (
                    <div key={i} className="bg-rose-500/5 p-5 rounded-2xl border border-rose-500/10 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{f.label}</span>
                       </div>
                       <span className={`text-[8px] font-black px-2 py-1 rounded border ${f.severity === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-rose-400 border-rose-500/20'}`}>
                          {f.severity} RISK
                       </span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Invalidation Point */}
           <div className="bg-slate-900 p-8 rounded-[32px] border border-white/5 space-y-4">
              <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
                 <Activity size={14} className="text-amber-500" /> Invalidation Level
              </p>
              <p className="text-2xl font-black text-white tabular-nums tracking-tighter">₹{thesis.invalidationPoint.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase italic">
                 If price reaches this node, the neural thesis is considered failed and execution shards must be terminated.
              </p>
           </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-panel flex flex-col gap-4">
           <div className="flex items-center gap-3 text-sher-muted">
              <Info size={14} />
              <p className="text-[8px] font-black uppercase tracking-widest">Logic verified by Neural Core v4.2 stable</p>
           </div>
           <button onClick={onClose} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-sher-accent hover:text-white transition-all shadow-2xl">Acknowledge Audit</button>
        </div>
      </div>
    </div>
  );
};

export default TradeThesisDrawer;