
import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, ChevronRight, ChevronLeft, 
  BarChart, Globe, Lock, BrainCircuit, Landmark, 
  TrendingUp, Activity, Target, ShieldAlert, Rocket, 
  Database, Fingerprint, PieChart, Info,
  // Added CheckCircle2 to imports
  CheckCircle2
} from 'lucide-react';

const PitchDeckView: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "PROBLEM",
      title: "The Discipline Problem",
      subtitle: "RETAIL FAILURE MODES",
      icon: ShieldAlert,
      content: "Retail traders lose money not because of bad indicators, but because of poor risk + execution + discipline.",
      bullets: ["Emotional Alpha Decay", "Zero Real-time Risk Gating", "Impulsive Over-trading"],
      color: "from-rose-500/20 to-transparent"
    },
    {
      id: "GAP",
      title: "The Market Gap",
      subtitle: "INTELLIGENCE VOID",
      icon: Globe,
      content: "Indicator tools exist. Intelligence doesn't. Safety is missing from the retail stack.",
      bullets: ["Noise > Signal", "Complexity > Clarity", "Gambling > Probability"],
      color: "from-amber-500/20 to-transparent"
    },
    {
      id: "SOLUTION",
      title: "The Sher Solution",
      subtitle: "INSTITUTIONAL BRAIN",
      icon: BrainCircuit,
      content: "An institutional-grade AI trading brain focused on risk first, profit second.",
      bullets: ["Neural Probability Engine", "Deterministic Risk Barriers", "Audit-Ready Infrastructure"],
      color: "from-sher-accent/20 to-transparent"
    },
    {
      id: "MOAT",
      title: "The Tech Moat",
      subtitle: "DEFENSIBLE ALPHA",
      icon: Lock,
      content: "Vertical integration of Bayesian math, strategy ensembles, and portfolio-level risk control.",
      bullets: ["Regime-Aware Thresholds", "Consensus Voting Shards", "Self-Learning Loops"],
      color: "from-purple-500/20 to-transparent"
    },
    {
      id: "TRUST",
      title: "The Trust Layer",
      subtitle: "RADICAL TRANSPARENCY",
      icon: Fingerprint,
      content: "We solve the 'Black Box' problem with Explainable AI and immutable audit logs.",
      bullets: ["SEBI-Safe Governance", "Hash-Chained Evidence", "Traceable Causal Logic"],
      color: "from-emerald-500/20 to-transparent"
    },
    {
      id: "MODEL",
      title: "Business Model",
      subtitle: "SCALABLE REVENUE",
      icon: Landmark,
      content: "SaaS economics powered by tiered node provisioning for retail and prop-desks.",
      bullets: ["Monthly Subscription SaaS", "Institutional White-Label", "Compute-Shard Licensing"],
      color: "from-blue-500/20 to-transparent"
    },
    {
      id: "COMPETITION",
      title: "Competitive Edge",
      subtitle: "SHER VS LEGACY",
      icon: Target,
      content: "Legacy tools sell 'Hope' through indicators. SHER sells 'Discipline' through risk systems.",
      bullets: ["Risk-Adjusted Alpha", "Non-Discretionary Gatekeeping", "Institutional Survival Rating"],
      color: "from-cyan-500/20 to-transparent"
    },
    {
      id: "VISION",
      title: "The Vision",
      subtitle: "FUTURE STATE",
      icon: Rocket,
      content: "Becoming the operating system for disciplined, risk-first capital allocation.",
      bullets: ["Global Shard Expansion", "Multi-Asset Intelligence", "The Ultimate Alpha Node"],
      color: "from-indigo-500/20 to-transparent"
    }
  ];

  const next = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const current = slides[currentSlide];

  return (
    <div className="h-full bg-black rounded-[48px] border border-white/5 flex flex-col overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,1)] animate-in fade-in duration-1000">
      
      {/* 🧭 NAVIGATION SHARD */}
      <div className="p-10 flex justify-between items-center border-b border-white/5 bg-panel/30">
        <div className="flex items-center gap-4">
           <Zap className="text-sher-accent" size={24} fill="currentColor" />
           <span className="text-xl font-black tracking-tighter text-white uppercase italic">SHER<span className="text-sher-accent not-italic">.AI</span> <span className="text-white/20 not-italic ml-2 text-sm uppercase">INVESTOR_PITCH</span></span>
        </div>
        <div className="flex gap-2">
           {slides.map((_, i) => (
             <button 
               key={i} 
               onClick={() => setCurrentSlide(i)}
               className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-sher-accent' : 'w-2 bg-white/10 hover:bg-white/20'}`} 
             />
           ))}
        </div>
      </div>

      {/* 🖼️ SLIDE STAGE */}
      <div className={`flex-1 grid grid-cols-1 lg:grid-cols-2 p-12 lg:p-24 items-center gap-16 relative bg-gradient-to-br ${current.color} transition-all duration-1000`}>
         <div className="absolute top-0 right-0 p-20 opacity-[0.02] pointer-events-none">
           <current.icon size={500} strokeWidth={0.5} />
         </div>

         <div className="space-y-12 relative z-10">
            <div className="space-y-2">
               <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.4em]">{current.subtitle}</p>
               <h1 className="text-6xl lg:text-8xl font-black text-white leading-none uppercase tracking-tighter italic">
                  {current.title.split(' ').map((w, i) => (
                     <span key={i} className={i % 2 !== 0 ? 'text-sher-accent not-italic' : ''}>{w} </span>
                  ))}
               </h1>
            </div>
            
            <p className="text-2xl text-sher-muted font-medium leading-relaxed uppercase tracking-tight opacity-95 italic">
               "{current.content}"
            </p>

            <div className="grid grid-cols-1 gap-5">
               {current.bullets.map(b => (
                  <div key={b} className="flex items-center gap-5 bg-slate-900/50 p-6 rounded-3xl border border-white/5 group hover:border-sher-accent/20 transition-all shadow-xl">
                     <div className="w-10 h-10 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
                        <CheckCircle2 size={20} />
                     </div>
                     <span className="text-sm font-black text-white uppercase tracking-[0.1em]">{b}</span>
                  </div>
               ))}
            </div>
         </div>

         <div className="flex justify-center items-center relative h-full">
            <div className="w-full aspect-square bg-slate-950/50 border border-white/5 rounded-[64px] flex flex-col items-center justify-center p-20 shadow-inner group relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sher-accent/5 via-transparent to-transparent opacity-50" />
               <current.icon size={280} className="text-sher-accent opacity-20 group-hover:scale-110 group-hover:opacity-60 transition-all duration-1000" strokeWidth={0.5} />
               <div className="absolute bottom-12 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <Fingerprint size={14} className="text-sher-accent" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Shard ID: 0x82A1-F9-2025</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 🏁 DECK CONTROLS */}
      <div className="p-10 border-t border-white/5 bg-panel/30 flex justify-between items-center">
         <div className="flex gap-6">
            <button 
              onClick={prev}
              className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-sher-muted hover:text-white transition-all active:scale-95 group"
            >
               <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={next}
              className="px-12 py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-3xl hover:bg-sher-accent hover:text-white transition-all flex items-center gap-4 active:scale-95 group shadow-2xl"
            >
               {currentSlide === slides.length - 1 ? 'RESTART AUDIT' : 'NEXT SHARD'} 
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
         <div className="text-right">
            <p className="text-[10px] font-black text-sher-muted uppercase tracking-[0.4em]">Confidential Institutional Node</p>
            <p className="text-[8px] text-sher-muted uppercase mt-1">© 2025 SHER AI QUANT LABS</p>
         </div>
      </div>
    </div>
  );
};

export default PitchDeckView;
