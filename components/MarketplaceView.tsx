
import React, { useState } from 'react';
import { ShoppingCart, Zap, Play, Settings2, BarChart3, TrendingUp, Cpu, Award, Target, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { StrategyMetrics } from '../types';

const MOCK_MARKETPLACE: StrategyMetrics[] = [
    { id: '1', name: 'VWAP Institutional Ride', winRate: 64.2, expectancy: 1.85, drawdown: 3.1, score: 0.88, status: 'ACTIVE' },
    { id: '2', name: 'Neural EMA Crossover v4', winRate: 58.4, expectancy: 1.22, drawdown: 4.5, score: 0.74, status: 'ACTIVE' },
    { id: '3', name: 'Liquidity Sweep Reversal', winRate: 72.1, expectancy: 2.10, drawdown: 8.2, score: 0.82, status: 'DORMANT' },
];

const MarketplaceView: React.FC = () => {
  const [strats, setStrats] = useState(MOCK_MARKETPLACE);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  const handleOptimize = async (id: string) => {
    setOptimizingId(id);
    // Simulate Brute-Force Parameter Tuning
    await new Promise(r => setTimeout(r, 3000));
    setStrats(prev => prev.map(s => s.id === id ? { ...s, score: Math.min(0.99, s.score + 0.05) } : s));
    setOptimizingId(null);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-panel p-8 rounded-[40px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Cpu size={120} className="text-sher-accent" /></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Strategy Marketplace</h2>
          <p className="text-sm text-sher-muted mt-1 uppercase font-bold tracking-widest">Deploy pre-vetted institutional logic nodes.</p>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="px-4 py-2 bg-slate-900 border border-border rounded-2xl flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase">Optimization Core: Active</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strats.map(strat => (
          <div key={strat.id} className="bg-panel border border-border rounded-[32px] p-6 shadow-2xl flex flex-col group hover:border-sher-accent/30 transition-all overflow-hidden relative">
             <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Target size={80} className="text-white" />
             </div>
             
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight group-hover:text-sher-accent transition-colors">{strat.name}</h3>
                   <span className="text-[9px] font-black text-sher-muted uppercase tracking-[0.2em]">{strat.status} NODE</span>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Fitness Score</p>
                   <p className="text-xl font-black text-sher-accent">{(strat.score * 100).toFixed(0)}%</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-8">
                <div className="bg-black/20 p-3 rounded-2xl border border-white/5 text-center">
                   <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Win Rate</p>
                   <p className="text-sm font-black text-emerald-400">{strat.winRate}%</p>
                </div>
                <div className="bg-black/20 p-3 rounded-2xl border border-white/5 text-center">
                   <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Drawdown</p>
                   <p className="text-sm font-black text-rose-400">-{strat.drawdown}%</p>
                </div>
             </div>

             <div className="space-y-4 mt-auto">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter px-1">
                   <span className="text-sher-muted">Performance Weight</span>
                   <span className="text-white">x{(strat.score * 1.5).toFixed(2)}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                   <div className="h-full bg-sher-accent shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all duration-1000" style={{ width: `${strat.score * 100}%` }} />
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-4">
                   <button 
                    onClick={() => handleOptimize(strat.id)}
                    disabled={optimizingId === strat.id}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-border text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                   >
                     {optimizingId === strat.id ? <Loader2 size={12} className="animate-spin" /> : <Settings2 size={12} />}
                     {optimizingId === strat.id ? 'Tuning...' : 'Auto-Tune'}
                   </button>
                   <button className="flex items-center justify-center gap-2 py-3 bg-sher-accent text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-sher-accent/20">
                     <Play size={10} fill="currentColor" /> Deploy Node
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
      
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-[32px] p-8 flex items-center gap-6 group">
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform">
             <Info size={24} />
          </div>
          <div>
             <h4 className="text-xs font-black text-white uppercase tracking-widest">Self-Optimization Logic</h4>
             <p className="text-[10px] text-sher-muted mt-1 leading-relaxed font-bold uppercase tracking-tight">
                "Strategy parameters are automatically tuned every 24 hours using a walk-forward optimization engine. Fitness scores below 60% trigger an automatic quarantine for safety."
             </p>
          </div>
      </div>
    </div>
  );
};

export default MarketplaceView;
