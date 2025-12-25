import React, { useState } from 'react';
import { 
  Zap, 
  ShieldAlert, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  Award,
  CheckCircle2,
  Layout,
  Target,
  BrainCircuit,
  Lock,
  Fingerprint,
  Scale
} from 'lucide-react';

interface OnboardingViewProps {
  onComplete: (data: { capital: number; mode: 'DEMO' | 'LIVE' }) => void;
}

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState({ risk: false, info: false, noGuarantee: false, sovereignty: false });

  const isConsentComplete = agreed.risk && agreed.info && agreed.noGuarantee && agreed.sovereignty;

  return (
    <div className="fixed inset-0 bg-[#0e1117] z-[200] flex items-center justify-center p-4 font-sans select-none">
      <div className="max-w-2xl w-full bg-panel border-2 border-sher-accent/20 rounded-[48px] p-8 lg:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900">
          <div 
            className="h-full bg-sher-accent transition-all duration-700 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* 01. Legal Handshake */}
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1 flex flex-col justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-sher-accent/10 rounded-[32px] flex items-center justify-center text-sher-accent border-2 border-sher-accent/20 mx-auto shadow-inner">
                 <Scale size={40} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Legal <span className="text-sher-accent not-italic">Handshake</span></h2>
              <p className="text-sher-muted font-bold uppercase tracking-widest text-[10px]">Institutional Access Authorization Protocol</p>
            </div>

            <div className="space-y-3">
               {[
                 { id: 'risk', label: 'I accept derivatives trading involves high market risk.', icon: ShieldAlert },
                 { id: 'info', label: 'I acknowledge AI signals are for information only.', icon: BrainCircuit },
                 { id: 'noGuarantee', label: 'I understand Sher AI provides no profit guarantees.', icon: Sparkles },
                 { id: 'sovereignty', label: 'I maintain sole sovereignty over execution shards.', icon: Fingerprint }
               ].map(c => (
                 <label key={c.id} className="flex items-center gap-4 cursor-pointer p-6 bg-slate-950 rounded-3xl border border-white/5 hover:border-sher-accent/30 transition-all group">
                    <input 
                      type="checkbox" 
                      checked={(agreed as any)[c.id]} 
                      onChange={(e) => setAgreed({...agreed, [c.id]: e.target.checked})}
                      className="w-8 h-8 rounded-xl bg-slate-900 text-sher-accent border-white/10 focus:ring-0 focus:ring-offset-0" 
                    />
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                        <c.icon size={14} className="text-sher-accent" /> {c.label}
                      </p>
                    </div>
                 </label>
               ))}
            </div>
            <button 
              onClick={() => setStep(2)} 
              disabled={!isConsentComplete} 
              className="w-full bg-white text-black py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs transition-all disabled:opacity-10 shadow-2xl flex items-center justify-center gap-3"
            >
              Verify Legal Node <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* 02. System Blueprint */}
        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 flex-1 flex flex-col justify-center">
             <div className="flex items-center gap-6 justify-center">
                <Layout className="text-sher-accent" size={40} />
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Process Audit</h2>
             </div>
             <div className="grid grid-cols-1 gap-4">
                {[
                  { i: Target, t: 'Calibrated Probability', d: 'Signals are sharded through multi-factor logistic models.' },
                  { i: ShieldCheck, t: 'Risk Governance', d: 'Automated 1% risk rule and sector neutral caps.' },
                  { i: Lock, t: 'Vault Sovereignty', d: 'Credentials remain sharded on your local node hardware.' }
                ].map(item => (
                  <div key={item.t} className="flex items-center gap-8 p-8 bg-slate-900/50 rounded-[40px] border border-white/5 group hover:border-sher-accent/20 transition-all">
                     <div className="p-4 bg-white/5 rounded-2xl text-sher-accent group-hover:bg-sher-accent group-hover:text-white transition-all shadow-inner"><item.i size={24} /></div>
                     <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">{item.t}</h4>
                        <p className="text-[10px] text-sher-muted mt-2 font-bold uppercase tracking-tight opacity-70 leading-relaxed">"{item.d}"</p>
                     </div>
                  </div>
                ))}
             </div>
             <button onClick={() => setStep(3)} className="w-full bg-sher-accent text-white py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-xl active:scale-95">
                Confirm System Map
             </button>
          </div>
        )}

        {/* 03. Identity Provisioned */}
        {step === 3 && (
          <div className="space-y-12 animate-in zoom-in-95 duration-1000 text-center py-20 flex-1 flex flex-col justify-center items-center">
             <div className="w-32 h-32 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <ShieldCheck size={72} className="animate-in slide-in-from-top-4" />
             </div>
             <div className="space-y-4">
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Identity Established.</h2>
                <p className="text-xl text-sher-muted font-bold max-w-sm mx-auto uppercase tracking-widest leading-loose">
                   Node authorized for <span className="text-emerald-400">Sovereign Alpha</span> sharding. 
                </p>
             </div>
             <button onClick={() => setStep(4)} className="w-full bg-white text-black py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs shadow-2xl active:scale-95">
                Deploy Shard
             </button>
          </div>
        )}

        {/* 04. Final Launch */}
        {step === 4 && (
          <div className="space-y-10 animate-in fade-in duration-1000 flex-1 flex flex-col justify-center">
             <div className="bg-gradient-to-br from-panel to-slate-900 border-2 border-sher-accent/40 p-12 rounded-[56px] text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={140} className="text-sher-accent" /></div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tight italic leading-none">Ready for <br/> Live Intelligence.</h3>
                <p className="text-sm text-sher-muted font-medium uppercase tracking-widest leading-relaxed">
                   Your node is configured for Institutional Discretion. Every signal is auditable via your compliance ledger.
                </p>
                <button onClick={() => onComplete({ capital: 250000, mode: 'DEMO' })} className="w-full bg-white text-black py-7 rounded-[32px] font-black uppercase tracking-[0.4em] text-xs hover:bg-sher-accent hover:text-white transition-all shadow-xl shadow-black">
                   Launch Sovereign Node
                </button>
             </div>
             <p className="text-center text-[8px] font-black text-sher-muted uppercase tracking-[0.6em] opacity-40">
                Encrypted via FIPS 140-2 Standard Sharding
             </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default OnboardingView;