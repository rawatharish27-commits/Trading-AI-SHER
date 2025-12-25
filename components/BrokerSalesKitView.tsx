
import React from 'react';
import { 
  Zap, Globe, ShieldCheck, Heart, Users, Target, Rocket, 
  BarChart, Layers, Handshake, CheckCircle2, ChevronRight,
  TrendingUp, Award, Laptop, Mail, Landmark,
  /* Added Activity and Scale to fix "Cannot find name" errors */
  Activity, Scale
} from 'lucide-react';

const BrokerSalesKitView: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-20 pb-32 animate-in fade-in duration-1000">
      {/* Sales Hero */}
      <section className="text-center space-y-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sher-accent/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sher-accent/10 border border-sher-accent/20 text-[10px] font-black text-sher-accent uppercase tracking-widest animate-fade-up">
           <Zap size={12} fill="currentColor" /> White-Label Shard Node
        </div>
        <h1 className="text-6xl lg:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
           Your Brand <br/> <span className="text-sher-accent not-italic">Powered by SHER.</span>
        </h1>
        <p className="text-xl text-sher-muted max-w-3xl mx-auto font-medium leading-relaxed uppercase tracking-wide">
           A plug-and-play AI intelligence stack for forward-thinking brokers. Retain your users longer with institutional-grade risk governance.
        </p>
        <div className="flex justify-center gap-6">
           <button className="px-10 py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95 flex items-center gap-3">
             Request Pilot Access <ChevronRight size={18} />
           </button>
        </div>
      </section>

      {/* Why Brokers Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
         <div className="space-y-8">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">The Broker Problem <br/> We Solve.</h2>
            <div className="space-y-6">
               {[
                 { t: 'High User Churn', d: '90% of retail traders blow up within 90 days. We help them survive with automated capital protection.', icon: Users },
                 { t: 'Compliance Overhead', d: 'Transparent, auditable decision logs prove you are providing value, not just gambling.', icon: Landmark },
                 { t: 'Impulsive Flow', d: 'Our AI ethics layer filters emotional revenge trading, creating high-quality, long-term volume.', icon: Activity }
               ].map((item, i) => (
                 <div key={i} className="flex gap-6 p-6 bg-panel border border-border rounded-3xl group hover:border-sher-accent/30 transition-all">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-sher-muted group-hover:text-sher-accent transition-all shrink-0">
                       <item.icon size={24} />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-white uppercase tracking-tight">{item.t}</h4>
                       <p className="text-sm text-sher-muted leading-relaxed font-medium uppercase tracking-wider opacity-60">"{item.d}"</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-panel border-2 border-sher-accent/20 rounded-[48px] p-2 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 overflow-hidden relative">
            <div className="absolute inset-0 bg-sher-accent/5 animate-pulse" />
            <div className="bg-slate-950 rounded-[46px] p-12 space-y-10 relative z-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-sher-accent flex items-center justify-center text-white"><ShieldCheck size={28} /></div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Institutional Shard</h3>
               </div>
               <div className="space-y-6">
                  {[
                    { label: 'Branding', val: 'Fully Customizable', icon: Laptop },
                    { label: 'Risk Rules', val: 'Broker-Enforced', icon: Scale },
                    { label: 'Deployment', val: '< 48 Hours', icon: Rocket },
                  ].map(stat => (
                    <div key={stat.label} className="flex justify-between items-center border-b border-white/5 pb-4">
                       <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
                          <stat.icon size={14} className="text-sher-accent" /> {stat.label}
                       </span>
                       <span className="text-xs font-black text-white uppercase">{stat.val}</span>
                    </div>
                  ))}
               </div>
               <div className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                     <p className="text-[8px] font-black text-sher-muted uppercase">Retention Lift Index</p>
                     <p className="text-xs font-black text-emerald-400">+24.2%</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '82%' }} />
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Revenue Section */}
      <section className="bg-slate-950 border border-white/5 rounded-[48px] p-12 lg:p-20 text-center space-y-12 shadow-inner">
         <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Monetize Intelligence</h2>
            <p className="text-lg text-sher-muted font-medium uppercase tracking-wide">Subscription revenue + Higher account LTV.</p>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { t: 'License Node', d: 'Monthly base license for firmware and sharding.', val: '₹5L - ₹25L', sub: 'One-time setup' },
              { t: 'Compute Shard', d: 'Per active user compute and AI inference fee.', val: '₹199 / mo', sub: 'Volume-based' },
              { t: 'Alpha Rev-Share', d: 'Shared revenue from user premium subscriptions.', val: '20%', sub: 'Pure profit' },
            ].map(m => (
              <div key={m.t} className="space-y-4 p-8 bg-panel border border-border rounded-[40px] hover:border-sher-accent/20 transition-all">
                 <h4 className="text-sm font-black text-white uppercase tracking-widest">{m.t}</h4>
                 <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase opacity-60">"{m.d}"</p>
                 <div className="pt-6">
                    <p className="text-3xl font-black text-white tracking-tighter">{m.val}</p>
                    <p className="text-[9px] text-sher-accent font-black uppercase tracking-widest mt-1">{m.sub}</p>
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* Footer CTA */}
      <div className="bg-gradient-to-br from-panel to-slate-900 border border-white/10 p-12 rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
         <div className="flex-1 space-y-4">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Ready to Shard?</h3>
            <p className="text-sm text-sher-muted font-medium uppercase tracking-widest leading-relaxed">
               Join the network of elite brokers scaling their retail desk with risk-first AI.
            </p>
         </div>
         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-sher-accent hover:text-white transition-all">
               Email Partnership Desk
            </button>
            <button className="px-10 py-5 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-700 transition-all">
               Download Kit (PDF)
            </button>
         </div>
      </div>
    </div>
  );
};

export default BrokerSalesKitView;
