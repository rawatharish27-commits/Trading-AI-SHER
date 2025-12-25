
import React, { useState } from 'react';
import { ShieldCheck, Scale, Gavel, Eye, FileText, Download, Lock, CheckCircle2, ChevronRight, Landmark } from 'lucide-react';

const LegalCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TC' | 'PRIVACY'>('TC');

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Scale size={160} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Sovereign <span className="text-sher-accent not-italic">Legal Node</span></h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">v4.20 Institutional Framework</p>
          </div>
        </div>
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 relative z-10">
           {(['TC', 'PRIVACY'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-sher-accent text-white shadow-xl shadow-sher-accent/20' : 'text-sher-muted hover:text-white'}`}
             >
               {tab === 'TC' ? 'Terms & Conditions' : 'Privacy Policy'}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-panel border border-border rounded-[48px] p-12 lg:p-20 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-[0.01] pointer-events-none"><Gavel size={400} /></div>
         
         <div className="space-y-16 relative z-10">
            {activeTab === 'TC' ? (
               <div className="space-y-12 prose prose-invert max-w-none">
                  <div className="space-y-4">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight italic border-l-4 border-sher-accent pl-6 py-1">01. Nature of Service</h3>
                     <p className="text-sm text-sher-muted leading-relaxed uppercase tracking-wider font-medium opacity-80">
                        The Platform provides <span className="text-white">probabilistic market analysis and alerts only</span>. It does not provide investment advice, portfolio management, or guaranteed returns. Sher AI is a quantitative software framework, not a SEBI-registered RIA/PMS.
                     </p>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight italic border-l-4 border-sher-accent pl-6 py-1">02. Limitation of Liability</h3>
                     <p className="text-sm text-sher-muted leading-relaxed uppercase tracking-wider font-medium opacity-80">
                        In no event shall Sher AI Labs be liable for financial losses arising from market activity, execution delays, or model behavior. All trade authorization remains the <span className="text-white">sole sovereignty of the user</span>.
                     </p>
                  </div>
               </div>
            ) : (
               <div className="space-y-12 prose prose-invert max-w-none">
                  <div className="space-y-4">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight italic border-l-4 border-purple-500 pl-6 py-1">01. Cryptographic Sharding</h3>
                     <p className="text-sm text-sher-muted leading-relaxed uppercase tracking-wider font-medium opacity-80">
                        User broker tokens and secrets are <span className="text-white">AES-256 GCM encrypted</span> on the local device before transmission. We maintain zero-knowledge of raw private keys.
                     </p>
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tight italic border-l-4 border-purple-500 pl-6 py-1">02. Data Minimization</h3>
                     <p className="text-sm text-sher-muted leading-relaxed uppercase tracking-wider font-medium opacity-80">
                        We collect only high-level usage metrics and audit logs required for institutional compliance. <span className="text-white">No personal data is ever sold or shared</span> with third-party advertising nodes.
                     </p>
                  </div>
               </div>
            )}
         </div>

         <div className="pt-20 mt-20 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
            <div className="flex items-center gap-3">
               <Lock size={18} className="text-emerald-500" />
               <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em]">SHA256: 8x21-FB-92 (Legally Verified)</p>
            </div>
            <button className="px-10 py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-sher-accent hover:text-white transition-all shadow-xl">
               Download Institutional Pack (.PDF)
            </button>
         </div>
      </div>
    </div>
  );
};

export default LegalCenterView;
