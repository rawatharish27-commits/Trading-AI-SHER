import React from 'react';
import { Activity, ZapOff, TrendingUp, AlertTriangle } from 'lucide-react';

const MarketContextBadge: React.FC<{ regime: string }> = ({ regime }) => {
  const config = {
    TRENDING: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    CHOPPY: { icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    PANIC: { icon: ZapOff, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' }
  };

  const current = (config as any)[regime] || config.CHOPPY;
  const Icon = current.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${current.bg} ${current.border} shadow-lg shadow-black/20 group cursor-help`}>
       <Icon size={12} className={`${current.color} animate-pulse`} />
       <span className={`text-[9px] font-black uppercase tracking-widest ${current.color}`}>Regime: {regime}</span>
       <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-[200]">
          <p className="text-[8px] text-white font-bold uppercase leading-relaxed tracking-tight">
             Market sharding strategy adjusted for {regime} conditions. Entropy level: Low.
          </p>
       </div>
    </div>
  );
};

export default MarketContextBadge;