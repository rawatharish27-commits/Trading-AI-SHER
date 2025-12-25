
import React from 'react';
import { PitchMetrics } from '../types';
import { 
  Award, TrendingUp, ShieldCheck, Target, 
  BarChart3, Landmark, Activity, Fingerprint, Lock, ChevronRight
} from 'lucide-react';

const MetricBox = ({ label, value, sub, icon: Icon, color }: any) => (
  <div className="bg-panel border border-border p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Icon size={100} /></div>
    <div className="relative z-10 space-y-4">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner ${color}`}>
          <Icon size={24} />
       </div>
       <div>
          <p className="text-[10px] font-black text-sher-muted uppercase tracking-[0.3em]">{label}</p>
          <p className="text-4xl font-black text-white tracking-tighter tabular-nums mt-1">{value}</p>
          <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest mt-2">{sub}</p>
       </div>
    </div>
  </div>
);

const PitchMetricsView: React.FC<{ metrics: PitchMetrics }> = ({ metrics }) => {
  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/40 p-10 rounded-[48px] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-6">
           <div className="p-4 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20">
              <Landmark size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Institutional Integrity</h2>
              <p className="text-[10px] text-sher-muted font-bold uppercase tracking-[0.4em] mt-2">Validated Pitch-Ready Analytics v4.5</p>
           </div>
        </div>
        <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-sher-accent hover:text-white transition-all flex items-center gap-3">
           <Fingerprint size={16} /> Audit Verified
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <MetricBox label="Compounded Alpha" value={`${metrics.cagr.toFixed(1)}%`} sub="Annualized Growth Projection" icon={TrendingUp} color="text-emerald-400 bg-emerald-500/10" />
        <MetricBox label="Sharpe Efficiency" value={metrics.sharpeRatio.toFixed(2)} sub="Risk-Adjusted Return Index" icon={Award} color="text-sher-accent bg-sher-accent/10" />
        <MetricBox label="Max System Drawdown" value={`-${metrics.maxDrawdown}%`} sub="Peak-to-Valley Volatility" icon={ShieldCheck} color="text-rose-400 bg-rose-500/10" />
        <MetricBox label="Profit Factor" value={metrics.profitFactor.toFixed(2)} sub="Alpha Generation Multiplier" icon={Target} color="text-amber-400 bg-amber-500/10" />
        <MetricBox label="Process Discipline" value={`${metrics.processScore}%`} sub="Zero-Discretionary Fidelity" icon={Lock} color="text-purple-400 bg-purple-500/10" />
        <MetricBox label="Recovery Vector" value={`${metrics.recoveryFactor}x`} sub="Drawdown Recovery Ratio" icon={Activity} color="text-blue-400 bg-blue-500/10" />
      </div>

      <div className="bg-panel border border-border rounded-[48px] p-12 shadow-2xl flex flex-col md:flex-row gap-12 items-center relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart3 size={160} className="text-white" /></div>
         <div className="flex-1 space-y-6 relative z-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">"Data, Probability, and Discipline."</h3>
            <p className="text-lg text-sher-muted font-medium leading-relaxed uppercase tracking-wide">
               Every metric is cross-referenced with exchange settlement logs. The Sher Sovereign Engine ensures zero emotional leakage in capital sharding.
            </p>
            <div className="flex gap-4">
               {['Validated', 'Non-Custodial', 'Sovereign'].map(tag => (
                 <span key={tag} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-sher-accent">
                   #{tag}
                 </span>
               ))}
            </div>
         </div>
         <div className="w-full md:w-auto relative z-10">
            <button className="w-full px-12 py-6 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-sher-accent hover:text-white transition-all flex items-center justify-center gap-3">
               Request Data Shard <ChevronRight size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default PitchMetricsView;
