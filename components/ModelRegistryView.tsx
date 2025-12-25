
import React, { useState } from 'react';
import { modelGovernance } from '../lib/services/modelGovernance';
import { 
  Cpu, History, CheckCircle2, AlertTriangle, RefreshCw, 
  ChevronRight, Database, Fingerprint, Activity, Clock, ShieldCheck
} from 'lucide-react';
import { ModelMetadata } from '../types';

const ModelRegistryView: React.FC = () => {
  const models = modelGovernance.getRegistry();

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu size={180} className="text-white" /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
            <RefreshCw size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Model Versioning</h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Neural Core Lifecycle Registry</p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-black/40 px-6 py-4 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-sher-muted uppercase mb-1 text-right">Core Engine</p>
              <p className="text-lg font-black text-emerald-400 tabular-nums">V4.2.1-STABLE</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {models.map(model => (
          <div key={model.id} className="bg-panel border border-border rounded-[40px] p-10 flex flex-col lg:flex-row items-center justify-between gap-12 group hover:border-sher-accent/30 transition-all shadow-2xl relative overflow-hidden">
             <div className="flex items-center gap-8 w-full lg:w-auto">
                <div className="w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center text-sher-muted border border-white/5 shadow-inner">
                   <Database size={24} />
                </div>
                <div>
                   <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-black text-white uppercase tracking-tight italic">{model.id}</h4>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${model.status === 'PRODUCTION' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>
                        {model.status}
                      </span>
                   </div>
                   <p className="text-[10px] font-black text-sher-muted uppercase tracking-[0.3em] mt-2">{model.architecture}</p>
                </div>
             </div>

             <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 w-full lg:w-auto px-8 border-l border-white/5">
                <div>
                   <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1 flex items-center gap-1.5"><History size={12}/> Version</p>
                   <p className="text-sm font-black text-white uppercase">{model.version}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={12}/> Trained Window</p>
                   <p className="text-sm font-black text-white uppercase">{model.trainedOn}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1 flex items-center gap-1.5"><ShieldCheck size={12}/> Validation</p>
                   <p className="text-sm font-black text-emerald-400 uppercase">Audit Verified</p>
                </div>
             </div>

             <div className="w-full lg:w-auto flex flex-col items-center lg:items-end gap-3">
                <div className="flex items-center gap-3 text-[9px] font-black text-sher-muted uppercase tracking-widest bg-slate-950 px-4 py-2 rounded-xl border border-white/5">
                   <Fingerprint size={12} className="text-sher-accent" /> HASH: {model.featureHash}
                </div>
                <button className="text-[10px] font-black text-white uppercase tracking-[0.3em] hover:text-sher-accent transition-all flex items-center gap-2">
                   Lifecycle Audit <ChevronRight size={14} />
                </button>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-10 flex gap-8 items-start group">
         <AlertTriangle size={32} className="text-amber-500 shrink-0 mt-1" />
         <div className="space-y-4">
            <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">Model Integrity Shard</h4>
            <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-80">
               Direct swapping of AI models in production is restricted by the Sovereign Governance Layer. Every model update requires a 48-hour 'Shadow Shard' validation phase before achieving PRODUCTION status. Audit trails are hash-chained and immutable.
            </p>
            <div className="pt-4 flex items-center gap-6 border-t border-white/5">
               <div className="flex items-center gap-2 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                  <CheckCircle2 size={14} /> NO DATA LEAKAGE DETECTED
               </div>
               <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  <Activity size={14} /> DRIFT MONITOR: STABLE
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ModelRegistryView;
