
import React, { useState, useEffect } from 'react';
import { PortfolioItem } from '../../types';
import { Briefcase, ArrowUpRight, ArrowDownRight, ShieldCheck, Layers, RefreshCw } from 'lucide-react';

const PositionsWidget: React.FC = () => {
  const [positions, setPositions] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPositions = async () => {
    try {
      const res = await fetch('/api/broker/portfolio');
      if (res.ok) {
        const data = await res.json();
        setPositions(data.holdings || []);
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Position Fetch Failed", e);
    }
  };

  useEffect(() => {
    fetchPositions();
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-panel border border-border rounded-3xl flex flex-col overflow-hidden shadow-2xl h-full">
        <div className="p-6 border-b border-border flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Briefcase size={16} />
                </div>
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Open Units</h3>
            </div>
            <span className="text-[9px] font-black bg-white/5 px-3 py-1 rounded-full text-sher-muted border border-white/5 uppercase tracking-widest">
                {positions.length} Active Nodes
            </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[300px]">
            {positions.length > 0 ? (
                <table className="w-full text-left">
                    <thead className="sticky top-0 bg-panel z-10 text-[9px] font-black text-sher-muted uppercase tracking-widest">
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4">Asset Node</th>
                            <th className="px-6 py-4 text-right">LTP</th>
                            <th className="px-6 py-4 text-right">ROI DELTA</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {positions.map(pos => (
                            <tr key={pos.symbol} className="hover:bg-white/5 transition-all group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1 h-6 rounded-full ${pos.pnl >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-rose-500'}`} />
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-sher-accent transition-colors">{pos.symbol}</span>
                                            <span className="text-[9px] font-bold text-sher-muted uppercase">Qty {pos.quantity}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-[11px] font-black text-white tabular-nums">₹{pos.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-[8px] font-bold text-sher-muted uppercase">@{pos.avgPrice.toFixed(2)}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className={`text-[11px] font-black tabular-nums ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {pos.pnl >= 0 ? '+' : ''}₹{pos.pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </p>
                                    <div className={`text-[9px] font-black flex items-center justify-end gap-1 ${pos.pnlPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {pos.pnlPercent >= 0 ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                                        {Math.abs(pos.pnlPercent).toFixed(2)}%
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center border border-white/5 opacity-50">
                        <ShieldCheck size={32} className="text-sher-muted" />
                    </div>
                    <div>
                        <p className="text-[10px] text-white font-black uppercase tracking-[0.2em]">Zero Exposure</p>
                        <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest mt-2 max-w-[180px] mx-auto leading-relaxed">
                            No active capital exposure. Scanning for institutional entry points.
                        </p>
                    </div>
                </div>
            )}
        </div>
        
        <div className="p-6 border-t border-border bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
                    <Layers size={12} className="text-sher-accent" /> Risk Headroom
                </span>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">74% Available</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <div 
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000 ease-out" 
                    style={{ width: '74%' }} 
                />
            </div>
        </div>
    </div>
  );
};

export default PositionsWidget;
