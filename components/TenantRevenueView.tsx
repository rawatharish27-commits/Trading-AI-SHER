
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, RefreshCw, Globe, Briefcase, Calculator, 
  CreditCard, ShieldCheck, Activity, Award
} from 'lucide-react';
import { TenantRevenueStats } from '../types';

const MOCK_REVENUE_DATA = [
  { month: 'Jan', revenue: 420000 }, 
  { month: 'Feb', revenue: 580000 },
  { month: 'Mar', revenue: 720000 }, 
  { month: 'Apr', revenue: 840000 },
  { month: 'May', revenue: 1020000 }, 
  { month: 'Jun', revenue: 1240000 },
];

const STREAM_DISTRIBUTION = [
  { name: 'Pro Tier', value: 55, color: '#3B82F6' },
  { name: 'Elite Tier', value: 35, color: '#A855F7' },
  { name: 'Custom B2B', value: 10, color: '#10B981' },
];

const TenantRevenueView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const stats: TenantRevenueStats = {
    totalRevenue: 1240000,
    mrr: 840000,
    subscriptions: 312,
    arpu: 2690,
    churn: 3.2,
    growth: 18.5,
    ltv: 42000,
  };

  const formatCurrency = (val: number) => `₹${(val / 1000).toFixed(0)}K`;

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-700">
      {/* Institutional Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-8 rounded-[40px] border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20 shadow-2xl">
            <Calculator size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">Revenue Alpha</h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <Globe size={12} className="text-sher-accent" /> Financial Shard: master-revenue-01
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
           <div className="text-right px-6 border-r border-white/5">
              <p className="text-[10px] font-black text-sher-muted uppercase mb-1">Session MRR</p>
              <p className="text-2xl font-black text-white tabular-nums">₹{(stats.mrr / 100000).toFixed(1)}L</p>
           </div>
           <button 
             onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 800);
             }} 
             className="p-4 bg-white/5 rounded-2xl text-sher-muted hover:text-white transition-all"
           >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Growth Shard', value: `+${stats.growth}%`, sub: 'MoM Expansion', icon: TrendingUp, color: 'text-emerald-400' },
           { label: 'Active Licenses', value: stats.subscriptions, sub: 'Validated Nodes', icon: Users, color: 'text-sher-accent' },
           { label: 'Churn Barrier', value: `${stats.churn}%`, sub: 'Retention Index', icon: Activity, color: 'text-amber-400' },
           { label: 'Unit ARPU', value: `₹${(stats.arpu / 1000).toFixed(1)}K`, sub: 'Avg Revenue', icon: Award, color: 'text-purple-400' },
         ].map((kpi, i) => (
           <div key={i} className="bg-panel border border-border p-6 rounded-3xl shadow-xl">
              <div className={`p-2.5 rounded-xl bg-white/5 w-fit mb-4 ${kpi.color}`}>
                <kpi.icon size={18} />
              </div>
              <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest">{kpi.label}</p>
              <p className="text-2xl font-black text-white mt-1 tabular-nums">{kpi.value}</p>
              <p className="text-[10px] text-sher-muted mt-2 font-bold uppercase tracking-tight opacity-60">{kpi.sub}</p>
           </div>
         ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
         <div className="xl:col-span-8 bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-2">
               <TrendingUp size={20} className="text-sher-accent" /> Financial Velocity
            </h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={MOCK_REVENUE_DATA}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <XAxis dataKey="month" fontSize={10} axisLine={false} tickLine={false} stroke="#ffffff20" />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#ffffff20" tickFormatter={formatCurrency} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '12px' }}
                    formatter={(val: number) => [`₹${val.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    fill="url(#revGrad)" 
                    animationDuration={1500} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="xl:col-span-4 bg-panel border border-border rounded-[48px] p-8 shadow-2xl flex flex-col min-h-[400px]">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-10">Revenue Sharding</h3>
            <div className="flex-1 flex flex-col items-center justify-center">
               <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                     <PieChart>
                        <Pie
                           data={STREAM_DISTRIBUTION}
                           innerRadius={60}
                           outerRadius={80}
                           paddingAngle={5}
                           dataKey="value"
                           nameKey="name"
                           animationDuration={1000}
                        >
                           {STREAM_DISTRIBUTION.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="w-full space-y-4 mt-6">
                  {STREAM_DISTRIBUTION.map(item => (
                     <div key={item.name} className="flex justify-between items-center px-4 group">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                           <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest group-hover:text-white transition-colors">{item.name}</span>
                        </div>
                        <span className="text-[10px] font-black text-white">{item.value}%</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* Verification Shield */}
      <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-10 flex flex-col md:flex-row gap-10 items-center">
         <div className="p-6 bg-emerald-500/10 rounded-3xl text-emerald-500 border border-emerald-500/20">
            <ShieldCheck size={48} />
         </div>
         <div className="flex-1 space-y-3">
            <h4 className="text-xl font-black text-white uppercase tracking-tight">Institutional Billing Status</h4>
            <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-70">
              Revenue nodes are verified against exchange settlement logs. Every transaction is cross-referenced with the sharded ledger to ensure zero discrepancies in the fiscal node.
            </p>
         </div>
         <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-sher-accent hover:text-white transition-all active:scale-95 shadow-2xl">
            Download Ledger
         </button>
      </div>
    </div>
  );
};

export default TenantRevenueView;
