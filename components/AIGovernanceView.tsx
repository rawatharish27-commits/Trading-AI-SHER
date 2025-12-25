
import React, { useState } from 'react';
import { Gavel, Scale, BrainCircuit, ShieldAlert, Power, Activity, Lock, Fingerprint, ChevronRight, AlertTriangle } from 'lucide-react';
import { GovernancePolicy } from '../types';

const AIGovernanceView: React.FC = () => {
  const [policy, setPolicy] = useState<GovernancePolicy>({
    hitlRequired: true,
    martingaleBlocked: true,
    minExplainability: 0.85,
    maxDailyDDBreach: 4.5,
    leverageCap: 1.5
  });

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Scale size={160} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-[24px] flex items-center justify-center text-sher-accent border border-sher-accent/20">
            <Gavel size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">AI Governance Core</h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Firm-Wide Ethical Constraints v4.2</p>
          </div>
        </div>
        <button className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 active:scale-95 animate-pulse">
           <Power size={18} /> Global Node Halt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-panel border border-border rounded-[40px] p-10 space-y-10 shadow-2xl">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <BrainCircuit size={18} className="text-sher-accent" /> Neural Autonomy Shards
           </h3>

           {[
             { label: 'Human-in-the-Loop Shard', key: 'hitlRequired', desc: 'Require manual trader authorization for every signal node.' },
             { label: 'Martingale Blocking Protocol', key: 'martingaleBlocked', desc: 'Strict ban on increasing position size after losses.' }
           ].map(item => (
             <div key={item.key} className="flex justify-between items-start gap-8 group">
                <div className="space-y-2">
                   <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.label}</h4>
                   <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase opacity-70 italic">{item.desc}</p>
                </div>
                <button 
                  onClick={() => setPolicy({...policy, [item.key]: !(policy as any)[item.key]})}
                  className={`w-14 h-7 rounded-full relative transition-all duration-300 border ${ (policy as any)[item.key] ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-border' }`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${ (policy as any)[item.key] ? 'left-8 shadow-lg' : 'left-1' }`} />
                </button>
             </div>
           ))}
        </div>

        <div className="bg-panel border border-border rounded-[40px] p-10 space-y-10 shadow-2xl">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <ShieldAlert size={18} className="text-rose-500" /> Hard-Coded Limiters
           </h3>
           
           <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between text-[10px] font-black text-sher-muted uppercase tracking-widest">
                    <span>Explainability Threshold</span>
                    <span className="text-white">{policy.minExplainability * 100}%</span>
                 </div>
                 <input type="range" min="0.5" max="0.95" step="0.05" value={policy.minExplainability} onChange={e => setPolicy({...policy, minExplainability: parseFloat(e.target.value)})} className="w-full accent-sher-accent h-1 bg-slate-900 rounded-full" />
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between text-[10px] font-black text-sher-muted uppercase tracking-widest">
                    <span>Max Leverage Cap</span>
                    <span className="text-white">{policy.leverageCap}x</span>
                 </div>
                 <input type="range" min="1.0" max="5.0" step="0.5" value={policy.leverageCap} onChange={e => setPolicy({...policy, leverageCap: parseFloat(e.target.value)})} className="w-full accent-purple-500 h-1 bg-slate-900 rounded-full" />
              </div>
           </div>
        </div>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-10 flex gap-8 items-start group">
         <AlertTriangle size={32} className="text-amber-500 shrink-0 mt-1" />
         <div className="space-y-3">
            <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">Regulatory Warning Shard</h4>
            <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-80">
               Changes to the Governance Core are hash-chained and stored in the immutable audit log. These policies override any neural discoveries and are the final authority in the execution pipeline.
            </p>
            <div className="pt-6 border-t border-amber-500/10 flex items-center justify-between">
               <div className="flex items-center gap-3 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                  <Fingerprint size={14} /> AUDIT LINK: SHA256-4291-B7X
               </div>
               <button className="text-[9px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 hover:underline">
                  Download Audit Pack <ChevronRight size={14} />
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AIGovernanceView;
