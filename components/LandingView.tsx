
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Target,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  Globe,
  Bell,
  Check,
  Lock,
  Cpu,
  Award,
  Layers,
  FileText,
  BrainCircuit,
  ChevronLeft,
  Play,
  Quote,
  Star,
  ArrowUpRight,
  Database,
  Shield,
  Fingerprint,
  Info
} from 'lucide-react';
import { ViewState } from '../types';

interface LandingViewProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onNavigate: (view: ViewState) => void;
}

const useCountUp = (endValue: number, duration: number = 2000, decimals: number = 0) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const currentCount = progress * endValue;
      setCount(currentCount);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [endValue, duration]);
  return decimals > 0 ? count.toFixed(decimals) : Math.floor(count);
};

/* --- SHARED SUB-COMPONENTS --- */

const Stat = ({ label, value, icon: Icon }: any) => (
  <div className="flex flex-col items-center md:items-start p-6 bg-slate-900/40 rounded-3xl border border-white/5 group hover:border-sher-accent/20 transition-all">
    <div className="flex items-center gap-3 text-sher-muted mb-2 group-hover:text-sher-accent transition-colors">
      <Icon size={14} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </div>
    <p className="text-3xl font-black text-white tracking-tighter tabular-nums">{value}</p>
  </div>
);

const LandingView: React.FC<LandingViewProps> = ({ onGetStarted, onLogin, onNavigate }) => {
  const [activeFeature, setActiveFeature] = useState(0);
  const featureInterval = useRef<any>(null);

  const carouselFeatures = [
    {
      title: "AI Probability Engine",
      img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b",
      desc: "Every trade is validated using multi-factor probability scoring. Low-confidence signals are automatically throttled.",
      icon: BrainCircuit
    },
    {
      title: "Smart Money Detection",
      img: "https://images.unsplash.com/photo-1640161704729-cbe966a08476",
      desc: "Identify institutional activity and abnormal volume movements across all NSE/BSE segments in real-time.",
      icon: Layers
    },
    {
      title: "Risk-First Trading",
      desc: "Adaptive risk limits, drawdown protection and hardware-level kill-switch mechanisms for capital preservation.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71",
      icon: ShieldCheck
    }
  ];

  const blogPosts = [
    {
      title: "Why 90% of Retail Traders Lose Money",
      slug: "why-traders-lose-money",
      desc: "Understand emotional trading and how probabilistic sharding fixes the retail alpha gap.",
      category: "Research"
    },
    {
      title: "AI Trading in India: Reality vs Hype",
      slug: "ai-trading-india",
      desc: "What neural networks can and cannot do in today's high-frequency market regimes.",
      category: "Insights"
    }
  ];

  const stats = {
    accuracy: useCountUp(81, 2500),
    drawdown: useCountUp(6, 2500),
    reward: useCountUp(2.3, 2500, 1),
    throttled: useCountUp(38, 2500)
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const nextFeature = useCallback(() => {
    setActiveFeature((prev) => (prev + 1) % carouselFeatures.length);
  }, [carouselFeatures.length]);

  useEffect(() => {
    featureInterval.current = setInterval(nextFeature, 6000);
    return () => clearInterval(featureInterval.current);
  }, [nextFeature]);

  return (
    <div className="min-h-screen bg-[#0e1117] text-white selection:bg-sher-accent/30 overflow-x-hidden font-sans">
      
      {/* 🛡️ NAVIGATION (INTACT) */}
      <nav className="fixed top-0 left-0 right-0 z-[100] h-20 bg-[#0e1117]/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <Zap className="text-sher-accent group-hover:scale-110 transition-transform" size={28} fill="currentColor" />
          <span className="text-2xl font-black tracking-tighter text-white uppercase">SHER<span className="text-sher-accent">.AI</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => scrollToSection('features')} className="text-[10px] font-black uppercase tracking-widest text-sher-muted hover:text-white transition-all">Protocol</button>
          <button onClick={() => scrollToSection('video')} className="text-[10px] font-black uppercase tracking-widest text-sher-muted hover:text-white transition-all">Explainer</button>
          <button onClick={() => scrollToSection('pricing')} className="text-[10px] font-black uppercase tracking-widest text-sher-muted hover:text-white transition-all">Pricing</button>
          <button onClick={() => onNavigate(ViewState.BLOG)} className="text-[10px] font-black uppercase tracking-widest text-sher-muted hover:text-white transition-all">Research</button>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={onLogin} className="text-[10px] font-black uppercase tracking-widest text-white px-6 py-2.5 hover:bg-white/5 rounded-xl transition-all">Login</button>
           <button onClick={onGetStarted} className="bg-sher-accent text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-sher-accent/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">
             Start Free <ArrowRight size={14} />
           </button>
        </div>
      </nav>

      {/* 🚀 HERO SECTION (INTACT) */}
      <section className="relative pt-48 pb-32 px-6 lg:px-20 text-center min-h-[90vh] flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sher-accent/5 rounded-full blur-[160px] pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl space-y-10 animate-fade-up">
           <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Master Brain Core v4.2.1 Online
           </div>
           <h1 className="text-6xl lg:text-9xl font-black text-white leading-[0.9] tracking-tighter uppercase italic drop-shadow-2xl">
             Trade Smarter <br/> with <span className="text-transparent bg-clip-text bg-gradient-to-r from-sher-accent to-emerald-400 not-italic animate-pulse-glow">AI.</span>
           </h1>
           
           <p className="text-xl lg:text-2xl text-sher-muted max-w-3xl mx-auto font-medium leading-relaxed">
             AI-powered trading intelligence with probability, risk control, and full transparency. Focus on data, not emotions.
           </p>

           <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12">
              <button onClick={onGetStarted} className="w-full sm:w-auto bg-white text-black px-12 py-7 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3 group">
                Provision Node <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => onNavigate(ViewState.WAITLIST)} className="w-full sm:w-auto bg-slate-900 border border-white/10 text-white px-10 py-7 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                Join Beta Queue
              </button>
           </div>
        </div>

        {/* Neural Activity Ribbon */}
        <div className="absolute bottom-10 left-0 right-0 overflow-hidden opacity-20 pointer-events-none">
           <div className="flex gap-20 animate-scroll whitespace-nowrap">
              {['ACCUMULATION DETECTED', 'RELIANCE PROB: 74%', 'SBIN TRAP RISK: LOW', 'LIQUIDITY SWEEP: NSE', 'ALPHA NODE: LIVE'].map((txt, i) => (
                <span key={i} className="text-[10px] font-black text-white uppercase tracking-[0.6em]">{txt}</span>
              ))}
              {['ACCUMULATION DETECTED', 'RELIANCE PROB: 74%', 'SBIN TRAP RISK: LOW', 'LIQUIDITY SWEEP: NSE', 'ALPHA NODE: LIVE'].map((txt, i) => (
                <span key={`${i}-dup`} className="text-[10px] font-black text-white uppercase tracking-[0.6em]">{txt}</span>
              ))}
           </div>
        </div>
      </section>

      {/* 🔄 1. INTERACTIVE FEATURE CAROUSEL */}
      <section className="py-32 px-6 lg:px-20 bg-black/40 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-20">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.4em]">Core Technology</p>
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight italic">Intelligence Sharding</h2>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setActiveFeature(prev => (prev - 1 + carouselFeatures.length) % carouselFeatures.length)} className="p-4 bg-slate-900 rounded-2xl text-white hover:bg-sher-accent transition-all border border-white/5"><ChevronLeft size={20}/></button>
              <button onClick={nextFeature} className="p-4 bg-slate-900 rounded-2xl text-white hover:bg-sher-accent transition-all border border-white/5"><ChevronRight size={20}/></button>
            </div>
          </div>

          <div className="relative h-[600px] md:h-[500px]">
            {carouselFeatures.map((f, i) => (
              <div 
                key={i}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  i === activeFeature ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-20 pointer-events-none'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center h-full">
                  <div className="bg-panel border border-border rounded-[48px] overflow-hidden shadow-2xl relative h-[300px] md:h-full group">
                    <img src={f.img} alt={f.title} className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-panel to-transparent" />
                    <div className="absolute bottom-10 left-10 p-5 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 text-sher-accent">
                      <f.icon size={40} />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <h3 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">{f.title}</h3>
                    <p className="text-2xl text-sher-muted leading-relaxed font-medium">"{f.desc}"</p>
                    <div className="space-y-4">
                      {['99.9% Uptime SLA', 'Real-time Neural Simulation', 'FIPS 140-2 Encrypted'].map((point, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-sher-accent shadow-[0_0_10px_#3b82f6]" />
                          <span className="text-xs font-black text-white uppercase tracking-widest">{point}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={onGetStarted} className="inline-flex items-center gap-3 text-sher-accent font-black uppercase tracking-[0.2em] text-xs hover:underline decoration-2 underline-offset-8">
                       Initialize Protocol <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📌 2. FEATURE DETAILS GRID */}
      <section id="features" className="py-32 px-6 lg:px-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
              <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.4em]">The Quant Stack</p>
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Hedge-Fund Grade Infrastructure</h2>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { t: 'AI Probability Engine', d: 'Every signal is scored using multi-factor probability models. Low-confidence trades are blocked automatically.', i: BrainCircuit },
                { t: 'Smart Money Detection', d: 'Identifies institutional footprints, volume anomalies and liquidity traps in deep orderflow nodes.', i: Database },
                { t: 'Risk-First System', d: 'Adaptive risk limits, drawdown protection and global kill-switch ensure institutional capital safety.', i: ShieldCheck },
                { t: 'Full Transparency', d: 'Every AI decision is logged, explainable and auditable. No black-box trading, full trust sharding.', i: Fingerprint },
              ].map((f, i) => (
                <div key={i} className="bg-panel border border-border rounded-[40px] p-10 flex flex-col group hover:border-sher-accent/40 transition-all shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity"><f.i size={120} /></div>
                  <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-sher-accent border border-white/5 mb-8 group-hover:scale-110 transition-transform">
                    <f.i size={28} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">{f.t}</h3>
                  <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-70 italic">
                    {f.d}
                  </p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* 🎥 3. VIDEO EXPLAINER */}
      <section id="video" className="py-32 px-6 lg:px-20 bg-slate-950/50 border-y border-white/5 relative">
        <div className="max-w-5xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">How SHER.AI Works</h2>
            <p className="text-xl text-sher-muted font-medium max-w-2xl mx-auto uppercase tracking-widest">Neural trading intelligence explained in 90 seconds.</p>
          </div>

          <div className="aspect-video bg-black border-4 border-border rounded-[48px] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden relative group cursor-pointer hover:border-sher-accent/20 transition-all duration-700">
             <div className="absolute inset-0 bg-gradient-to-br from-panel via-black to-slate-900 flex items-center justify-center">
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-sher-accent transition-all duration-500 shadow-2xl">
                   <Play size={40} fill="currentColor" />
                </div>
                <img src="https://images.unsplash.com/photo-1611974717483-36009c60596c" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none grayscale" />
             </div>
             <div className="absolute bottom-10 left-10 px-6 py-2 bg-black/60 backdrop-blur-md rounded-2xl border border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Protocol Breakdown v4.1</span>
             </div>
          </div>
        </div>
      </section>

      {/* ⭐ 4. TESTIMONIALS + PERFORMANCE STATS */}
      <section className="py-32 px-6 lg:px-20">
        <div className="max-w-7xl mx-auto space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Stat label="Avg Signal Accuracy" value={`${stats.accuracy}%`} icon={Target} />
            <Stat label="Max Drawdown Control" value={`< ${stats.drawdown}%`} icon={ShieldCheck} />
            <Stat label="Risk-Reward Average" value={`1 : ${stats.reward}`} icon={TrendingUp} />
            <Stat label="Trades Filtered" value={`${stats.throttled}%`} icon={ShieldAlert} />
          </div>

          <div className="text-center space-y-4">
            <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.4em]">Social Proof</p>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic">Trusted by Disciplined Quants</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                text: "SHER.AI helped me stop over-trading. Risk control is the real edge in this volatile regime. The automated SL management is world-class.",
                author: "Retail Trader (India)",
                rating: 5
              },
              {
                text: "Finally an AI platform that focuses on probability and institutional flow, not fake guarantees. The transparency in reasoning is unprecedented.",
                author: "Options Speculator",
                rating: 5
              }
            ].map((t, i) => (
              <div key={i} className="bg-panel border border-border rounded-[48px] p-12 shadow-2xl relative group hover:border-sher-accent/30 transition-all overflow-hidden">
                <Quote size={64} className="text-sher-accent/10 absolute -top-4 -right-4 rotate-12" />
                <div className="flex gap-1 mb-8">
                  {Array.from({length: t.rating}).map((_, j) => <Star key={j} size={16} fill="#EAB308" className="text-amber-500" />)}
                </div>
                <p className="text-xl text-gray-300 font-medium leading-relaxed italic mb-10">"{t.text}"</p>
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center font-black text-lg border border-white/5 text-sher-accent">{t.author[0]}</div>
                   <div>
                      <p className="text-sm font-black text-white uppercase tracking-widest">{t.author}</p>
                      <p className="text-[9px] text-sher-muted font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                        <ShieldCheck size={10} className="text-emerald-500" /> Verified Node Member
                      </p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💰 5. PRICING PLANS */}
      <section id="pricing" className="py-32 px-6 lg:px-20 bg-slate-950/50 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
              <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.4em]">Scaling Edge</p>
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Simple & Transparent Pricing</h2>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              <div className="bg-panel border border-border rounded-[40px] p-10 flex flex-col transition-all hover:border-white/10 group">
                <h3 className="text-sm font-black text-sher-muted uppercase tracking-[0.3em] mb-4">Alpha Access</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-white">₹0</span>
                  <span className="text-xs text-sher-muted font-bold uppercase tracking-widest">Forever</span>
                </div>
                <ul className="space-y-5 mb-12 flex-1 pt-8 border-t border-white/5">
                  {['Paper Trading Node', 'Standard AI Signals', 'Limited Market Depth', 'Community Analytics'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-tight">
                       <Check size={14} className="text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-gray-200 transition-all">Start Free</button>
              </div>

              <div className="bg-panel border-2 border-sher-accent bg-gradient-to-b from-panel to-sher-accent/5 rounded-[40px] p-12 flex flex-col transition-all scale-105 z-10 shadow-[0_0_60px_rgba(59,130,246,0.15)] relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-sher-accent text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">High Conviction</div>
                <h3 className="text-sm font-black text-sher-muted uppercase tracking-[0.3em] mb-4">Prop Trader</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-white">₹1,999</span>
                  <span className="text-xs text-sher-muted font-bold uppercase tracking-widest">/ month</span>
                </div>
                <ul className="space-y-5 mb-12 flex-1 pt-8 border-t border-white/10">
                  {['Live Discovery Hub', 'Neural Prob > 0.85', 'Automated Risk Engine', 'Instant Pulse Alerts'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-black text-white uppercase tracking-tight">
                       <Check size={16} className="text-sher-accent" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={onGetStarted} className="w-full py-6 bg-sher-accent text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-600 transition-all shadow-xl shadow-sher-accent/20">Subscribe to Pro</button>
              </div>

              <div className="bg-panel border border-border rounded-[40px] p-10 flex flex-col transition-all hover:border-white/10 group">
                <h3 className="text-sm font-black text-sher-muted uppercase tracking-[0.3em] mb-4">Enterprise</h3>
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-5xl font-black text-white">Custom</span>
                </div>
                <ul className="space-y-5 mb-12 flex-1 pt-8 border-t border-white/5">
                  {['White-Label Sharding', 'B2B API Licensing', 'Dedicated HFT Cluster', 'Legal Compliance Kit'].map(f => (
                    <li key={f} className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-tight">
                       <Check size={14} className="text-emerald-500" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => onNavigate(ViewState.WAITLIST)} className="w-full py-5 bg-slate-900 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-800 transition-all">Contact Desk</button>
              </div>
           </div>
        </div>
      </section>

      {/* 📚 6. BLOG PREVIEW */}
      <section className="py-32 px-6 lg:px-20 relative">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.4em]">Research Hub</p>
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">Learn Quant Trading</h2>
            </div>
            <button onClick={() => onNavigate(ViewState.BLOG)} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
              Browse Library <ArrowUpRight size={18}/>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((p, i) => (
              <div 
                key={i}
                onClick={() => onNavigate(ViewState.BLOG)}
                className="bg-panel border border-border rounded-[48px] p-12 flex flex-col gap-8 group cursor-pointer hover:border-sher-accent/30 transition-all shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Zap size={140} className="text-sher-accent" /></div>
                <div className="flex justify-between items-center relative z-10">
                   <span className="px-4 py-1.5 bg-sher-accent/10 border border-sher-accent/20 rounded-xl text-[9px] font-black text-sher-accent uppercase tracking-widest">{p.category}</span>
                   <ChevronRight size={28} className="text-sher-muted group-hover:text-sher-accent transition-all group-hover:translate-x-2" />
                </div>
                <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight group-hover:text-sher-accent transition-colors leading-tight italic">{p.title}</h3>
                  <p className="text-lg text-sher-muted font-medium leading-relaxed opacity-60">"{p.desc}"</p>
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.4em] mt-auto relative z-10 border-t border-white/5 pt-8">Read Whitepaper &bull; 12m Node Sync</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⚖️ 7. RISK DISCLOSURE & DISCLAIMER (ENHANCED) */}
      <section className="py-32 px-6 lg:px-20 bg-black/60 border-t border-white/5 relative overflow-hidden">
         <div className="max-w-4xl mx-auto space-y-16">
            <div className="flex items-center gap-6 text-rose-500 border-b border-rose-500/10 pb-10">
               <div className="p-4 bg-rose-500/10 rounded-3xl border border-rose-500/20"><ShieldAlert size={48} strokeWidth={1.5} /></div>
               <h2 className="text-5xl font-black uppercase tracking-tighter italic">Risk Protocol</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-xs font-black text-sher-muted uppercase tracking-[0.1em] leading-[2.2]">
               <div className="space-y-10">
                  <div className="space-y-4">
                    <p className="text-white tracking-[0.2em] border-l-2 border-sher-accent pl-4 font-black">MARKET RISK SHARD:</p>
                    <p className="opacity-60 italic">TRADING IN FINANCIAL MARKETS INVOLVES SUBSTANTIAL RISK AND IS NOT SUITABLE FOR ALL INVESTORS. LOSSES CAN EXCEED INITIAL DEPOSITS DUE TO SYSTEMIC REGIME SHIFTS OR LIQUIDITY EVAPORATION.</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-white tracking-[0.2em] border-l-2 border-sher-accent pl-4 font-black">NO GUARANTEE PROTOCOL:</p>
                    <p className="opacity-60 italic">SHER.AI DOES NOT GUARANTEE PROFITS. ALL SIGNALS ARE PROBABILISTIC MODELS. PAST PERFORMANCE IS AUDITED BUT DOES NOT PREDICT FUTURE REGIME SURVIVAL.</p>
                  </div>
               </div>
               <div className="space-y-10">
                  <div className="space-y-4">
                    <p className="text-white tracking-[0.2em] border-l-2 border-sher-accent pl-4 font-black">REGULATORY STANDING:</p>
                    <p className="opacity-60 italic">SHER.AI IS A SOFTWARE INFRASTRUCTURE PLATFORM. WE DO NOT PROVIDE CERTIFIED INVESTMENT ADVICE (SEBI RIA/RA). ALWAYS CONSULT A LICENSED FINANCIAL ADVISOR BEFORE EXECUTION.</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-white tracking-[0.2em] border-l-2 border-sher-accent pl-4 font-black">LIABILITY SHIELD:</p>
                    <p className="opacity-60 italic">USERS MAINTAIN FULL SOVEREIGNTY OVER EXECUTION DECISIONS. SHER.AI IS NOT LIABLE FOR ANY FINANCIAL LOSS, API LATENCY ISSUES, OR ALGORITHMIC SLIPPAGE DURING LIVE MARKET SESSIONS.</p>
                  </div>
               </div>
            </div>
            
            <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-10">
               <div className="flex items-center gap-4">
                  <ShieldCheck size={28} className="text-emerald-500" />
                  <div>
                    <p className="text-[12px] font-black text-white uppercase tracking-[0.4em]">Audit Verified Node v4.2</p>
                    <p className="text-[8px] text-sher-muted font-bold uppercase tracking-[0.2em] mt-1">Institutional Compliance Shard: Stable</p>
                  </div>
               </div>
               <button className="px-10 py-5 bg-slate-900 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 transition-all">Download Full Disclosure</button>
            </div>
         </div>
      </section>

      {/* ⚖️ FOOTER (INTACT) */}
      <footer className="bg-black py-24 px-6 lg:px-20 border-t border-white/5 relative">
         <div className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-12">
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <Zap className="text-sher-accent group-hover:rotate-12 transition-transform" size={32} fill="currentColor" />
              <span className="text-3xl font-black tracking-tighter text-white uppercase">SHER<span className="text-sher-accent">.AI</span></span>
            </div>
            <div className="flex flex-wrap justify-center gap-12 text-[10px] font-black uppercase tracking-[0.3em] text-sher-muted">
                <button onClick={() => onNavigate(ViewState.LEGAL)} className="hover:text-white transition-colors">Legal Vault</button>
                <button onClick={() => onNavigate(ViewState.LEGAL)} className="hover:text-white transition-colors">Privacy Node</button>
                <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Subscription</button>
                <button onClick={() => onNavigate(ViewState.BLOG)} className="hover:text-white transition-colors">Intelligence</button>
            </div>
            <div className="pt-12 border-t border-white/5 w-full flex flex-col md:flex-row justify-between items-center gap-8">
               <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest">© 2025 SHER AI QUANT INTELLIGENCE. GLOBAL SOVEREIGN NODE.</p>
               <div className="flex items-center gap-3">
                  <Award size={18} className="text-sher-accent" />
                  <span className="text-[10px] font-black text-sher-muted uppercase tracking-[0.3em]">Excellence in Neural Execution</span>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingView;
