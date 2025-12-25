
import React from 'react';
import { ShieldCheck, ZapOff, Activity, Info, ArrowUpRight } from 'lucide-react';

interface NoTradeExplanationCardProps {
  symbol: string;
  reason: string;
}

const NoTradeExplanationCard: React.FC<NoTradeExplanationCardProps> = ({ symbol, reason }) => {
  return (
    <div className="bg-panel border-2 border-amber-500/20 rounded-[40px] p-10 space-y-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
      <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none rotate-12">
        <ZapOff size={240} className="text-amber-500" />
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="w-24 h-24 bg-amber-500/10 rounded-[32px] flex items-center justify-center text-amber-500 border-2 border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
          <ShieldCheck size={48} />
        </div>
        <div className="text-center md:text-left space-y-2">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Capital <span className="text-amber-400 not-italic">Preserved</span></h2>
           <p className="text-xs text-sher-muted font-black uppercase tracking-[0.3em]">Status: Decision withheld as probability did not meet risk-adjusted threshold.</p>
        </div>
      </div>

      <div className="bg-slate-950 p-8 rounded-[32px] border border-white/5 space-y-4 relative z-10">
         <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
            <Info size={14} /> Compliance Verdict for {symbol}
         </p>
         <p className="text-lg text-gray-300 font-medium leading-relaxed uppercase tracking-tight italic">
            "The neural core detected a high-entropy regime conflict. Entering this unit would violate the Sovereign Discipline Protocol. Decision withheld at the {reason} logic node to prevent unfavorable outcome."
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
         <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
            <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1">Preservation Impact</p>
            <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter flex items-center gap-2">
               <ArrowUpRight size={14} /> Stability Index +0.4%
            </p>
         </div>
         <button className="w-full py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sher-accent hover:text-white transition-all shadow-xl active:scale-95">
            Acknowledge Withholding
         </button>
      </div>
    </div>
  );
};

export default NoTradeExplanationCard;
