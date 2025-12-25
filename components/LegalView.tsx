
import React, { useState } from 'react';
import { FileText, ShieldAlert, Lock, RefreshCcw, ChevronRight, Scale, Gavel, Eye, CreditCard, Info, ShieldCheck, Zap } from 'lucide-react';

const LegalView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'TERMS' | 'PRIVACY' | 'REFUND'>('ABOUT');

  const content = {
    ABOUT: {
      title: "About SHER.AI",
      icon: Zap,
      sections: [
        {
          h: "Institutional Alpha for Retail Quants",
          p: "SHER.AI is an AI-powered trading intelligence platform designed to assist traders by providing probability-based insights, risk analysis, and transparent decision-making tools. Our system focuses on data, probability, and discipline — not emotions."
        },
        {
          h: "Our Mission",
          p: "To bridge the gap between institutional prop-desks and retail traders by providing the same level of high-fidelity analysis and automated execution safeguards."
        },
        {
          h: "Risk Disclaimer",
          p: "Trading in financial markets involves significant risk. Losses can exceed expectations due to market volatility, liquidity issues, or unforeseen events. SHER.AI is NOT responsible for any financial loss. All signals, analytics, and insights provided are for educational and informational purposes only. Please consult your certified financial advisor before taking any trade."
        }
      ]
    },
    TERMS: {
      title: "Terms & Conditions",
      icon: Gavel,
      sections: [
        {
          h: "1. No Financial Advice",
          p: "SHER.AI provides AI-based analytics and insights only. We do not guarantee profits or returns. Users acknowledge that trading involves substantial risk. All decisions are taken solely by the user."
        },
        {
          h: "2. Acceptance of Risk",
          p: "By using Sher AI, you acknowledge that trading in financial markets involves high risk. AI-generated signals are probabilistic and do not guarantee profit. You are solely responsible for your trade execution and capital exposure."
        },
        {
          h: "3. System Failures",
          p: "Execution is dependent on third-party broker APIs. We are not liable for losses resulting from API downtime, network latency, or algorithmic 'slippage' during fast-moving market regimes."
        }
      ]
    },
    PRIVACY: {
      title: "Privacy Policy",
      icon: Eye,
      sections: [
        {
          h: "1. Data Commitment",
          p: "SHER.AI respects user privacy. We collect only necessary information to provide our services. No personal data is sold or shared with third parties."
        },
        {
          h: "2. Vault Encryption",
          p: "Your broker API keys and TOTP secrets are encrypted using AES-256 GCM on your local device before transmission. We never store raw credentials on our centralized servers."
        }
      ]
    },
    REFUND: {
      title: "Refund & Billing Policy",
      icon: CreditCard,
      sections: [
        {
          h: "1. Subscription-Based Access",
          p: "Sher AI operates on a pre-paid subscription model. Access to Pro and Elite nodes is provisioned immediately upon successful payment verification."
        },
        {
          h: "2. No-Refund Policy",
          p: "Due to the digital nature of our alpha signals and immediate compute resource allocation, all sales are final. We do not offer partial or full refunds."
        }
      ]
    }
  };

  const activeDoc = content[activeTab];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 pt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-panel p-8 rounded-[40px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><activeDoc.icon size={120} className="text-sher-accent" /></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Information Vault</h2>
          <p className="text-sm text-sher-muted mt-1 uppercase font-bold tracking-widest">Legal Framework & Transparency Protocols</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-white/5 relative z-10 overflow-x-auto max-w-full scrollbar-none">
           {(['ABOUT', 'TERMS', 'PRIVACY', 'REFUND'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-sher-accent text-white shadow-lg shadow-sher-accent/20' : 'text-sher-muted hover:text-white'}`}
             >
               {tab === 'ABOUT' ? 'About Us' : tab}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-panel border border-border rounded-[40px] p-10 shadow-2xl space-y-10">
         <div className="flex items-center gap-4 border-b border-white/5 pb-8">
            <div className="p-4 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20 shadow-inner">
               <activeDoc.icon size={32} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{activeDoc.title}</h3>
         </div>

         <div className="space-y-12">
            {activeDoc.sections.map((sec, i) => (
              <div key={i} className="space-y-4 group">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-sher-accent rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">{sec.h}</h4>
                 </div>
                 <p className="text-sm text-sher-muted leading-relaxed font-medium pl-4 border-l border-white/5 ml-0.5">
                    {sec.p}
                 </p>
              </div>
            ))}
         </div>

         <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
               <Scale size={18} className="text-sher-muted" />
               <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">Sher AI Core: Stable Release 4.1</p>
            </div>
            <button className="flex items-center gap-2 text-sher-accent font-black text-[10px] uppercase tracking-[0.2em] hover:underline">
               Download Full Disclosure <ChevronRight size={14} />
            </button>
         </div>
      </div>

      <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-8 flex items-start gap-6">
         <ShieldAlert size={24} className="text-rose-500 shrink-0 mt-1" />
         <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Mandatory Risk Warning (CRITICAL)</h4>
            <p className="text-[11px] text-sher-muted mt-2 leading-relaxed">
               <strong>SHER.AI IS NOT RESPONSIBLE FOR ANY FINANCIAL LOSS.</strong> All signals, analytics, and insights are for educational and informational purposes only. Please consult your certified financial advisor before taking any trade.
            </p>
         </div>
      </div>
    </div>
  );
};

export default LegalView;
