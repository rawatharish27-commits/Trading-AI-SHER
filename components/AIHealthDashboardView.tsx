
import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldCheck, RefreshCw, BarChart3, Globe,
  AlertTriangle, HeartPulse, BrainCircuit, Lock, 
  TrendingUp, Scale, Database, PieChart as PieIcon,
  ShieldAlert, BarChart as BarChartIcon, Target,
  Gavel, Fingerprint, Shield, ZapOff, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, XAxis as BXAxis, YAxis as BYAxis
} from 'recharts';
import { aiHealthMonitor } from '../lib/services/aiHealthMonitor';
import { NoTradeTrendChart } from './charts/NoTradeTrendChart';
import { RegimeDistributionChart } from './charts/RegimeDistributionChart';
import { LossClusterTimeline } from './charts/LossClusterTimeline';
import { SurvivalScoreTrend } from './charts/SurvivalScoreTrend';

const AIHealthDashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState(aiHealthMonitor.getMetrics());
  const [history, setHistory] = useState(aiHealthMonitor.getHistory());
  const [probData, setProbData] = useState(aiHealthMonitor.getProbDistribution());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({...aiHealthMonitor.getMetrics()});
      setHistory([...aiHealthMonitor.getHistory()]);
      setProbData(aiHealthMonitor.getProbDistribution());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const noTradeRate = aiHealthMonitor.getNoTradeRate().toFixed(1);
  const rejectionData = Object.entries(metrics.rejectionReasons).map(([name, value]) => ({ name, value }));

  const regimeData = [
    { regime: 'TRENDING', value: 58 },
    { regime: 'CHOPPY', value: 32 },
    { regime: 'PANIC', value: 10 }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8 pb-32 animate-in fade-in duration-700">
      
      {/* 🏥 INSTITUTIONAL CONTROL HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-surface-dark p-10 border border-border-dark rounded-inst relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none"><ShieldCheck size={320} /></div>
        
        <div className="flex items-center gap-8 relative z-10">
           <div className="w-20 h-20 bg-sher-accent/10 rounded-inst flex items-center justify-center text-sher-accent border border-sher-accent/20">
              <HeartPulse size={40} className="animate-pulse" />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                AI Health <span className="text-sher-accent not-italic">& Governance</span>
              </h2>
              <div className="flex items-center gap-4 mt-4">
                 <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] flex items-center gap-2">
                    <Globe size={12} className="text-sher-accent" /> Shard: sovereign-integrity-v4
                 </p>
                 <div className="h-1 w-1 rounded-full bg-border-dark" />
                 <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em] flex items-center gap-2">
                    <ShieldCheck size={12} /> Status: Operational
                 </p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-12 relative z-10 mt-8 lg:mt-0">
           <div className="text-right group cursor-help">
              <p className="metric-label mb-1 flex items-center justify-end gap-2">
                 Decision Withheld Rate <Info size={10} />
              </p>
              <p className="text-4xl font-black text-amber-500 tabular-nums tracking-tighter">{noTradeRate}%</p>
              {/* Tooltip Shard */}
              <div className="absolute hidden group-hover:block top-full right-0 mt-2 w-64 p-4 bg-slate-900 border border-white/10 rounded-inst z-50 shadow-2xl">
                 <p className="text-[9px] text-white font-bold uppercase leading-relaxed">
                    No-trade decisions indicate disciplined filtering of high-entropy noise, not missed opportunity.
                 </p>
              </div>
           </div>
           <button 
             onClick={() => { setIsSyncing(true); setTimeout(() => setIsSyncing(false), 800); }}
             className="p-5 bg-bg-dark rounded-inst text-sher-muted hover:text-white border border-border-dark transition-all active:scale-95 shadow-2xl"
           >
              <RefreshCw size={28} className={isSyncing ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* 📊 KPI CORE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {[
           { label: 'Decision Logic Ingests', val: metrics.signalsGenerated, sub: 'Total logic snapshots', icon: Database, color: 'text-sher-accent' },
           { label: 'Withheld Decisions', val: `${((metrics.signalsRejected / (metrics.signalsGenerated || 1)) * 100).toFixed(0)}%`, sub: 'Impulse Suppression', icon: ShieldAlert, color: 'text-emerald-500' },
           { label: 'Observed Hit Rate', val: `${((metrics.avgProbability || 0.82) * 100).toFixed(0)}%`, sub: 'Favorable Outcomes', icon: BrainCircuit, color: 'text-amber-500' },
           { label: 'Defensive Mode Triggers', val: metrics.lossClusterEvents, sub: 'Loss Cluster Gating', icon: AlertTriangle, color: 'text-rose-500' },
         ].map((stat, i) => (
           <div key={i} className="card group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.06] transition-opacity"><stat.icon size={64} /></div>
              <div className="flex justify-between items-center mb-6">
                <div className={`p-3 rounded-inst bg-white/5 ${stat.color} border border-current border-opacity-10`}>
                  <stat.icon size={18} />
                </div>
                <p className="text-[10px] font-black text-sher-muted uppercase tracking-[0.2em]">{stat.label}</p>
              </div>
              <p className="metric-value">{stat.val}</p>
              <p className="text-[9px] text-sher-muted mt-3 font-bold uppercase tracking-tight italic opacity-40">"{stat.sub}"</p>
           </div>
         ))}
      </div>

      {/* 📉 PRIMARY BEHAVIOURAL CHARTS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         
         {/* NO-TRADE Trend Shard */}
         <div className="xl:col-span-8 card">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="section-title !mb-1">
                     <TrendingUp size={16} className="text-sher-accent" /> Discipline Fidelity Curve
                  </h3>
                  <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest mt-1">Institutional Withholding Trend (Last 50 cycles)</p>
               </div>
               <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-sher-accent shadow-[0_0_8px_#2B6CB0]"/>
                    <span className="text-[8px] font-black text-text-secondary uppercase">Restraint %</span>
                  </div>
               </div>
            </div>
            <div className="h-[320px] w-full">
               <NoTradeTrendChart data={history} />
            </div>
         </div>

         {/* Regime Distribution Shard */}
         <div className="xl:col-span-4 card flex flex-col">
            <h3 className="section-title">
               <PieIcon size={14} className="text-sher-accent" /> Regime Resilience Matrix
            </h3>
            <div className="flex-1 min-h-[250px] flex items-center justify-center">
               <RegimeDistributionChart data={regimeData} />
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
               <p className="text-[9px] text-sher-muted font-black leading-relaxed uppercase opacity-70 italic text-center px-6">
                 Regime confidence reflects clarity of market structure. Low confidence environments intentionally reduce AI activity.
               </p>
            </div>
         </div>
      </div>

      {/* 📉 PHASE 3: RISK & SURVIVAL SHARDS */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-6 card">
            <h3 className="section-title">
               <ShieldAlert size={16} className="text-rose-500" /> Adverse Cluster Timeline
            </h3>
            <div className="h-[260px] w-full">
              <LossClusterTimeline data={history} />
            </div>
            <p className="text-[8px] text-sher-muted font-bold uppercase tracking-widest mt-6 text-center italic">
              Adverse clusters indicate periods where AI <span className="text-rose-500">automatically tightened</span> risk controls to preserve firm capital.
            </p>
          </div>

          <div className="xl:col-span-6 card">
            <h3 className="section-title">
               <ShieldCheck size={16} className="text-emerald-500" /> Capital Preservation Index
            </h3>
            <div className="h-[260px] w-full">
              <SurvivalScoreTrend data={history} />
            </div>
            <p className="text-[8px] text-sher-muted font-bold uppercase tracking-widest mt-6 text-center italic">
              The Index reflects <span className="text-emerald-500">risk discipline</span> and capital preservation behavior, not returns.
            </p>
          </div>
      </div>

      {/* ⚖️ GOVERNANCE & PROBABILITY DISTRIBUTION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
         
         {/* Probability Histogram */}
         <div className="xl:col-span-4 card">
            <h3 className="section-title">
               <BarChartIcon size={16} className="text-sher-accent" /> Conviction Clustering
            </h3>
            <div className="h-[300px] w-full mt-8">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={probData}>
                     <BXAxis dataKey="range" fontSize={8} axisLine={false} tickLine={false} stroke="#6B7280" />
                     <BYAxis hide />
                     <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '2px' }} />
                     <Bar dataKey="count" fill="#2B6CB0" radius={[2, 2, 0, 0]}>
                        {probData.map((entry, index) => (
                           <Cell key={index} fill={index >= 3 ? '#2F855A' : '#2B6CB0'} opacity={0.6 + (index * 0.1)} />
                        ))}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
            <p className="text-[8px] text-sher-muted font-bold uppercase tracking-widest mt-6 text-center italic">
              High-fidelity signals must cluster above <span className="text-emerald-500">80% Confidence</span>.
            </p>
         </div>

         {/* Shard Veto Analytics */}
         <div className="xl:col-span-5 card">
            <h3 className="section-title">
               <Scale size={16} className="text-amber-500" /> Veto Attribution Matrix
            </h3>
            <div className="space-y-8 mt-10">
               {rejectionData.map((item) => (
                 <div key={item.name} className="space-y-3 group">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-sher-muted group-hover:text-white transition-colors">{item.name}</span>
                       <span className="text-white tabular-nums">{item.value} Withheld</span>
                    </div>
                    <div className="h-1 w-full bg-bg-dark rounded-inst overflow-hidden border border-white/5">
                       <div 
                          className="h-full bg-amber-600 shadow-[0_0_8px_rgba(183,121,31,0.4)] transition-all duration-1000" 
                          style={{ width: `${(Number(item.value) / (Number(metrics.signalsRejected) || 1)) * 100}%` }} 
                       />
                    </div>
                 </div>
               ))}
               {rejectionData.length === 0 && (
                 <div className="h-full flex items-center justify-center py-12 opacity-30">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Withholding Events Recorded</p>
                 </div>
               )}
            </div>
         </div>

         {/* Governance Shard */}
         <div className="xl:col-span-3 bg-gradient-to-br from-sher-accent to-[#1E3A8A] rounded-inst p-10 flex flex-col justify-center relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Gavel size={200} /></div>
            <div className="relative z-10 space-y-6">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-inst border border-white/20 text-[9px] font-black text-white uppercase tracking-widest">
                  <ShieldCheck size={12} /> Compliance v4.2
               </div>
               <h4 className="text-3xl font-black text-white uppercase tracking-tighter leading-none italic">Discipline <br/> Handbook.</h4>
               <p className="text-[11px] text-white/70 font-medium leading-relaxed uppercase tracking-wider">
                 Restraint is the ultimate Alpha. By sharding high-entropy noise, the core preserves firm capital for low-variance regimes.
               </p>
               <button className="px-8 py-4 bg-white text-black rounded-inst font-black text-[9px] uppercase tracking-widest hover:bg-bg-dark hover:text-white transition-all active:scale-95 shadow-2xl flex items-center justify-center gap-3">
                  Export Compliance <Database size={14} />
               </button>
            </div>
         </div>

      </div>
    </div>
  );
};

export default AIHealthDashboardView;
