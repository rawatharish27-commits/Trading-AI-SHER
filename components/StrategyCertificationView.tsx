
import React, { useMemo } from 'react';
import { ShieldCheck, Award, Zap, AlertTriangle, ChevronRight, Activity, Landmark, Target, BarChart3, Clock } from 'lucide-react';
import { StrategyCertification } from '../types';

const MetricRing = ({ label, value, color }: any) => (
  <div className="flex flex-col items-center gap-3">
     <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center relative ${color}`}>
        <span className="text-xl font-black text-white tabular-nums">{value}%</span>
     </div>
     <span className="text-[8px] font-black text-sher-muted uppercase tracking-widest">{label}</span>
  </div>
);

const StrategyCertificationView: React.FC<{ cert: StrategyCertification }> = ({ cert }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Award size={160} /></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border-2 shadow-2xl ${cert.status === 'CERTIFIED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              <ShieldCheck size={40} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                 <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sovereign Certification</h2>
                 <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${cert.status === 'CERTIFIED' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{cert.status}</span>
              </div>
              <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-2">Logic Node ID: {cert.strategyId}</p>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="text-right px-8 border-r border-white/5">
                <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Max Capital Cap</p>
                <p className="text-2xl font-black text-white">₹{(cert.maxAUMAllocation / 100000).toFixed(1)}L</p>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Certification Expiry</p>
                <p className="text-sm font-black text-white uppercase">{new Date(cert.expiryDate).toLocaleDateString()}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 pt-12 border-t border-white/5">
           <MetricRing label="Quant Stability" value={cert.scorecard.quantStability} color="border-emerald-500/30" />
           <MetricRing label="Risk Fidelity" value={cert.scorecard.riskFidelity} color="border-sher-accent/30" />
           <MetricRing label="Regime Resilience" value={cert.scorecard.regimeResilience} color="border-purple-500/30" />
           <MetricRing label="Latency Buffer" value={cert.scorecard.latencyBuffer} color="border-amber-500/30" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
               <Activity size={18} className="text-sher-accent" /> Audited Market Environments
            </h3>
            <div className="grid grid-cols-1 gap-3">
               {cert.certifiedRegimes.map(reg => (
                  <div key={reg} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">{reg} REGIME</span>
                     <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase">PASS</span>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-gradient-to-br from-panel to-slate-900 border border-white/10 rounded-[40px] p-10 flex flex-col justify-center space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Landmark size={120} /></div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Institutional Veto Right</h3>
            <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-80">
              This certification grants the strategy node permission to execute on production broker shards. If any metric drifts more than 15% from these baselines, the certification is automatically revoked.
            </p>
            <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-xl hover:bg-sher-accent hover:text-white transition-all">
               Initiate Recertification Shard
            </button>
         </div>
      </div>
    </div>
  );
};

export default StrategyCertificationView;
