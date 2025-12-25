

import React, { useState } from 'react';
// Fix: Added Microscope to imports from lucide-react to resolve "Cannot find name 'Microscope'" error on line 92.
import { 
  ShieldCheck, Gavel, Landmark, Target, Activity, 
  ArrowRight, CheckCircle2, Lock, Fingerprint, 
  BrainCircuit, Layers, ShieldAlert, HeartPulse, Microscope
} from 'lucide-react';

interface InstitutionalOnboardingProps {
  onComplete: () => void;
}

const InstitutionalOnboarding: React.FC<InstitutionalOnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState({ risk: false, governance: false, fiduciary: false });

  const isConsentValid = consent.risk && consent.governance && consent.fiduciary;

  return (
    <div className="fixed inset-0 bg-[#0e1117] z-[150] flex items-center justify-center p-4 font-sans select-none overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-3xl w-full bg-panel border border-border rounded-[56px] p-12 lg:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col items-center text-center">
         {/* Progress Node */}
         <div className="flex gap-4 mb-16">
            {[1, 2, 3, 4].map(s => (
               <div key={s} className={`w-3 h-3 rounded-full transition-all duration-500 ${step >= s ? 'bg-sher-accent shadow-[0_0_10px_#3b82f6]' : 'bg-slate-800'}`} />
            ))}
         </div>

         {step === 1 && (
           <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="w-24 h-24 bg-sher-accent/10 rounded-[32px] flex items-center justify-center text-sher-accent border-2 border-sher-accent/20 mx-auto shadow-inner">
                 <Landmark size={48} />
              </div>
              <div className="space-y-4">
                 <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter italic">The Shard of <span className="text-sher-accent not-italic">Governance.</span></h2>
                 <p className="text-lg text-sher-muted max-w-lg mx-auto font-medium leading-relaxed uppercase tracking-tight">Welcome to the Institutional Tier. Sher AI operates under strict risk sharding protocols designed for capital survival.</p>
              </div>
              <button onClick={() => setStep(2)} className="w-full py-6 bg-white text-black rounded-[28px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95 flex items-center justify-center gap-4 group">
                 INITIALIZE AUDIT PATH <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
         )}

         {step === 2 && (
           <div className="space-y-12 animate-in fade-in slide-in-from-right-10 duration-700 w-full">
              <div className="flex items-center gap-6 justify-center">
                 <Gavel size={40} className="text-sher-accent" />
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Legal Handshake</h2>
              </div>
              <div className="space-y-4 max-w-xl mx-auto">
                 {[
                   { id: 'risk', label: 'I accept that all AI decisions are probabilistic.', icon: ShieldAlert },
                   { id: 'governance', label: 'I acknowledge the Risk Engine has final VETO power.', icon: Lock },
                   { id: 'fiduciary', label: 'I maintain full sovereignty over live execution.', icon: Fingerprint }
                 ].map(c => (
                    <label key={c.id} className="flex items-center gap-6 p-6 bg-slate-950 border border-white/5 rounded-[32px] cursor-pointer group hover:border-sher-accent/30 transition-all text-left">
                       <input 
                         type="checkbox" 
                         checked={(consent as any)[c.id]} 
                         onChange={e => setConsent({...consent, [c.id]: e.target.checked})}
                         className="w-8 h-8 rounded-xl bg-slate-900 border-white/10 text-sher-accent focus:ring-0 focus:ring-offset-0" 
                       />
                       <div>
                          <p className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                             <c.icon size={14} className="text-sher-accent" /> {c.label}
                          </p>
                       </div>
                    </label>
                 ))}
              </div>
              <button 
                onClick={() => setStep(3)} 
                disabled={!isConsentValid}
                className="w-full py-6 bg-white text-black rounded-[28px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl transition-all disabled:opacity-20 flex items-center justify-center gap-4"
              >
                 VERIFY CONSENT NODES
              </button>
           </div>
         )}

         {step === 3 && (
           <div className="space-y-12 animate-in fade-in slide-in-from-right-10 duration-700 w-full">
              <div className="flex items-center gap-6 justify-center">
                 <Layers size={40} className="text-purple-400" />
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Operational Sharding</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                 {[
                    { t: 'Isolated Sandbox', d: 'Zero-capital simulation for process validation.', icon: Microscope },
                    { t: 'Explainable AI', d: 'Every probability includes causal reasoning logs.', icon: BrainCircuit },
                    { t: 'Audit Integrity', d: 'Immutable hash-chaining of all nodal actions.', icon: ShieldCheck },
                    { t: 'Firm Controls', d: 'Global firm-wide VaR and DD hard-stops.', icon: HeartPulse }
                 ].map(item => (
                    <div key={item.t} className="p-8 bg-slate-950 rounded-[40px] border border-white/5 space-y-4 group hover:border-sher-accent/20 transition-all">
                       <div className="p-3 bg-white/5 rounded-2xl w-fit text-sher-accent group-hover:bg-sher-accent group-hover:text-white transition-all shadow-inner"><item.icon size={20} /></div>
                       <h4 className="text-xs font-black text-white uppercase tracking-widest">{item.t}</h4>
                       <p className="text-[10px] text-sher-muted leading-relaxed font-bold uppercase opacity-60">"{item.d}"</p>
                    </div>
                 ))}
              </div>
              <button onClick={() => setStep(4)} className="w-full py-6 bg-sher-accent text-white rounded-[28px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-95">
                 DEPLOY PILOT NODE
              </button>
           </div>
         )}

         {step === 4 && (
           <div className="space-y-12 animate-in zoom-in-95 duration-1000 py-10 w-full">
              <div className="w-28 h-28 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border-2 border-emerald-500 mx-auto shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                 <CheckCircle2 size={64} className="animate-in slide-in-from-top-4" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Audit Ready.</h2>
                 <p className="text-lg text-sher-muted font-black max-sm-auto uppercase tracking-widest leading-loose">Identity sharded. Welcome to the <span className="text-emerald-400">Master Node Core.</span></p>
              </div>
              <button onClick={onComplete} className="w-full py-7 bg-white text-black rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95">
                 ENTER TERMINAL
              </button>
           </div>
         )}

         <div className="mt-16 pt-8 border-t border-white/5 w-full flex justify-between items-center opacity-40 grayscale group-hover:grayscale-0 transition-all">
            <div className="flex items-center gap-3">
               <ShieldCheck size={20} className="text-emerald-500" />
               <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">FIPS 140-2 ENCRYPTED</span>
            </div>
            <p className="text-[8px] font-black text-sher-muted uppercase">SHER AI QUANT LABS v4.5 STABLE</p>
         </div>
      </div>
    </div>
  );
};

export default InstitutionalOnboarding;