
import React, { useMemo } from 'react';
import { HeatmapEngine } from '../lib/engine/portfolio/HeatmapEngine';
import { PortfolioItem } from '../types';
import { LayoutGrid, Info, ShieldCheck, Activity } from 'lucide-react';

const PortfolioHeatmap: React.FC<{ items: PortfolioItem[] }> = ({ items }) => {
  const nodes = useMemo(() => HeatmapEngine.generate(items), [items]);

  const getColor = (pnl: number) => {
    if (pnl > 2) return 'bg-emerald-500';
    if (pnl > 0.5) return 'bg-emerald-600/60';
    if (pnl > -0.5) return 'bg-slate-800';
    if (pnl > -2) return 'bg-rose-600/60';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
         <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
               <LayoutGrid size={24} className="text-sher-accent" /> Institutional <span className="text-sher-accent not-italic">Exposure Sharding</span>
            </h3>
            <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1">Real-time Risk Concentration Matrix</p>
         </div>
         <div className="flex gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-emerald-500"/><span className="text-[8px] font-black text-sher-muted uppercase">Alpha+</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-rose-500"/><span className="text-[8px] font-black text-sher-muted uppercase">Decay</span></div>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {nodes.map((node) => (
          <div 
            key={node.symbol} 
            className={`aspect-square rounded-3xl p-5 border border-white/5 relative overflow-hidden group transition-all hover:scale-105 hover:z-10 shadow-xl ${getColor(node.pnl)}`}
          >
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
               <Activity size={40} />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                 <p className="text-lg font-black text-white leading-none tracking-tighter uppercase italic">{node.symbol}</p>
                 <p className="text-[8px] font-black text-white/50 uppercase tracking-widest mt-1">{node.sector}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-white uppercase tracking-widest">Weight: {node.weight.toFixed(1)}%</p>
                 <p className="text-sm font-black text-white tabular-nums">{node.pnl > 0 ? '+' : ''}{node.pnl.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-start gap-4">
         <Info size={20} className="text-sher-accent shrink-0 mt-1" />
         <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase">
           Square size represents <span className="text-white">Capital Allocation (Exposure)</span>. Colors represent <span className="text-white">Current Alpha Performance</span>. Clusters indicate sector-level risk drift.
         </p>
      </div>
    </div>
  );
};

export default PortfolioHeatmap;
