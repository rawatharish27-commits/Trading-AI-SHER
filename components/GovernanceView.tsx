
import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Scale, Database, Users, 
  Terminal, Power, Activity, BrainCircuit, Landmark,
  Gavel, Fingerprint, Lock, Zap, ChevronRight, AlertTriangle,
  HeartPulse, Layers, TrendingUp
} from 'lucide-react';
import { FirmGovernance, TraderPod } from '../types';

const GovernanceView: React.FC = () => {
  const [governance, setGovernance] = useState<FirmGovernance>({
    maxFirmDrawdown: 6.0,
    correlationLimit: 0.75,
    strategyExposureCap: 15.0,
    realtimeVaR: 425000,
    instantKillSwitch: false,
    aiEthicsPolicy: {
      humanInControl: true,
      martingaleBlocked: true,
      revengeTradingFilter: true,
      explainabilityThreshold: 0.85
    }
  });

  const [pods, setPods] = useState<TraderPod[]>([
    { id: 'pod-1', name: 'Alpha HFT Pod', assignedTraders: ['trader_1', 'trader_2'], maxCapital: 1000000, maxDrawdown: 2.5, allowedStrategies: ['VWAP_RIDE'], leverageLimit: 5, currentEquity: 1025000, pnl: 25000, status: 'ACTIVE' },
    { id: 'pod-2', name: 'Options Scalp Node', assignedTraders: ['trader_4'], maxCapital: 500000, maxDrawdown: 4.0, allowedStrategies: ['VOL_SQUEEZE'], leverageLimit: 10, currentEquity: 480000, pnl: -20000, status: 'WARNED' }
  ]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-10 pb-24 animate-in fade-in duration-700">
      {/* Institutional Mission Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/30 p-10 rounded-[40px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Gavel size={160} className="text-white" /></div>
        <div className="relative z-10 space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
                <Landmark size={32} />
              </div>
              <div>
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Firm Governance</h2>
                 <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
                    <ShieldCheck size={12} className="text-emerald-500" /> Shard Identity: master-prop-node-asia
                 </p>
              </div>
           </div>
        </div>
        <div className="flex gap-6 relative z-10">
           <div className="text-right px-8 border-r border-white/5">
              <p className="text-[10px] font-black text-sher-muted uppercase mb-1">Firm-wide VaR</p>
              <p className="text-2xl font-black text-white">₹{(governance.realtimeVaR / 1000).toFixed(0)}K</p>
           </div>
           <button 
            onClick={() => setGovernance(prev => ({ ...prev, instantKillSwitch: !prev.instantKillSwitch }))}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center gap-3 ${governance.instantKillSwitch ? 'bg-rose-600 text-white animate-pulse' : 'bg-white text-black hover:bg-rose-500 hover:text-white'}`}
           >
             <Power size={18} /> {governance.instantKillSwitch ? 'NODES HALTED' : 'ACTIVATE KILL-SWITCH'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left: Pod Management */}
        <div className="xl:col-span-8 space-y-8">
           <div className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Isolated Trader Pods</h3>
                    <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1">Capital sandboxing & accountability layers</p>
                 </div>
                 <button className="p-3 bg-slate-900 rounded-2xl text-sher-accent hover:bg-sher-accent/10 border border-white/5"><Users size={20} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {pods.map(pod => (
                   <div key={pod.id} className="bg-slate-950 p-7 rounded-[32px] border border-white/5 group hover:border-sher-accent/30 transition-all relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-sher-accent transition-colors">{pod.name}</h4>
                            <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest">{pod.assignedTraders.length} Active Tranching Units</p>
                         </div>
                         <span className={`text-[8px] font-black px-2 py-0.5 rounded ${pod.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {pod.status}
                         </span>
                      </div>

                      <div className="space-y-4 mb-8">
                         <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                            <span className="text-sher-muted">DD Exposure</span>
                            <span className={pod.pnl < 0 ? 'text-rose-500' : 'text-emerald-500'}>₹{pod.pnl.toLocaleString()}</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div className={`h-full ${pod.pnl < 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.abs(pod.pnl / pod.maxCapital * 100)}%` }} />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-slate-900 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Cap Limit</p>
                            <p className="text-xs font-black text-white">₹{(pod.maxCapital/1000).toFixed(0)}K</p>
                         </div>
                         <div className="p-3 bg-slate-900 rounded-2xl border border-white/5">
                            <p className="text-[8px] font-black text-sher-muted uppercase mb-1">Leverage</p>
                            <p className="text-xs font-black text-white">{pod.leverageLimit}x</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                 <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                    <BrainCircuit size={32} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">AI Ethics Core</h3>
                    <p className="text-xs text-sher-muted font-bold uppercase tracking-widest mt-1">Sovereign constraints on autonomous decision nodes</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { label: 'Human-in-Control Shard', d: 'Mandatory trader confirmation for ELITE signals above firm AUM thresholds.', key: 'humanInControl' },
                   { label: 'Martingale Blocking Protocol', d: 'Hard-blocks strategy from increasing size after losses (Account Churn prevention).', key: 'martingaleBlocked' },
                   { label: 'Revenge Trading Filter', d: 'Automated 15-minute lock-out after three consecutive stop-loss hits.', key: 'revengeTradingFilter' }
                 ].map(item => (
                   <div key={item.key} className="flex items-start justify-between p-6 bg-slate-950 rounded-3xl border border-white/5 group hover:bg-slate-900 transition-colors">
                      <div className="space-y-2">
                         <h4 className="text-sm font-black text-white uppercase tracking-tight">{item.label}</h4>
                         <p className="text-[10px] text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-60">"{item.d}"</p>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${ (governance.aiEthicsPolicy as any)[item.key] ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800'}`}>
                         <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${ (governance.aiEthicsPolicy as any)[item.key] ? 'left-7' : 'left-1'}`} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Right: Firm Controls */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Scale size={18} className="text-sher-accent" /> Firm-Wide Constraints
              </h3>

              <div className="space-y-6">
                 {[
                   { label: 'Max Firm Drawdown', val: governance.maxFirmDrawdown, unit: '%', icon: HeartPulse, color: 'text-rose-400' },
                   { label: 'Correlation Limit', val: governance.correlationLimit, unit: '', icon: Layers, color: 'text-amber-400' },
                   { label: 'Strategy Concentration', val: governance.strategyExposureCap, unit: '%', icon: Zap, color: 'text-sher-accent' }
                 ].map(p => (
                   <div key={p.label} className="p-6 bg-slate-950 rounded-[32px] border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                         <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
                            <p.icon size={14} className={p.color} /> {p.label}
                         </p>
                         <span className="text-sm font-black text-white tabular-nums">{p.val}{p.unit}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                         <div className={`h-full ${p.color.replace('text', 'bg')}`} style={{ width: `${(p.val / (p.unit === '%' ? 20 : 1)) * 100}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-sher-accent to-blue-700 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700"><Fingerprint size={120} /></div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                 <ShieldAlert size={20} fill="currentColor" /> Compliance Vault
              </h3>
              <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider opacity-80 mb-8">
                Every sharded execution and risk change is hash-chained and logged for regulatory audit. 
              </p>
              <button className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-100 transition-all">
                 View Audit Logs
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GovernanceView;
