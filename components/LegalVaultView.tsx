
import React, { useState } from 'react';
import { 
  ShieldAlert, FileText, Scale, Gavel, Eye, Globe, Lock, 
  ShieldCheck, Info, ChevronRight, Download, BookOpen, AlertOctagon, 
  ExternalLink, FileSearch, Landmark, HeartHandshake
} from 'lucide-react';

const LegalVaultView: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState('GENERAL_RISK');

  const docs = [
    { id: 'GENERAL_RISK', label: 'Risk Disclosure', icon: ShieldAlert, color: 'text-rose-400' },
    { id: 'AI_ALGO_RISK', label: 'AI/Algo Risk', icon: BookOpen, color: 'text-sher-accent' },
    { id: 'EXEC_DISCLAIMER', label: 'Execution Disclaimer', icon: Landmark, color: 'text-amber-400' },
    { id: 'INDIA_ADDENDUM', label: 'SEBI Addendum', icon: Scale, color: 'text-emerald-400' },
    { id: 'PRIVACY_NODE', label: 'Privacy Node', icon: Eye, color: 'text-purple-400' }
  ];

  const renderContent = () => {
    switch (activeDoc) {
      case 'GENERAL_RISK':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4 text-rose-400">
                <ShieldAlert size={32} />
                <h3 className="text-2xl font-black uppercase tracking-tighter">Market Risk Shard</h3>
             </div>
             <p className="text-sm text-sher-muted leading-relaxed uppercase tracking-wider font-medium opacity-80">
               Trading in financial markets involves substantial risk and is not suitable for all investors. The high degree of leverage that can be obtained from trading can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
             </p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  'Capital Erosion Risk: Losses can exceed deposits.',
                  'Liquidity Gaps: Market depth may evaporate during volatility.',
                  'Slippage Node: Execution price may deviate from signal.',
                  'Systemic Failure: Infrastructure outages across exchange/broker.'
                ].map(item => (
                  <div key={item} className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-4">
                     <AlertOctagon size={16} className="text-rose-500 shrink-0 mt-0.5" />
                     <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">{item}</span>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'INDIA_ADDENDUM':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4 text-emerald-400">
                <Scale size={32} />
                <h3 className="text-2xl font-black uppercase tracking-tighter">SEBI Compliance Node</h3>
             </div>
             <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10 space-y-6">
                <p className="text-xs font-bold text-emerald-100/70 leading-relaxed uppercase italic">
                  "In accordance with SEBI guidelines for algorithmic trading (Circular 2022/23), this system functions as an AI-driven decision support tool. It is not an automated Portfolio Management Service (PMS)."
                </p>
                <div className="space-y-4">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">No Assured Returns: Profits are probabilistic only.</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">User Sovereignty: User must manually authorize 'Live' nodes.</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Zero-Custody: Capital remains in your broker vault.</span>
                   </div>
                </div>
             </div>
          </div>
        );
      default:
        return (
          <div className="p-20 text-center opacity-30">
             <FileSearch size={64} className="mx-auto mb-4" />
             <p className="text-xs font-black uppercase tracking-widest">Select document shard for audit.</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Document Navigation */}
        <div className="w-full lg:w-72 space-y-3">
           <p className="text-[10px] font-black text-sher-muted uppercase tracking-[0.3em] mb-6 px-4">Registry Nodes</p>
           {docs.map(doc => (
              <button 
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-left border ${
                  activeDoc === doc.id ? 'bg-panel border-sher-accent text-white shadow-xl' : 'text-sher-muted hover:bg-white/5 border-transparent'
                }`}
              >
                 <doc.icon size={18} className={activeDoc === doc.id ? doc.color : 'text-slate-600'} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{doc.label}</span>
              </button>
           ))}
           <div className="pt-8 px-4 border-t border-white/5 mt-8 space-y-6">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={24} className="text-emerald-500" />
                 <div>
                    <p className="text-[9px] font-black text-white uppercase">Vault Verified</p>
                    <p className="text-[7px] font-black text-sher-muted uppercase tracking-widest">v4.2 Regulatory Shard</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-panel border border-border rounded-[48px] p-12 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
           <div className="absolute top-0 right-0 p-20 opacity-[0.01] pointer-events-none"><Gavel size={400} /></div>
           
           <div className="flex justify-between items-center mb-16 border-b border-white/5 pb-8 relative z-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Sovereign <span className="text-sher-accent not-italic">Legal Node</span></h2>
              <div className="flex gap-3">
                 <button className="p-3 bg-slate-950 border border-white/5 rounded-xl text-sher-muted hover:text-white transition-all"><Download size={18}/></button>
                 <button className="p-3 bg-slate-950 border border-white/5 rounded-xl text-sher-muted hover:text-white transition-all"><ExternalLink size={18}/></button>
              </div>
           </div>

           <div className="flex-1 relative z-10">
              {renderContent()}
           </div>

           <div className="mt-12 pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
              <div className="flex items-center gap-4">
                 <Lock size={16} className="text-sher-muted" />
                 <p className="text-[8px] font-black text-sher-muted uppercase tracking-[0.4em]">FIPS 140-2 Encrypted Audit Trail</p>
              </div>
              <button className="px-8 py-3 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-sher-accent hover:text-white transition-all">
                Acknowledge Protocol
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LegalVaultView;
