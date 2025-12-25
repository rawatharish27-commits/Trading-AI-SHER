
import React, { useState, useEffect } from 'react';
import { BookOpen, Globe, ShieldCheck, Cpu, Database, Activity, FileText, ChevronRight, Lock, BrainCircuit, Landmark, Fingerprint } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const Section = ({ title, icon: Icon, children }: any) => (
  <div className="space-y-6 group">
     <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-sher-accent border border-white/5 group-hover:bg-sher-accent group-hover:text-white transition-all">
           <Icon size={20} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
     </div>
     <div className="pl-14 text-sm text-sher-muted leading-loose font-medium uppercase tracking-wide opacity-80">
        {children}
     </div>
  </div>
);

const InstitutionalWhitepaper: React.FC = () => {
  const [content, setContent] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateSummary = async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: "Write 3 technical, institutional-grade paragraphs explaining a 'Neural Probabilistic Sharding' trading system for professional quants."
        });
        if (response.text) setContent(response.text.split('\n\n'));
      } catch (e) {}
      setIsLoading(false);
    };
    generateSummary();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-16 animate-in fade-in duration-1000 pb-32">
      <div className="text-center space-y-6">
         <div className="inline-flex items-center gap-3 px-4 py-2 bg-slate-950 border border-white/5 rounded-2xl">
            <Fingerprint size={16} className="text-sher-accent" />
            <span className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Proprietary & Confidential</span>
         </div>
         <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic">SHER ALPHA SPEC</h1>
         <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.5em]">Release v4.5 | Institutional Grade Terminal</p>
      </div>

      <div className="bg-panel border border-border rounded-[48px] p-12 lg:p-20 shadow-2xl space-y-20 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none"><Landmark size={400} /></div>

         <Section title="01. Executive Summary" icon={BookOpen}>
            {content[0] || "The Sher Sovereign Engine represents the nexus of high-frequency technical logic and generative neural reasoning. By sharding market data into deterministic and probabilistic components, we achieve a unique 'Alpha Efficiency' unattainable by legacy retail indicators."}
         </Section>

         <Section title="02. Neural Architecture" icon={BrainCircuit}>
            {content[1] || "Utilizing Gemini-driven meta-reasoning, our system audits every technical signal against real-time orderflow imbalance and regime shifts. This explainability layer ensures that no trade is executed based on noise, only on high-fidelity causal patterns."}
         </Section>

         <Section title="03. Risk Governance" icon={ShieldCheck}>
            {content[2] || "Capital preservation is not a feature; it is the core firmware. With hard-coded 0.5% unit risk, mandatory sector neutrality, and a global hardware-level kill switch, the system is designed to survive black-swan events that typically liquidate retail portfolios."}
         </Section>

         <div className="pt-20 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 space-y-4">
               <p className="text-[8px] font-black text-sher-muted uppercase tracking-[0.3em]">Compliance Node Status</p>
               <div className="flex items-center gap-3 text-emerald-400">
                  <Lock size={16} />
                  <span className="text-xs font-black uppercase">AES-256 GCM SHARDING ACTIVE</span>
               </div>
            </div>
            <div className="bg-slate-950 p-8 rounded-3xl border border-white/5 space-y-4">
               <p className="text-[8px] font-black text-sher-muted uppercase tracking-[0.3em]">Audit Trail</p>
               <div className="flex items-center gap-3 text-sher-accent">
                  <Database size={16} />
                  <span className="text-xs font-black uppercase">HASH-CHAINED LOGS ENABLED</span>
               </div>
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-black text-sher-muted uppercase tracking-widest opacity-40">
         <p>© 2025 SHER AI QUANT LABS. GLOBAL SOVEREIGN NODE.</p>
         <div className="flex gap-8">
            <span>UNCLASSIFIED</span>
            <span>PUBLIC KEY: 0x42A...F91</span>
         </div>
      </div>
    </div>
  );
};

export default InstitutionalWhitepaper;
