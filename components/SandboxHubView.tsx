
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertOctagon, Terminal, Activity, ZapOff, 
  Layers, Lock, Database, RefreshCw, BarChart3, Target,
  FileText, ShieldAlert, Cpu, Gavel, Power, PowerOff, Microscope, Info
} from 'lucide-react';
import { PilotScorecard } from '../types';

const SandboxHubView: React.FC = () => {
  const [isSandboxActive, setIsSandboxActive] = useState(true);
  const [scorecard, setScorecard] = useState<PilotScorecard>({
    disciplineScore: 94,
    vetoEfficiency: 88,
    regimeResilience: 82,
    explainabilityAudit: 'PASSED',
    survivalRating: 'ELITE'
  });

  const rejectedSignals = [
    { id: 'rej-1', symbol: 'SBIN', reason: 'High Sector Correlation (Banking Cluster > 30%)', time: '14:22:01' },
    { id: 'rej-2', symbol: 'TCS', reason: 'Probability Decay (0.64 < 0.75 floor)', time: '13:10:45' },
    { id: 'rej-3', symbol: 'RELIANCE', reason: 'Institutional Trap Filter: Low RVOL', time: '11:45:22' }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-10 pb-24 animate-in fade-in duration-700 relative">
      {/* Sandbox Watermark Overlay */}
      {isSandboxActive && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden opacity-[0.03] select-none">
           {Array.from({length: 10}).map((_, i) => (
             <div key={i} className="text-9xl font-black whitespace-nowrap -rotate-12 mb-20 uppercase tracking-[2em]">
                SANDBOX - SIMULATION ONLY - NO REAL CAPITAL
             </div>
           ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Microscope size={200} className="text-sher-accent" /></div>
        <div className="flex items-center gap-6 relative z-10">
           <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border-2 transition-all shadow-2xl ${isSandboxActive ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-900 border-border text-sher-muted'}`}>
              <Microscope size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Pilot Sandbox</h2>
              <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
                 <Lock size={12} className="text-sher-accent" /> Status: {isSandboxActive ? 'Simulation Shard Active' : 'Offline'}
              </p>
           </div>
        </div>

        <div className="flex gap-4 relative z-10">
           <button 
             onClick={() => setIsSandboxActive(!isSandboxActive)}
             className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${isSandboxActive ? 'bg-rose-500 text-white animate-pulse' : 'bg-white text-black hover:bg-sher-accent hover:text-white'}`}
           >
              {isSandboxActive ? <PowerOff size={18} /> : <Power size={18} />}
              {isSandboxActive ? 'DEACTIVATE SHARD' : 'ACTIVATE SIMULATION'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Discipline Scorecard */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Institutional Scorecard</h3>
                    <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1 italic">Validation criteria for Pilot conversion</p>
                 </div>
                 <div className="px-6 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    {scorecard.survivalRating} RATING
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 {[
                   { label: 'Discipline Score', val: scorecard.disciplineScore, unit: '%', icon: Target, d: 'Adherence to risk gates' },
                   { label: 'Veto Efficiency', val: scorecard.vetoEfficiency, unit: '%', icon: ShieldCheck, d: 'Noise rejection rate' },
                   { label: 'Explainability', val: scorecard.explainabilityAudit, unit: '', icon: FileText, d: 'Logic audit clarity' }
                 ].map(metric => (
                    <div key={metric.label} className="text-center space-y-4 group">
                       <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-sher-accent border border-white/5 mx-auto group-hover:bg-sher-accent group-hover:text-white transition-all shadow-inner">
                          <metric.icon size={24} />
                       </div>
                       <div>
                          <p className="text-4xl font-black text-white tabular-nums tracking-tighter">{metric.val}{metric.unit}</p>
                          <p className="text-[10px] text-sher-muted font-black uppercase tracking-widest mt-1">{metric.label}</p>
                       </div>
                       <p className="text-[8px] text-sher-muted uppercase opacity-40 leading-relaxed font-bold">"{metric.d}"</p>
                    </div>
                 ))}
              </div>
           </div>

           {/* Veto History Terminal */}
           <div className="bg-panel border border-border rounded-[48px] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/20">
                       <ZapOff size={20} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black text-white uppercase tracking-tight">Veto Log (Risk Rejections)</h3>
                       <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest">Process over Profit: Why signals were blocked.</p>
                    </div>
                 </div>
                 <button className="p-2 bg-slate-950 rounded-xl text-sher-muted hover:text-white border border-white/10 transition-all"><RefreshCw size={16}/></button>
              </div>
              <div className="p-8 space-y-4">
                 {rejectedSignals.map(sig => (
                    <div key={sig.id} className="p-6 bg-slate-950/50 border border-white/5 rounded-3xl flex items-center justify-between group hover:bg-slate-900 transition-colors">
                       <div className="flex items-center gap-6">
                          <div className="w-1.5 h-10 rounded-full bg-rose-500/30 group-hover:bg-rose-500 transition-all" />
                          <div>
                             <h4 className="text-sm font-black text-white uppercase tracking-widest group-hover:text-rose-400 transition-colors">{sig.symbol}</h4>
                             <p className="text-[10px] text-sher-muted font-medium uppercase tracking-tight italic mt-1">"{sig.reason}"</p>
                          </div>
                       </div>
                       <span className="text-[9px] font-mono font-bold text-sher-muted uppercase bg-black/40 px-3 py-1 rounded-lg">{sig.time} UTC</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right Panel: Pilot Config */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Terminal size={18} className="text-sher-accent" /> Sandbox Parameters
              </h3>
              
              <div className="space-y-6">
                 {[
                   { label: 'Risk Gate Threshold', val: '75%', color: 'text-sher-accent' },
                   { label: 'Max Sector Sharding', val: '30%', color: 'text-amber-400' },
                   { label: 'Latency Mock', val: '42ms', color: 'text-emerald-400' },
                   { label: 'Data Source', val: 'NSE_LIVE_MOCK', color: 'text-emerald-400' }
                 ].map(p => (
                   <div key={p.label} className="p-5 bg-slate-950 rounded-[32px] border border-white/5 flex items-center justify-between group hover:bg-slate-900 transition-all">
                      <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">{p.label}</span>
                      <span className={`text-[11px] font-black tabular-nums ${p.color}`}>{p.val}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-sher-accent to-blue-700 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Database size={120} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Pilot Report</h3>
              <p className="text-[11px] font-bold leading-relaxed uppercase tracking-wider opacity-80 mb-10">
                Sandbox performance logs are cryptographically sharded. Every decision and VETO can be audited against exchange tape history.
              </p>
              <button className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3">
                 <FileText size={18} /> Export Process Audit
              </button>
           </div>

           <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl flex items-start gap-4">
              <ShieldAlert size={24} className="text-amber-500 shrink-0 mt-1" />
              <div>
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Audit Transparency</h4>
                 <p className="text-[9px] text-sher-muted font-bold uppercase mt-2 leading-relaxed italic">
                   All sandbox activity is logged via Hash-Chaining (SHA-256) to ensure no historical logic tampering occurred during the pilot phase.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SandboxHubView;
