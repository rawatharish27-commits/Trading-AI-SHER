import React, { useState } from 'react';
import { 
  Calendar, CheckCircle2, ClipboardCheck, Lock, ShieldCheck, 
  Zap, FileText, Landmark, Gavel, ArrowRight, Printer, 
  Download, Activity, Target, ShieldAlert, Cpu, Globe, BrainCircuit,
  // Added Fingerprint to resolve "Cannot find name 'Fingerprint'" error
  Fingerprint
} from 'lucide-react';

const SovereignOperatingDoc: React.FC = () => {
  const [activeShard, setActiveShard] = useState<'ROADMAP' | 'REVENUE' | 'AUDIT' | 'LEGAL'>('ROADMAP');

  const handlePrint = () => {
    window.print();
  };

  const roadmap = [
    {
      phase: "PHASE 01: FOUNDATION",
      goal: "Safety & Reliability",
      color: "text-rose-400",
      milestones: [
        { label: "Infrastructure Hardening", desc: "Cloud Run sharding, RLS database policies, and hardware-level kill-switch integration." },
        { label: "Market Connectivity", desc: "Real-time binary stream decoding from NSE/BSE gateways via SmartStream v2." }
      ]
    },
    {
      phase: "PHASE 02: INTELLIGENCE",
      goal: "Neural Alpha Core",
      color: "text-sher-accent",
      milestones: [
        { label: "Bayesian Engine", desc: "Ensemble probability scoring sharding technical and orderflow evidence into conviction nodes." },
        { label: "Gemini Alpha Auditor", desc: "Generative reasoning layer to explain 'Why' every signal meets institutional standards." }
      ]
    },
    {
      phase: "PHASE 03: BUSINESS",
      goal: "Scale & Sovereignty",
      color: "text-emerald-400",
      milestones: [
        { label: "Institutional Sharding", desc: "Multi-account tranches, white-label branding, and hash-chained audit ledgers." },
        { label: "Sovereign Dispatch", desc: "Alert-only vs Auto-exec modes sharded by user jurisdiction and compliance level." }
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700 print:bg-white print:p-0">
      
      {/* 🏛️ INSTITUTIONAL HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/40 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden print:border-black print:rounded-none print:bg-white">
        <div className="absolute top-0 right-0 p-8 opacity-5 print:hidden"><Landmark size={240} /></div>
        <div className="relative z-10 flex items-center gap-8">
           <div className="w-16 h-16 bg-sher-accent/10 rounded-inst flex items-center justify-center text-sher-accent border border-sher-accent/20 print:border-black">
              <ClipboardCheck size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic print:text-black">Sovereign A–Z Roadmap</h2>
              <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 print:text-gray-500">Operating System Blueprint v4.6-STABLE</p>
           </div>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10 gap-3 print:hidden">
           <button onClick={handlePrint} className="p-3 bg-white text-black rounded-xl hover:bg-sher-accent hover:text-white transition-all"><Printer size={18}/></button>
           {(['ROADMAP', 'REVENUE', 'AUDIT', 'LEGAL'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveShard(tab)}
               className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeShard === tab ? 'bg-sher-accent text-white shadow-xl shadow-sher-accent/20' : 'text-sher-muted hover:text-white'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {activeShard === 'ROADMAP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 print:grid-cols-1">
           {roadmap.map(item => (
             <div key={item.phase} className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl flex flex-col space-y-10 relative overflow-hidden group print:border-black print:bg-white print:shadow-none">
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:scale-110 transition-transform print:hidden"><Cpu size={120}/></div>
                <div>
                   <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 ${item.color} print:text-black`}>{item.phase}</p>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic print:text-black">{item.goal}</h3>
                </div>
                <div className="space-y-8 flex-1">
                   {item.milestones.map(m => (
                     <div key={m.label} className="space-y-3 group/m">
                        <div className="flex items-center gap-3">
                           <div className={`w-1.5 h-1.5 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`} />
                           <p className="text-sm font-black text-white uppercase tracking-widest print:text-black">{m.label}</p>
                        </div>
                        <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase opacity-70 group-hover/m:opacity-100 transition-opacity">"{m.desc}"</p>
                     </div>
                   ))}
                </div>
             </div>
           ))}
        </div>
      )}

      {/* Rest of the document remains sharded by tabs... */}
      {activeShard === 'AUDIT' && (
         <div className="bg-panel border border-border rounded-[48px] p-12 shadow-2xl space-y-12 animate-in fade-in">
            <div className="flex items-center gap-6 border-b border-white/5 pb-8">
               <div className="p-4 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20 shadow-inner">
                  <Fingerprint size={32} />
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Compliance Node Shard</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                     <Lock size={16} className="text-sher-accent" /> Security Protocol
                  </h4>
                  <p className="text-sm text-sher-muted leading-loose font-medium uppercase tracking-wide opacity-80 italic">
                    "Every user decision and risk event is cryptographically sharded using SHA-256 hash chaining. We maintain a zero-trust model where broker secrets are encrypted on-device before transmission."
                  </p>
               </div>
               <div className="space-y-6">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3">
                     <ShieldCheck size={16} className="text-emerald-400" /> Regulatory Alignment
                  </h4>
                  <p className="text-sm text-sher-muted leading-loose font-medium uppercase tracking-wide opacity-80 italic">
                    "Architecture matches SEBI's definition of API-based execution. Mandatory human-in-the-loop authorization for all live order dispatches ensures no-PMS regulatory status."
                  </p>
               </div>
            </div>
         </div>
      )}

      {/* Print Overlay CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default SovereignOperatingDoc;