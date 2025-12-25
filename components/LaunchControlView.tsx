
import React, { useState } from 'react';
import { Rocket, ShieldCheck, Lock, Activity, Power, Terminal, AlertTriangle, CheckCircle2, Server, Database, Globe, RefreshCw, Undo2, ShieldAlert } from 'lucide-react';
import { LaunchStep } from '../types';

const LaunchControlView: React.FC = () => {
  const [steps, setSteps] = useState<LaunchStep[]>([
    { id: '1', category: 'TECH', label: 'Neural Core Build', status: 'VERIFIED', description: 'Production v4.2.1 sharding stable.' },
    { id: '2', category: 'LEGAL', label: 'Risk Disclosures', status: 'VERIFIED', description: 'SEBI/GDPR safe language live.' },
    { id: '3', category: 'TECH', label: 'Kill Switch Handshake', status: 'VERIFIED', description: 'Global emergency halt dual-key verified.' },
    { id: '4', category: 'OPS', label: 'Disaster Recovery', status: 'VERIFIED', description: 'RTO < 30m drill successful.' },
    { id: '5', category: 'SEC', label: 'RLS Policies', status: 'VERIFIED', description: 'DB-level client isolation active.' }
  ]);

  const stats = { uptime: '99.98%', latency: 42, rto: '24m', rpo: '4m' };

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Rocket size={200} className="text-sher-accent" /></div>
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20 shadow-2xl">
              <Power size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Launch Control</h2>
              <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Institutional Readiness Hub</p>
           </div>
        </div>
        <div className="flex bg-black/40 px-8 py-6 rounded-3xl border border-white/5 relative z-10 gap-12">
           <div className="text-center">
              <p className="text-[8px] font-black text-sher-muted uppercase mb-1">RTO (Recovery)</p>
              <p className="text-xl font-black text-emerald-400">{stats.rto}</p>
           </div>
           <div className="text-center">
              <p className="text-[8px] font-black text-sher-muted uppercase mb-1">RPO (Data Loss)</p>
              <p className="text-xl font-black text-emerald-400">{stats.rpo}</p>
           </div>
           <button className="p-3 bg-slate-900 rounded-xl text-sher-muted hover:text-white border border-white/10"><RefreshCw size={20}/></button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 px-4">
               <Terminal size={18} className="text-sher-accent" /> Pre-Flight Node Registry
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
               {steps.map(step => (
                 <div key={step.id} className="bg-panel border border-border rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-sher-accent/20 transition-all shadow-xl">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 ${
                         step.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-500'
                       }`}>
                          {step.status === 'VERIFIED' ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                       </div>
                       <div>
                          <div className="flex items-center gap-3">
                             <h4 className="text-lg font-black text-white uppercase tracking-tight">{step.label}</h4>
                             <span className="text-[8px] font-black bg-slate-900 text-gray-500 px-1.5 py-0.5 rounded border border-white/5">{step.category}</span>
                          </div>
                          <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1">"{step.description}"</p>
                       </div>
                    </div>
                    <button className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-white hover:bg-sher-accent transition-all">Audit Shard</button>
                 </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <div className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl space-y-10">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                  <Undo2 size={18} className="text-sher-accent" /> Recovery State
               </h3>
               <div className="space-y-6">
                  {[
                    { l: 'PITR Window', v: '7 Days', c: 'text-emerald-400', i: Database },
                    { l: 'Backup Drift', v: '0.00%', c: 'text-emerald-400', i: Activity },
                    { l: 'Failover Region', v: 'SG-CORE', c: 'text-sher-accent', i: Globe }
                  ].map(m => (
                    <div key={m.l} className="p-5 bg-slate-950 rounded-[32px] border border-white/5 flex items-center justify-between group hover:bg-slate-900 transition-colors">
                       <div className="flex items-center gap-3">
                          <m.i size={16} className="text-sher-accent" />
                          <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">{m.l}</span>
                       </div>
                       <span className={`text-[11px] font-black tabular-nums ${m.c}`}>{m.v}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-gradient-to-br from-sher-accent to-blue-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Rocket size={120} /></div>
               <h3 className="text-2xl font-black uppercase tracking-tighter mb-6 italic">Commit Launch</h3>
               <p className="text-[11px] font-bold leading-relaxed uppercase tracking-wider opacity-80 mb-10">
                 Committing the launch shard will open the public terminal gates and engage production billing. All pre-flight nodes must be VERIFIED.
               </p>
               <button className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3">
                  INITIALIZE PRODUCTION SHARD
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default LaunchControlView;
