
import React from 'react';
import { GateStatus } from '../../types';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Activity, ChevronDown } from 'lucide-react';

interface DecisionTracePanelProps {
  gates: GateStatus[];
  isRejected: boolean;
}

const DecisionTracePanel: React.FC<DecisionTracePanelProps> = ({ gates, isRejected }) => {
  return (
    <div className="bg-slate-950 border border-white/5 rounded-[32px] p-8 space-y-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none">
        <ShieldCheck size={120} />
      </div>

      <div className="flex justify-between items-center relative z-10">
        <div>
           <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <Activity size={16} className="text-sher-accent" /> Decision Trace Audit
           </h3>
           <p className="text-[9px] text-sher-muted font-bold uppercase mt-1 tracking-widest">Shard Lifecycle: {isRejected ? 'REJECTED_BY_GUARD' : 'DISPATCH_READY'}</p>
        </div>
        <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${isRejected ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {isRejected ? 'Veto Engaged' : 'Fidelity Verified'}
        </div>
      </div>

      <div className="space-y-0 relative z-10">
        {gates.map((gate, i) => {
          const isLast = i === gates.length - 1;
          return (
            <div key={gate.id} className="relative flex gap-6 pb-8 group last:pb-0">
              {!isLast && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-white/5 group-hover:bg-sher-accent/20 transition-colors" />
              )}
              
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                gate.passed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
              }`}>
                {gate.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              </div>

              <div className="flex-1 pt-1">
                <div className="flex justify-between items-center mb-1">
                   <span className={`text-[11px] font-black uppercase tracking-widest ${gate.passed ? 'text-white' : 'text-rose-400'}`}>
                     {gate.label}
                   </span>
                   <span className="text-[10px] font-black tabular-nums text-sher-muted">{gate.score.toFixed(0)}%</span>
                </div>
                <p className="text-[9px] text-sher-muted font-medium uppercase leading-relaxed opacity-60 italic">
                  "{gate.reason}"
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-white/5 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Clock size={12} className="text-sher-muted" />
            <span className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Latent Trace: 42ms Audit Time</span>
         </div>
         <button className="text-[8px] font-black text-sher-accent uppercase tracking-widest hover:underline flex items-center gap-1">
            Raw Telemetry <ChevronDown size={10} />
         </button>
      </div>
    </div>
  );
};

export default DecisionTracePanel;
