import React from 'react';
import { Cpu, Activity, BrainCircuit, ShieldCheck, ChevronRight } from 'lucide-react';

const MLTrainingTerminal: React.FC = () => {
  const weights = [
    { label: 'RSI Momentum', value: 0.22, drift: '+0.02' },
    { label: 'Volume Pressure', value: 0.31, drift: '-0.01' },
    { label: 'VWAP Convergence', value: 0.12, drift: '+0.05' },
    { label: 'Trend Persistence', value: 0.28, drift: '0.00' },
    { label: 'Order Imbalance', value: 0.15, drift: '+0.01' },
  ];

  return (
    <div className="bg-slate-950 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-full animate-in fade-in duration-700">
      <div className="p-6 border-b border-white/5 bg-panel flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BrainCircuit size={20} className="text-sher-accent" />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">ML Calibration Node</h3>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-emerald-400 uppercase">Learning Enabled</span>
        </div>
      </div>

      <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest">Active Feature Weights</p>
          {weights.map((w, i) => (
            <div key={i} className="space-y-2 group">
              <div className="flex justify-between items-center text-[10px] font-black uppercase">
                <span className="text-white/60 group-hover:text-white transition-colors">{w.label}</span>
                <div className="flex gap-3">
                  <span className="text-sher-accent">{w.value.toFixed(2)}</span>
                  <span className={w.drift.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}>{w.drift}</span>
                </div>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-sher-accent/50" style={{ width: `${w.value * 200}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 uppercase">
              <ShieldCheck size={14} /> Model Health: STABLE
           </div>
           <p className="text-[9px] text-sher-muted font-bold leading-relaxed uppercase italic">
             Online training sharded across 1,240 session outcomes. Feature drift remains within institutional tolerance (±0.05).
           </p>
        </div>
      </div>

      <div className="p-6 border-t border-white/5 bg-panel flex justify-between items-center">
         <button className="flex items-center gap-2 text-[9px] font-black text-white uppercase tracking-widest hover:text-sher-accent transition-colors">
            Retrain Shard <ChevronRight size={14} />
         </button>
         <span className="text-[8px] font-black text-sher-muted uppercase">Weights v4.2.1 Stable</span>
      </div>
    </div>
  );
};

export default MLTrainingTerminal;
