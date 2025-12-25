
import React, { useState } from 'react';
import { Gift, Copy, Check, Users, Sparkles, ChevronRight, Zap } from 'lucide-react';

const ReferralWidget: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://sher.ai/invite/SHER-772-X";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-panel border border-border rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
         <Sparkles size={120} className="text-sher-accent" />
      </div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
              <Gift size={24} />
           </div>
           <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Expand the Network</h3>
              <p className="text-[9px] text-sher-muted font-bold uppercase tracking-[0.2em] mt-1">Institutional Referral Program</p>
           </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 space-y-4">
           <p className="text-xs text-gray-400 leading-relaxed font-medium">
             Invite 3 fellow quants to Sher AI and unlock <span className="text-white font-bold">14 days of ELITE tier Access</span> (Automated Execution).
           </p>
           
           <div className="flex items-center gap-2">
              <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono text-sher-muted truncate">
                {referralLink}
              </div>
              <button 
                onClick={handleCopy}
                className={`p-3 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-sher-accent text-white hover:bg-blue-600'}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Invites Joined</p>
              <p className="text-lg font-black text-white">02 <span className="text-[10px] text-sher-accent">/ 03</span></p>
           </div>
           <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
              <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Alpha Unlocked</p>
              <p className="text-lg font-black text-sher-muted flex items-center gap-1"><Lock size={12}/> PRO</p>
           </div>
        </div>

        <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2">
           View Leaderboard <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default ReferralWidget;
