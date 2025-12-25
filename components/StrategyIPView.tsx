
import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Fingerprint, Activity, Zap, 
  Terminal, ShieldAlert, Cpu, Database, EyeOff, 
  Layers, Key, Shield
} from 'lucide-react';

const StrategyIPView: React.FC = () => {
  const [obfuscation, setObfuscation] = useState('INSTITUTIONAL');

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Shield size={200} className="text-white" /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Strategy IP Shield</h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Firm-Wide Logic Sovereignty</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl space-y-10">
               <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <Database size={24} className="text-sher-accent" /> Sandboxed Runtime
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { t: 'Isolated Worker Node', d: 'Strategy logic executes in a restricted environment with zero direct DB/Network access.', active: true },
                    { t: 'Time-Boxed Execution', d: 'Signals must be generated within 50ms or execution shard is auto-terminated.', active: true },
                    { t: 'Obfuscated Dispatch', d: 'Order signals are watermarked and encrypted before leaving the node.', active: true },
                    { t: 'License Watermarking', d: 'Every log entry contains the strategy ID and authorized license key shard.', active: true }
                  ].map(p => (
                    <div key={p.t} className="p-8 bg-slate-950 rounded-3xl border border-white/5 group hover:bg-slate-900 transition-colors">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-black text-white uppercase tracking-tight">{p.t}</h4>
                          <ShieldCheck size={16} className="text-emerald-500" />
                       </div>
                       <p className="text-[10px] text-sher-muted font-medium leading-relaxed uppercase opacity-70">"{p.d}"</p>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl">
               <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Node Obfuscation Matrix</h3>
               <div className="grid grid-cols-3 gap-6">
                  {['NONE', 'BASIC', 'INSTITUTIONAL'].map(level => (
                    <button 
                      key={level}
                      onClick={() => setObfuscation(level)}
                      className={`p-10 rounded-[32px] border-2 transition-all text-center relative overflow-hidden group ${obfuscation === level ? 'border-sher-accent bg-slate-950' : 'border-border bg-slate-900 hover:border-gray-600'}`}
                    >
                       <EyeOff size={32} className={`mx-auto mb-4 ${obfuscation === level ? 'text-sher-accent' : 'text-slate-700'}`} />
                       <p className="text-[10px] font-black uppercase tracking-widest text-white">{level}</p>
                       {obfuscation === level && (
                         <div className="absolute top-4 right-4 text-sher-accent animate-pulse"><ShieldCheck size={16} /></div>
                       )}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-8">
            <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl flex flex-col items-center text-center space-y-8">
               <div className="w-20 h-20 bg-sher-accent/10 rounded-[28px] flex items-center justify-center text-sher-accent border border-sher-accent/20">
                  <Fingerprint size={40} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tighter">Sovereign Watermark</h4>
                  <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-2 leading-relaxed px-4">
                    Logic ID: EMA-PB-V4 <br/> 
                    Shard Hash: 8X72-AL-F9
                  </p>
               </div>
               <div className="w-full pt-8 border-t border-white/5 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-sher-muted">Integrity Node</span>
                     <span className="text-emerald-500">100% SECURE</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                     <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '100%' }} />
                  </div>
               </div>
            </div>

            <div className="bg-gradient-to-br from-sher-accent to-purple-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Key size={120} /></div>
               <h3 className="text-2xl font-black uppercase tracking-tighter italic mb-6">IP Shield Active</h3>
               <p className="text-[11px] font-bold leading-relaxed uppercase tracking-wider opacity-80 mb-8">
                 Proprietary strategy logic is never sent to the UI. The dashboard only receives high-level alpha labels. The raw codebase is encrypted at the storage shard level.
               </p>
               <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-100 transition-all">
                  Request IP Audit Shard
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StrategyIPView;
