
import React from 'react';
import { ShieldCheck, Heart, Eye, Lock, Globe, Award, Info, Zap, Scale, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react';

const TrustCenterView: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-16 animate-in fade-in duration-700 pb-32">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
           <ShieldCheck size={12} /> Verification Node: Alpha Stable
        </div>
        <h1 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-[0.9]">
           The Shard of <span className="text-sher-accent not-italic">Truth.</span>
        </h1>
        <p className="text-lg text-sher-muted max-w-2xl mx-auto font-medium leading-relaxed">
           Transparency is the ultimate institutional edge. We disclose our philosophy, risks, and governance to ensure absolute user sovereignty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-6 group hover:border-sher-accent/30 transition-all">
            <div className="w-12 h-12 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent"><Zap size={24} fill="currentColor" /></div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">How it Works</h3>
            <p className="text-xs text-sher-muted leading-loose font-medium uppercase opacity-70">
               Data Ingestion → Feature Extraction → Neural Probability Scoring → Risk-Firewall Audit → User Alert. Every step is logged and explainable.
            </p>
         </div>
         <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-6 group hover:border-sher-accent/30 transition-all">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400"><Heart size={24} fill="currentColor" /></div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Risk-First Logic</h3>
            <p className="text-xs text-sher-muted leading-loose font-medium uppercase opacity-70">
               AI never overrides risk. If the Risk Engine detects a breach of the 1% unit rule or sector cap, the trade is vetoed instantly.
            </p>
         </div>
         <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-6 group hover:border-sher-accent/30 transition-all">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400"><Eye size={24} /></div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Governance</h3>
            <p className="text-xs text-sher-muted leading-loose font-medium uppercase opacity-70">
               Model versions are hash-chained. No "hot-swaps" in production. All updates undergo a 48-hour shadow validation period.
            </p>
         </div>
      </div>

      <div className="bg-slate-950 border border-white/5 rounded-[48px] p-12 lg:p-20 shadow-inner space-y-12">
         <div className="flex items-center gap-4">
            <Fingerprint size={32} className="text-sher-accent" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Transparency <span className="text-sher-accent not-italic">Manifesto</span></h2>
         </div>
         
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-sher-muted uppercase tracking-[0.4em]">What We DO NOT Do</h4>
               <div className="space-y-4">
                  {[
                    "No Guaranteed Returns: We trade probabilities, not certainties.",
                    "No Forced Execution: Users maintain full sovereignty over nodes.",
                    "No Hidden Algos: Every decision has a traceable causal trail.",
                    "No Data Selling: Your broker secrets remain in your vault."
                  ].map(line => (
                    <div key={line} className="flex items-center gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                       <span className="text-[11px] font-black text-white uppercase tracking-widest">{line}</span>
                    </div>
                  ))}
               </div>
            </div>
            <div className="space-y-8">
               <h4 className="text-[10px] font-black text-sher-muted uppercase tracking-[0.4em]">Our Ethical Shards</h4>
               <div className="space-y-4">
                  {[
                    "Disciplined Alpha: Prioritizing capital preservation over volume.",
                    "Explainable AI: Every probability has a 'Why' matrix.",
                    "Sovereign Nodes: Decentralized execution across user-owned bridges.",
                    "Audit Transparency: 100% of logs are available to regulators."
                  ].map(line => (
                    <div key={line} className="flex items-center gap-4">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       <span className="text-[11px] font-black text-white uppercase tracking-widest">{line}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-8 py-12 border-t border-white/5 opacity-40">
         <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest">© 2025 SHER AI QUANT LABS. TRUSTED BY 1,200+ NODES.</p>
         <div className="flex gap-8">
            <Award size={32} />
            <Globe size={32} />
            <Scale size={32} />
         </div>
      </div>
    </div>
  );
};

export default TrustCenterView;
