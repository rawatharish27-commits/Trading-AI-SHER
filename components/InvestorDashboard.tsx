
import React, { useState, useEffect } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Shield, 
  TrendingUp, 
  BarChart3, 
  Lock, 
  Globe, 
  Fingerprint, 
  Award, 
  Activity, 
  Clock, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { EquitySnapshot, TradeAnalytics, Trade } from '../types';

interface SummaryData {
  equity: EquitySnapshot;
  analytics: TradeAnalytics;
  recentTrades: Trade[];
  systemHealth: {
    latency: string;
    uptime: string;
    node: string;
  };
}

const MetricCard = ({ label, value, sub, icon: Icon, color, trend }: any) => (
  <div className="bg-panel border border-border p-6 rounded-[24px] shadow-2xl relative overflow-hidden group hover:border-sher-accent/30 transition-all duration-500">
    <div className={`absolute top-0 right-0 p-4 opacity-[0.03] transition-opacity group-hover:opacity-[0.08]`}>
      <Icon size={96} />
    </div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-opacity-100 border border-current border-opacity-20`}>
        <Icon size={18} />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${trend >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <h3 className="text-[10px] font-black text-sher-muted uppercase tracking-[0.2em] relative z-10">{label}</h3>
    <p className="text-3xl font-black text-white tracking-tighter tabular-nums mt-1 relative z-10">{value}</p>
    <p className="text-[10px] text-sher-muted mt-2 font-bold uppercase tracking-tight opacity-70 relative z-10">{sub}</p>
  </div>
);

const InvestorDashboard: React.FC = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/investor/summary');
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error("Investor fetch failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const inv = setInterval(fetchSummary, 10000);
    return () => clearInterval(inv);
  }, []);

  if (!data && isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-sher-muted">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-sher-accent/20 border-t-sher-accent rounded-full animate-spin" />
        <Fingerprint size={24} className="absolute inset-0 m-auto text-sher-accent animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Authenticating Secure Proxy...</p>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-700">
      {/* Institutional Mission Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-gradient-to-br from-slate-900 to-panel p-8 rounded-[32px] border border-border shadow-2xl gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-sher-accent/5 skew-x-12 translate-x-1/2 pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-sher-accent rounded-3xl shadow-2xl shadow-sher-accent/20 flex items-center justify-center text-white border border-white/10 group-hover:scale-105 transition-transform duration-500">
            <Shield size={36} fill="currentColor" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Sher Quant Alpha</h2>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest shadow-inner">
                Live Audit active
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-[10px] text-sher-muted flex items-center gap-2 font-bold uppercase tracking-widest">
                <Lock size={12} className="text-sher-accent" /> Secure Proxy ID: 8XF-772-AL
              </p>
              <div className="w-1 h-1 rounded-full bg-border" />
              <p className="text-[10px] text-sher-muted flex items-center gap-2 font-bold uppercase tracking-widest">
                <Globe size={12} className="text-sher-accent" /> Global Node: {data.systemHealth.node}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 items-center bg-black/40 px-8 py-6 rounded-3xl border border-white/5 backdrop-blur-md relative z-10">
           <div className="text-center sm:text-left">
              <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest opacity-50">System Uptime</p>
              <p className="text-lg font-black text-white flex items-center gap-2 justify-center sm:justify-start mt-1">
                <Activity size={14} className="text-emerald-500" /> {data.systemHealth.uptime}
              </p>
           </div>
           <div className="hidden sm:block w-px h-10 bg-border/50"></div>
           <div className="text-center sm:text-right">
              <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest opacity-50">Aggregate Net P&L</p>
              <p className={`text-3xl font-black tabular-nums tracking-tighter ${data.analytics.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{data.analytics.netPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
           </div>
           <button onClick={fetchSummary} className="p-3 bg-slate-800 rounded-2xl text-sher-muted hover:text-white transition-all border border-border">
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
           </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          label="Alpha Probability" 
          value={`${data.analytics.winRate.toFixed(1)}%`} 
          sub="Verified Session Hit-Rate" 
          icon={Award} 
          color="text-sher-accent"
          trend={2.4}
        />
        <MetricCard 
          label="Risk Exposure" 
          value={`-${(data.equity.maxDrawdown * 100).toFixed(2)}%`} 
          sub="Peak Realized Drawdown" 
          icon={Shield} 
          color="text-rose-500" 
        />
        <MetricCard 
          label="Managed Assets" 
          value={`₹${data.equity.currentEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          sub="Current Net Liquidity Pool" 
          icon={TrendingUp} 
          color="text-emerald-500" 
        />
        <MetricCard 
          label="System Expectancy" 
          value={`₹${data.analytics.expectancy.toFixed(2)}`} 
          sub="Avg. Value per Execution" 
          icon={BarChart3} 
          color="text-amber-400" 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Equity Progression Chart */}
        <div className="xl:col-span-2 bg-panel border border-border rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
            <div>
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                <TrendingUp size={20} className="text-sher-accent" /> Compounded Equity Curve
              </h3>
              <p className="text-[10px] text-sher-muted mt-1 uppercase font-black opacity-60">Session walk-forward execution logs</p>
            </div>
            <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-border/50">
              {['1D', '1W', '1M', '3M', 'ALL'].map(range => (
                <button key={range} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                  range === 'ALL' ? 'bg-sher-accent text-white shadow-lg' : 'text-sher-muted hover:text-white'
                }`}>
                  {range}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data.equity.curve}>
                 <defs>
                   <linearGradient id="investorEquityGrad" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.15} />
                 <XAxis 
                    dataKey="date" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    stroke="#475569" 
                    tick={{fontWeight: '900', textTransform: 'uppercase'}}
                  />
                 <YAxis 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false} 
                    stroke="#475569" 
                    domain={['auto', 'auto']} 
                    tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`}
                    tick={{fontWeight: '900'}}
                  />
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #1F2937', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                    labelStyle={{ color: '#94A3B8', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '8px' }}
                    itemStyle={{ color: '#3B82F6', fontWeight: '900', fontSize: '12px' }}
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'NET EQUITY']}
                  />
                 <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#3B82F6" 
                    strokeWidth={4} 
                    fill="url(#investorEquityGrad)" 
                    animationDuration={1500}
                    isAnimationActive={!isLoading}
                  />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Execution Log */}
        <div className="bg-panel border border-border rounded-[32px] p-8 shadow-2xl flex flex-col">
          <div className="mb-8">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <Clock size={18} className="text-purple-400" /> Transparency Log
            </h3>
            <p className="text-[10px] text-sher-muted mt-1 uppercase font-black opacity-60">Verified On-Chain settlement</p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {data.recentTrades.map((trade) => (
              <div key={trade.id} className="bg-slate-900/40 border border-border/50 rounded-2xl p-4 group hover:border-sher-accent/30 transition-all duration-300">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-white group-hover:text-sher-accent transition-colors">{trade.symbol}</span>
                    <span className="text-[8px] font-black text-sher-muted uppercase tracking-widest">{trade.strategy}</span>
                  </div>
                  <div className={`text-xs font-black tabular-nums ${(trade.pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(trade.pnl || 0) >= 0 ? '+' : ''}₹{(trade.pnl || 0).toLocaleString()}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-sher-muted">
                  <span>{new Date(trade.exitTime || trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-white/5">{trade.side} UNIT</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-border/50 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black text-sher-muted uppercase tracking-widest">
               <Shield size={14} className="text-emerald-500" /> Audited Settlement Feed
             </div>
             <button className="w-full py-4 bg-slate-900 border border-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-slate-800 transition-all active:scale-95">
               Download Detailed Audit
             </button>
          </div>
        </div>
      </div>

      {/* Institutional Legal Shield */}
      <div className="bg-amber-500/5 border border-amber-500/10 rounded-[32px] p-8 flex flex-col md:flex-row gap-8 items-center group overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/20" />
        <div className="p-4 bg-amber-500/10 rounded-3xl text-amber-500 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
          <Fingerprint size={32} />
        </div>
        <div className="flex-1 space-y-3">
          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            Regulatory Compliance Notice
          </h4>
          <p className="text-[11px] text-amber-200/60 leading-relaxed font-medium">
            <strong>LEGAL FRAMEWORK:</strong> This interface provides absolute transparency for institutional capital allocation. All trade execution, algorithmic logic, and capital distribution are managed by the SHER CORE MASTER BRAIN (v2.4.5) on sovereign institutional hardware. Historical performance logs are verified against exchange settlement statements. This interface is for reporting purposes only and does not facilitate asset transfer or execution.
          </p>
        </div>
        <div className="flex items-center gap-6 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 px-4">
           <Shield size={32} className="text-white" />
           <Award size={32} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
