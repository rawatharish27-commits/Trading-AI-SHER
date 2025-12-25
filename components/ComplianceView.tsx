
import React from 'react';
import { 
  ShieldCheck, FileText, Scale, Lock, Info, CheckCircle2, 
  AlertTriangle, Landmark, Globe, Handshake, ShieldAlert,
  Gavel, Eye, BookOpen, AlertOctagon
} from 'lucide-react';

const ComplianceView: React.FC = () => {
  const complianceModules = [
    {
      title: "SEBI Algo-Trading Guidelines",
      icon: Scale,
      points: [
        { label: "Circular 2022/23 Adherence", status: "VERIFIED", info: "System architecture matches SEBI's definition of API-based execution." },
        { label: "Approval Pre-requisites", status: "PENDING", info: "Strategy approval required for 100% auto-execution via authorized brokers." },
        { label: "Kill Switch (MANDATORY)", status: "LIVE", info: "Global emergency termination switch fully operational." }
      ]
    },
    {
      title: "Risk & Capital Safeguards",
      icon: ShieldCheck,
      points: [
        { label: "Max Loss Per Trade", status: "LOCKED", info: "Hard-coded 0.5% risk limit per trade across all active sub-accounts." },
        { label: "Position Concentration", status: "MONITORED", info: "Max 10% capital exposure per single instrument/sector." },
        { label: "Latency Heartbeat", status: "LIVE", info: "500ms sync monitoring to prevent stale order execution." }
      ]
    },
    {
      title: "Data Sovereignty (CERT-In)",
      icon: Lock,
      points: [
        { label: "Indian Data Residency", status: "COMPLIANT", info: "All user PII and trade logs stored exclusively in AWS Mumbai region." },
        { label: "256-bit AES Encryption", status: "ACTIVE", info: "Secure vaulting for Broker API keys and TOTP secrets." },
        { label: "Access Control (RBAC)", status: "ACTIVE", info: "Investor/Trader role separation to prevent unauthorized execution." }
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-panel p-8 rounded-[32px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Globe size={160} className="text-sher-accent" /></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Landmark size={32} className="text-sher-accent" /> Regulatory Integrity
          </h2>
          <p className="text-sm text-sher-muted mt-1 font-bold uppercase tracking-widest italic opacity-60">SEBI (Investment Advisers) Regulations Framework & Algo Compliance</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 relative z-10">
          <ShieldCheck size={18} className="text-emerald-400" />
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Compliance Node: Institutional v4.2</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {complianceModules.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.title} className="bg-panel border border-border rounded-3xl p-6 shadow-2xl flex flex-col group hover:border-sher-accent/20 transition-all">
              <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                <div className="p-2 bg-sher-accent/10 rounded-xl text-sher-accent group-hover:scale-110 transition-transform">
                  <Icon size={20} />
                </div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">{module.title}</h3>
              </div>
              
              <div className="space-y-6 flex-1">
                {module.points.map((point) => (
                  <div key={point.label} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-tight">{point.label}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                        point.status === 'LIVE' || point.status === 'LOCKED' || point.status === 'VERIFIED' || point.status === 'COMPLIANT' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {point.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-sher-muted leading-relaxed italic opacity-70 font-medium pl-2 border-l border-white/5">"{point.info}"</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory SEBI Disclosure Block */}
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5"><AlertOctagon size={160} className="text-rose-500" /></div>
         <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4 text-rose-500">
               <ShieldAlert size={32} />
               <h3 className="text-2xl font-black uppercase tracking-tighter">Critical Regulatory Disclosure</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-black text-rose-100/60 uppercase tracking-widest leading-relaxed">
               <p>
                 SHER.AI DOES NOT PROVIDE INVESTMENT ADVICE. ALL ANALYTICS AND SIGNALS ARE FOR INFORMATIONAL AND EDUCATIONAL PURPOSES ONLY. TRADING IN FINANCIAL MARKETS INVOLVES SUBSTANTIAL FINANCIAL RISK.
               </p>
               <p>
                 PAST PERFORMANCE DOES NOT GUARANTEE FUTURE RESULTS. USERS ARE SOLELY RESPONSIBLE FOR THEIR TRADING DECISIONS. CONSULT A CERTIFIED FINANCIAL ADVISOR BEFORE EXECUTING ANY TRADE.
               </p>
            </div>
            <div className="pt-6 border-t border-rose-500/10 flex justify-between items-center">
               <p className="text-[8px] font-black text-rose-500/40 uppercase tracking-[0.4em]">REGULATORY STANDARDS ADHERENCE PROTOCOL v2024.1</p>
               <ShieldCheck size={24} className="text-rose-500 opacity-20" />
            </div>
         </div>
      </div>

      <div className="bg-slate-900/50 border border-border rounded-3xl p-8 flex flex-col md:flex-row gap-8 items-center group">
        <div className="p-5 bg-sher-accent/10 rounded-3xl text-sher-accent border border-sher-accent/20 group-hover:scale-110 transition-transform">
          <Handshake size={48} />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="text-xl font-black text-white uppercase tracking-tight">Legal Classification Notice</h4>
          <p className="text-xs text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-70">
            SHER AI is a quantitative software platform. It is not a registered SEBI Investment Adviser (RIA) or Research Analyst (RA). Use of this software for execution on the Indian markets requires a personal broker account and adherence to the SEBI Circular on algorithmic trading. 
          </p>
        </div>
        <button className="px-8 py-4 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest hover:bg-sher-accent hover:text-white transition-all active:scale-95 shadow-2xl">
          Download Compliance Pack
        </button>
      </div>

      <div className="flex items-center justify-center gap-12 py-8 opacity-20 grayscale hover:grayscale-0 transition-all duration-700 cursor-default">
        <Landmark size={40} className="text-white" />
        <Globe size={40} className="text-white" />
        <FileText size={40} className="text-white" />
        <Gavel size={40} className="text-white" />
      </div>
    </div>
  );
};

export default ComplianceView;
