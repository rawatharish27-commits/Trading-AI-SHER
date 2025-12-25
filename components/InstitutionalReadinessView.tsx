
import React, { useState } from 'react';
import { 
  ShieldCheck, BrainCircuit, Activity, Zap, 
  Layers, Lock, Database, RefreshCw, BarChart3, 
  Target, Info, CheckCircle2, ChevronRight, Gavel,
  Calendar, Clock, AlertTriangle, ShieldAlert
} from 'lucide-react';

const InstitutionalReadinessView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'CALENDAR'>('AUDIT');

  const phases = [
    { id: 'P0', label: 'Phase 0: Safety', desc: 'Hard-coded guards', status: 'PASS', score: 100 },
    { id: 'P1', label: 'Phase 1: Brain', desc: 'Bayesian core', status: 'PASS', score: 94 },
    { id: 'P3', label: 'Phase 3: Money', desc: 'Sizing & Portfolio', status: 'PASS', score: 88 },
    { id: 'P6', label: 'Phase 6: Business', desc: 'Audit & Compliance', status: 'WARN', score: 72 }
  ];

  const calendar = [
    { month: 'MONTH 1', goal: 'FOUNDATION & SAFETY', color: 'text-rose-400', items: ['ENV validation', 'Kill-switch tested', 'Bayesian core v1', 'NO-TRADE logic'] },
    { month: 'MONTH 2', goal: 'INTELLIGENCE & LEARNING', color: 'text-amber-400', items: ['Trade memory', 'Drift detection', 'Regime-wise learning', 'Chaos drills'] },
    { month: 'MONTH 3', goal: 'BUSINESS & SCALE', color: 'text-emerald-400', items: ['Compliance nodes', 'Explainable AI', 'Investor dashboard', 'Full GO-LIVE'] }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden gap-8">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck size={240} /></div>
        <div className="relative z-10 flex items-center gap-6">
           <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
              <ShieldCheck size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Readiness Shard</h2>
              <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 italic">Institutional Deployment Audit v4.5</p>
           </div>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10">
           {(['AUDIT', 'CALENDAR'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-sher-accent text-white shadow-xl shadow-sher-accent/20' : 'text-sher-muted hover:text-white'}`}
             >
               {tab} VIEW
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'AUDIT' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
           {phases.map(p => (
             <div key={p.id} className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl flex items-center justify-between group hover:border-sher-accent/30 transition-all">
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner ${p.status === 'PASS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {p.status === 'PASS' ? <CheckCircle2 size={24}/> : <ShieldAlert size={24}/>}
                   </div>
                   <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">{p.label}</h4>
                      <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest italic">{p.desc}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className={`text-2xl font-black tabular-nums tracking-tighter ${p.status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>{p.score}%</p>
                   <span className="text-[8px] font-black text-sher-muted uppercase">Shard Integrity</span>
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in zoom-in-95">
           {calendar.map(col => (
             <div key={col.month} className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl flex flex-col space-y-8 relative overflow-hidden group hover:border-sher-accent/20 transition-all">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:scale-110 transition-transform"><Calendar size={80}/></div>
                <div className="space-y-1">
                   <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${col.color}`}>{col.month}</p>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-tight italic">{col.goal}</h3>
                </div>
                <div className="space-y-4 flex-1">
                   {col.items.map(item => (
                     <div key={item} className="flex items-center gap-4 bg-black/30 p-4 rounded-2xl border border-white/5 group-hover:bg-slate-900 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-sher-accent" />
                        <span className="text-[11px] font-bold text-gray-300 uppercase tracking-widest leading-none">{item}</span>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-sher-accent to-[#1E3A8A] rounded-[48px] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Gavel size={200} /></div>
         <div className="flex-1 space-y-4 relative z-10">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic">Ready to Shard?</h3>
            <p className="text-sm font-medium leading-relaxed uppercase tracking-wider opacity-80">
              When all Phase items reach <span className="text-white font-black">PASS</span>, the system is authorized for production deployment. Total aggregate readiness: <span className="text-emerald-400 font-black">88%</span>.
            </p>
         </div>
         <button className="px-10 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 relative z-10">
            Export Deployment Pack <ChevronRight size={18} />
         </button>
      </div>
    </div>
  );
};

export default InstitutionalReadinessView;
