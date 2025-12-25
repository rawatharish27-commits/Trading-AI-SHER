
import React, { useState, useEffect } from 'react';
import { 
  Zap, Target, TrendingUp, ShieldCheck, Briefcase, ChevronRight, BarChart, 
  Rocket, Users, Globe, Layers, AlertCircle, PieChart, Landmark, CheckCircle2, 
  Award, Heart, Shield, Activity, BrainCircuit, Lock, Power, Fingerprint, Search,
  ChevronLeft, EyeOff, Scale, ShieldAlert, Gavel, Database
} from 'lucide-react';

const PitchView: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isVetoSimulating, setIsVetoSimulating] = useState(false);

  const slides = [
    {
      id: "PROB",
      subtitle: "THE PROBLEM",
      title: "The Governance Gap",
      icon: ShieldAlert,
      content: "90% of retail quant tools fail due to a lack of institutional risk governance. They prioritize signal frequency over capital survival.",
      bullets: ["Emotional Alpha Decay", "Zero Real-time Risk Gating", "Non-Auditable Decision Logic"],
      telemetry: "STATUS: MARKET_ENTROPY_HIGH"
    },
    {
      id: "REALITY",
      subtitle: "MARKET REALITY",
      title: "Probability over Prediction",
      icon: Globe,
      content: "Markets are 100% probabilistic. Legacy 'Prediction' models fail during regime shifts. We trade the distribution, not the guess.",
      bullets: ["Ensemble Probability Sharding", "Regime-Aware Thresholding", "Deterministic Floor Logic"],
      telemetry: "CALIBRATION: BAYESIAN_CORE_V4"
    },
    {
      id: "PHIL",
      subtitle: "OUR PHILOSOPHY",
      title: "The Risk-First Shard",
      icon: Heart,
      content: "Explainability is our ultimate edge. We don't sell 'Black Boxes.' Every trade must have a traceable, causal reasoning matrix.",
      bullets: ["Accuracy > Frequency", "Risk > Return", "Audit > Hype"],
      telemetry: "ETHICS_GUARD: ACTIVE"
    },
    {
      id: "ARCH",
      subtitle: "SYSTEM ARCHITECTURE",
      title: "Sovereign Neural Pipeline",
      icon: Layers,
      content: "A vertically integrated stack sharding raw market ticks into audited institutional decisions in < 50ms.",
      bullets: ["Feature Extraction Node", "Neural Probability Hub", "Risk Firewall Dispatcher"],
      telemetry: "LATENCY: 42ms_STABLE"
    },
    {
      id: "FLOW",
      subtitle: "AI DECISION FLOW",
      title: "The Intelligence Filter",
      icon: BrainCircuit,
      content: "Our system rejects 90% of technical signals. Signals only achieve 'Alpha' status if Technical, Volume, and Orderflow clusters align.",
      bullets: ["Cluster Harmony Audit", "Conflict Penalty Shard", "Trap Detection Filter"],
      telemetry: "REJECTION_RATE: 91.4%"
    },
    {
      id: "RISK",
      subtitle: "THE STAR MODULE",
      title: "The Risk Engine",
      icon: ShieldCheck,
      content: "Capital Sovereignty is non-negotiable. Hard-coded limits that the AI core cannot override, ensuring absolute drawdown protection.",
      bullets: ["1% Unit Risk Rule", "Global Nuclear Halt", "Sector Neutrality Monitor"],
      telemetry: "DRAWDOWN_LIMIT: 4.5%"
    },
    {
      id: "GOV",
      subtitle: "GOVERNANCE",
      title: "Regulatory Integrity",
      // Fix: Added Gavel to the lucide-react imports to resolve "Cannot find name 'Gavel'" error on line 73.
      icon: Gavel,
      content: "Built for SEBI/MIFID II compliance. Alert-only execution path ensures the human trader remains the ultimate decision node.",
      bullets: ["Human-in-the-Loop Sharding", "Hash-Chained Audit Logs", "Non-Custodial Design"],
      telemetry: "COMPLIANCE_NODE: VERIFIED"
    },
    {
      id: "SAND",
      subtitle: "PILOT PROGRAM",
      title: "Sandbox Environment",
      // Fix: Added Database to the lucide-react imports to resolve "Cannot find name 'Database'" error on line 82.
      icon: Database,
      content: "Proof of Process, not Proof of Profit. High-fidelity simulation nodes allow institutions to observe AI discipline with zero capital risk.",
      bullets: ["Real-time Alpha Observation", "Simulated Veto Scenarios", "Weekly Audit Reviews"],
      telemetry: "SANDBOX_UPTIME: 99.99%"
    },
    {
      id: "CASES",
      subtitle: "USE CASES",
      title: "Institutional Nodal Growth",
      icon: Briefcase,
      content: "From Prop Desks to Family Offices—Sher AI scales your alpha generation without increasing operational risk or overhead.",
      bullets: ["Prop Desk Automation", "Broker Analytics Shard", "Research Alpha Discovery"],
      telemetry: "NODES_ACTIVE: 1,240+"
    },
    {
      id: "TRUST",
      subtitle: "THE TRUST CENTER",
      title: "What We DO NOT Do",
      icon: Lock,
      content: "Radical Transparency: We do not promise fixed returns, we do not auto-execute without consent, and we never touch your raw broker keys.",
      bullets: ["No Guaranteed Profits", "No Black-Box Execution", "No Data Monetization"],
      telemetry: "TRUST_INDEX: AA+"
    },
    {
      id: "COMM",
      subtitle: "BUSINESS MODEL",
      title: "Licensing Intelligence",
      icon: Landmark,
      content: "We sell infrastructure, not signals. Enterprise Licensing nodes provide long-term defensible revenue through compute sharding.",
      bullets: ["Annual Platform License", "Compute Shard Maintenance", "White-Label Deployment"],
      telemetry: "MODEL: SAAS_SOVEREIGN"
    },
    {
      id: "NEXT",
      subtitle: "THE ROADMAP",
      title: "Initialize Pilot Shard",
      icon: Rocket,
      content: "Qualification -> Sandbox Access -> Logic Audit -> Production Deployment. Your institutional journey starts here.",
      bullets: ["Request Pilot Handshake", "Map Risk Barriers", "Launch Sovereign Node"],
      telemetry: "READY_FOR_HANDSHAKE"
    }
  ];

  const handleNext = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Risk Engine Simulation Logic
  useEffect(() => {
    if (slides[activeSlide].id === 'RISK') {
      const interval = setInterval(() => setIsVetoSimulating(prev => !prev), 2000);
      return () => clearInterval(interval);
    }
  }, [activeSlide]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 h-full flex flex-col animate-in fade-in duration-700">
      {/* presentation Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20">
              <Landmark size={24} />
           </div>
           <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">SHER<span className="text-sher-accent not-italic">.AI</span> <span className="text-white/40 not-italic ml-2">PITCH_NODE</span></h2>
              <p className="text-[9px] text-sher-muted font-black uppercase tracking-[0.4em]">Confidential Institutional Briefing v4.5</p>
           </div>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          {slides.map((s, i) => (
            <button 
              key={i} 
              onClick={() => setActiveSlide(i)}
              title={s.title}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all ${i === activeSlide ? 'bg-sher-accent text-white shadow-xl shadow-sher-accent/20' : 'text-sher-muted hover:text-white hover:bg-slate-900'}`}
            >
              <span className="text-[10px] font-black">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Slide Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center flex-1 bg-panel border border-border rounded-[48px] p-12 lg:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Background Design Shards */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sher-accent/20 to-transparent" />
        <div className="absolute bottom-0 right-0 p-12 opacity-[0.02] pointer-events-none rotate-12"><Landmark size={500} /></div>

        <div className="space-y-10 animate-in slide-in-from-left-8 duration-700 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-950 border border-white/10 text-[10px] font-black text-sher-accent uppercase tracking-widest shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-sher-accent animate-pulse" /> {slides[activeSlide].subtitle}
          </div>
          <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.85] uppercase tracking-tighter italic">
            {slides[activeSlide].title.split(' ').map((word, idx) => (
               <span key={idx} className={idx % 2 !== 0 ? 'text-sher-accent not-italic' : ''}>{word} </span>
            ))}
          </h1>
          <p className="text-xl lg:text-2xl text-sher-muted leading-relaxed font-medium uppercase tracking-tight opacity-90">
            "{slides[activeSlide].content}"
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {slides[activeSlide].bullets.map((p, i) => (
              <div key={i} className="flex items-center gap-5 bg-slate-950/50 p-5 rounded-2xl border border-white/5 group hover:border-sher-accent/30 transition-all shadow-lg">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CheckCircle2 size={18} />
                </div>
                <span className="text-xs font-black text-white uppercase tracking-[0.15em]">{p}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 pt-8">
            <button 
              onClick={handleNext}
              className="px-12 py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-3xl flex items-center gap-4 hover:bg-sher-accent hover:text-white transition-all shadow-2xl active:scale-95 group"
            >
              Initialize Next Shard <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={handlePrev} className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-sher-muted hover:text-white transition-all"><ChevronLeft size={20}/></button>
          </div>
        </div>

        <div className="relative animate-in slide-in-from-right-8 duration-700 flex flex-col gap-8 h-full justify-center">
          {/* visual Node */}
          <div className="aspect-square bg-slate-950 border-4 border-white/5 rounded-[60px] shadow-2xl relative overflow-hidden flex flex-col p-16 items-center justify-center text-center group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sher-accent/10 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
            
            <div className="relative z-10 space-y-12">
              {React.createElement(slides[activeSlide].icon, { 
                size: 160, 
                className: "text-sher-accent mx-auto drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]", 
                strokeWidth: 1.0, 
                fill: "currentColor", 
                fillOpacity: 0.05 
              })}
              
              {/* Contextual Visual Simulation */}
              {slides[activeSlide].id === 'RISK' && (
                <div className={`mt-8 p-6 rounded-3xl border-2 transition-all duration-500 scale-110 ${isVetoSimulating ? 'bg-rose-500/20 border-rose-500 animate-shake' : 'bg-emerald-500/20 border-emerald-500'}`}>
                   <p className="text-[10px] font-black text-white uppercase tracking-widest mb-2">Simulated Execution</p>
                   <p className="text-xl font-black text-white uppercase tracking-tighter">
                      {isVetoSimulating ? 'TRADE_VETOED: MAX_DD' : 'RISK_ADJUSTED_OK'}
                   </p>
                </div>
              )}

              {slides[activeSlide].id === 'FLOW' && (
                <div className="mt-8 flex justify-center gap-4">
                   {[1,2,3].map(i => (
                      <div key={i} className={`w-3 h-12 rounded-full ${i === 2 ? 'bg-sher-accent animate-pulse' : 'bg-slate-800'}`} />
                   ))}
                </div>
              )}

              <div className="space-y-3">
                 <h3 className="text-3xl font-black text-white uppercase tracking-widest">{slides[activeSlide].title}</h3>
                 <div className="flex items-center justify-center gap-3">
                    <Fingerprint size={12} className="text-sher-accent" />
                    <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em]">{slides[activeSlide].telemetry}</p>
                 </div>
              </div>
            </div>

            {/* presentation Footer Shard */}
            <div className="absolute bottom-10 left-10 right-10 flex justify-between items-center border-t border-white/5 pt-8 opacity-40">
               <div className="flex gap-4">
                  <Shield size={20} />
                  <Scale size={20} />
                  <Activity size={20} />
               </div>
               <span className="text-[8px] font-black uppercase tracking-[0.4em]">Audit_Locked_Node</span>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-slate-900/50 border border-white/10 p-6 rounded-3xl flex items-center gap-5 backdrop-blur-md">
             <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20"><ShieldCheck size={24} /></div>
             <div>
                <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest">Logic Certificate</p>
                <p className="text-sm font-black text-white uppercase tracking-tighter">FIPS 140-2 Encrypted Alpha Shard</p>
             </div>
          </div>
        </div>
      </div>

      {/* presentation Footer */}
      <div className="mt-10 flex justify-between items-center px-10 text-[10px] font-black text-sher-muted uppercase tracking-[0.5em] opacity-40 italic">
         <span>© 2025 SHER AI QUANT LABS</span>
         <div className="flex gap-12">
            <span>PUBLIC_KEY: 0x8x21_f92_al</span>
            <span>SHARD_ID: {activeSlide + 1}/12</span>
         </div>
      </div>

      <style>{`
        .animate-shake {
           animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
           10%, 90% { transform: translate3d(-1px, 0, 0); }
           20%, 80% { transform: translate3d(2px, 0, 0); }
           30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
           40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
};

export default PitchView;
