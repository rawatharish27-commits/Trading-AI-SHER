
import React from 'react';
import { MarketDepth, FootprintBar } from '../../types';
import { Layers, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MarketDepthWidgetProps {
  depth: MarketDepth;
  footprint: FootprintBar[];
}

const MarketDepthWidget: React.FC<MarketDepthWidgetProps> = ({ depth, footprint }) => {
  const imbalancePct = ((depth.imbalance + 1) / 2) * 100;

  return (
    <div className="bg-panel border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full">
      <div className="p-5 border-b border-border bg-slate-900/40 flex justify-between items-center">
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
          <Layers size={14} className="text-sher-accent" /> Orderflow Depth
        </h3>
        {depth.spoofingDetected && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[8px] font-black animate-pulse">
            <AlertTriangle size={10} /> SPOOFING DETECTED
          </div>
        )}
      </div>

      <div className="p-5 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Imbalance Meter */}
        <div className="space-y-2">
          <div className="flex justify-between text-[8px] font-black uppercase">
             <span className="text-emerald-400">Bids (Buying)</span>
             <span className="text-rose-400">Asks (Selling)</span>
          </div>
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
             <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${imbalancePct}%` }} />
             <div className="h-full bg-rose-500 transition-all duration-700" style={{ width: `${100 - imbalancePct}%` }} />
          </div>
          <p className="text-center text-[9px] font-bold text-sher-muted uppercase">
            Order Imbalance: {(depth.imbalance * 100).toFixed(1)}%
          </p>
        </div>

        {/* DOM Table */}
        <div className="grid grid-cols-2 gap-px bg-white/5 rounded-xl overflow-hidden border border-white/5">
           <div className="bg-slate-950 p-3">
              <p className="text-[8px] font-black text-emerald-500 uppercase mb-2">Bids</p>
              {depth.bids.map((b, i) => (
                <div key={i} className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-emerald-400/70">{b.price.toFixed(2)}</span>
                  <span className="text-white font-bold">{b.qty}</span>
                </div>
              ))}
           </div>
           <div className="bg-slate-950 p-3">
              <p className="text-[8px] font-black text-rose-500 uppercase mb-2 text-right">Asks</p>
              {depth.asks.map((a, i) => (
                <div key={i} className="flex justify-between text-[10px] font-mono mb-1">
                  <span className="text-white font-bold">{a.qty}</span>
                  <span className="text-rose-400/70">{a.price.toFixed(2)}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Footprint Delta */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest">Footprint Delta node</p>
          <div className="space-y-1">
            {footprint.slice(0, 6).map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-gray-500 w-12">{f.price.toFixed(1)}</span>
                <div className="flex-1 h-3 bg-slate-900 rounded flex overflow-hidden">
                   <div className="h-full bg-emerald-500/30 border-r border-emerald-500/20" style={{ width: `${(f.buyVol / 500) * 100}%` }} />
                   <div className="h-full bg-rose-500/30" style={{ width: `${(f.sellVol / 500) * 100}%` }} />
                </div>
                <span className={`text-[9px] font-black w-8 text-right ${f.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {f.delta > 0 ? '+' : ''}{f.delta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-slate-950 border-t border-border flex items-center justify-between">
         <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black text-sher-muted uppercase">Audit: Neutral</span>
         </div>
         <span className="text-[8px] font-black text-sher-accent uppercase animate-pulse">Live Tape Feed</span>
      </div>
    </div>
  );
};

export default MarketDepthWidget;
