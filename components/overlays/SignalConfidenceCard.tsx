import React from 'react';
import { AISignal, EvidenceCluster } from '../../types';
import { Zap, ShieldCheck, Activity, BarChart3, AlertTriangle } from 'lucide-react';

interface SignalConfidenceCardProps {
  signal: AISignal;
}

const SignalConfidenceCard: React.FC<SignalConfidenceCardProps> = ({ signal }) => {
  const prob = signal.probability * 100;
  const band = prob > 85 ? 'INSTITUTIONAL' : (prob > 70 ? 'HIGH' : 'MODERATE');
  
  return (
    <div className="p-6 bg-slate-950 border border-white/5 rounded-[32px] space-y-6 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
         <Zap size={80} />
      </div>

      <div className="flex justify-between items-start relative z-10">
        <div>
           <p className="text-[9px] font-black text-sher-muted uppercase tracking-[0.3em] mb-1">Conviction Shard</p>
           <h3 className={`text-4xl font-black tabular-nums tracking-tighter ${prob > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
             {prob.toFixed(0)}%
           </h3>
        </div>
        <div className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${
          band === 'INSTITUTIONAL' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-900 text-sher-muted border-white/5'
        }`}>
          {band} BAND
        </div>
      </div>

      <div className="space-y-4">
        {signal.clusters?.map((c, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
              <span className="text-sher-muted">{c.type} Cluster</span>
              <span className="text-white">{((c.avgStrength || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className={`h-full ${c.direction === 'BULLISH' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(c.avgStrength || 0) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {signal.conflictPenalty && signal.conflictPenalty > 0 && (
        <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-3">
           <AlertTriangle size={14} className="text-rose-500" />
           <p className="text-[9px] text-rose-400 font-bold uppercase">Evidence Conflict Detected (-{(signal.conflictPenalty * 100).toFixed(0)}%)</p>
        </div>
      )}

      <div className="pt-4 border-t border-white/5 flex items-center gap-3">
         <ShieldCheck size={14} className="text-emerald-500" />
         <p className="text-[8px] text-sher-muted font-bold uppercase tracking-widest">Decision auditable via node telemetry</p>
      </div>
    </div>
  );
};

export default SignalConfidenceCard;