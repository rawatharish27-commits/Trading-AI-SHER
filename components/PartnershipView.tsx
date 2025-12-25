
import React from 'react';
import { 
  Zap, Handshake, ArrowRight, ShieldCheck, Activity, Target, 
  Globe, Layout, Briefcase, Mail, Send, ChevronRight, Landmark
} from 'lucide-react';

const PartnershipView: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-panel p-10 rounded-[40px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Handshake size={200} className="text-sher-accent" /></div>
        <div className="relative z-10">
          <span className="px-3 py-1 bg-sher-accent/10 border border-sher-accent/20 rounded-full text-[9px] font-black text-sher-accent uppercase tracking-widest">Institutional Growth Protocol</span>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter mt-4 leading-none">Broker Partnerships</h2>
          <p className="text-sm text-sher-muted mt-2 font-bold uppercase tracking-widest opacity-60">Scale your retail desk with risk-first AI intelligence.</p>
        </div>
        <div className="hidden lg:flex gap-2 relative z-10">
           <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95 flex items-center gap-2">
             <Send size={16} /> Request Pilot Shard
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-panel border border-border rounded-[32px] p-8 shadow-2xl">
             <h3 className="text-lg font-black text-white uppercase tracking-widest mb-10 flex items-center gap-3">
                <Target size={24} className="text-sher-accent" /> Value to Institutional Desks
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { t: 'Higher Retention', d: 'Users survive longer in market regimes due to automated capital protection.', i: Activity },
                  { t: 'Disciplined Flow', d: 'AI filtering reduces impulsive overtrading and emotional churn.', i: ShieldCheck },
                  { t: 'Compliance Native', d: 'Immutable audit logs for every user-authorized order dispatch.', i: Landmark },
                  { t: 'Volume Quality', d: 'Better trades lead to higher account values and sustainable brokerage revenue.', i: Zap },
                ].map((item, i) => (
                  <div key={i} className="space-y-4 group">
                     <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-sher-muted group-hover:text-sher-accent transition-all group-hover:scale-110">
                        <item.i size={24} />
                     </div>
                     <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.t}</h4>
                     <p className="text-xs text-sher-muted leading-relaxed font-medium uppercase tracking-wider opacity-60">"{item.d}"</p>
                  </div>
                ))}
             </div>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8">
             <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Partnership Roadmap</h3>
             <div className="space-y-6">
                {[
                  'API Integration & Authentication Handshake',
                  'Client-Level Risk Barrier Mapping',
                  'White-Label Terminal Provisioning',
                  'Joint Compliance & SEBI Framework Audit'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-6 group">
                     <div className="w-10 h-10 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center font-black text-xs text-sher-accent">{i + 1}</div>
                     <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em] group-hover:text-white transition-colors">{step}</span>
                     <div className="flex-1 h-px bg-white/5" />
                     <ChevronRight size={16} className="text-sher-muted" />
                  </div>
                ))}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-gradient-to-br from-sher-accent to-blue-700 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700"><Globe size={180} /></div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                 <Zap size={20} fill="currentColor" /> Why Sher AI?
              </h3>
              <p className="text-xs font-bold leading-relaxed uppercase tracking-wider opacity-80 mb-8">
                "We don't sell 'sure-shot' signals. We provide the infrastructure for traders to manage risk and probability like a professional prop-desk."
              </p>
              <div className="space-y-4">
                 {['NoAssurredReturns', 'UserConsentPriority', 'InstitutionalGradeRisk', 'AuditTransparency'].map(tag => (
                   <div key={tag} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-white" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{tag}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-panel border border-border rounded-[32px] p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
              <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20">
                 <Mail size={32} />
              </div>
              <div>
                 <h4 className="text-sm font-black text-white uppercase tracking-tight">Direct Node Contact</h4>
                 <p className="text-[10px] text-sher-muted mt-1 uppercase font-bold tracking-widest">partnerships@sher.ai</p>
              </div>
              <button className="w-full py-4 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all">
                 Download Pitch Deck (PDF)
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PartnershipView;
