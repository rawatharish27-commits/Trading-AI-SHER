
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Activity, TrendingUp, Plus } from 'lucide-react';
import { ChartDataPoint } from '../types';

interface DashboardProps {
  equityData: ChartDataPoint[];
  currentEquity: number;
  onAddToWatchlist: (symbol: string) => void;
}

const StatCard = ({ title, value, change, isPositive, icon: Icon, action }: any) => (
  <div className="bg-sher-card border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors group relative">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-800 rounded-lg text-sher-muted group-hover:text-sher-accent transition-colors">
        <Icon size={20} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${isPositive ? 'bg-emerald-500/10 text-sher-success' : 'bg-rose-500/10 text-sher-danger'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {change}
      </div>
    </div>
    <h3 className="text-sher-muted text-sm font-medium">{title}</h3>
    <div className="flex items-center justify-between">
       <p className="text-2xl font-bold text-white mt-1 tabular-nums transition-all duration-300">{value}</p>
       {action && (
         <div className="mt-1">
           {action}
         </div>
       )}
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ equityData, currentEquity, onAddToWatchlist }) => {
  // Calculate P&L based on simulated start of day
  const startOfDay = 240000;
  const pnl = currentEquity - startOfDay;
  const pnlPercent = (pnl / startOfDay) * 100;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Equity" 
          value={`₹ ${currentEquity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change={`${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`}
          isPositive={pnl >= 0} 
          icon={Wallet} 
        />
        <StatCard 
          title="Day's P&L" 
          value={`₹ ${Math.abs(pnl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          change="Today"
          isPositive={pnl >= 0} 
          icon={Activity} 
        />
        <StatCard 
          title="Active Positions" 
          value="4" 
          change="-1" 
          isPositive={false} 
          icon={TrendingUp}
          action={
            <button 
              onClick={() => onAddToWatchlist('NIFTY 50')}
              className="p-1.5 bg-sher-accent/20 hover:bg-sher-accent/40 text-sher-accent rounded-lg transition-colors"
              title="Add NIFTY 50 to Watchlist"
            >
              <Plus size={16} />
            </button>
          } 
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve */}
        <div className="lg:col-span-2 bg-sher-card border border-gray-800 rounded-xl p-6 relative">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-lg font-bold text-white">Equity Performance</h2>
             <div className="flex gap-2">
                <span className="text-xs font-medium text-sher-success px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20 animate-pulse">LIVE</span>
             </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={equityData}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    interval="preserveStartEnd"
                />
                <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value: number) => [`₹ ${value.toLocaleString('en-IN')}`, 'Equity']}
                />
                <Area 
                    type="monotone" 
                    dataKey="equity" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorEquity)" 
                    isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / System Log */}
        <div className="bg-sher-card border border-gray-800 rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">Sher Log</h2>
          <div className="space-y-4 overflow-y-auto flex-1 max-h-[300px] pr-2 custom-scrollbar">
            {[
              { time: '14:32:01', msg: 'Bought 50 TATASTEEL @ 145.2', type: 'buy' },
              { time: '14:05:45', msg: 'Momentum signal generated for INFY', type: 'info' },
              { time: '13:15:22', msg: 'Stop loss hit RELIANCE', type: 'sell' },
              { time: '11:30:00', msg: 'System check complete. Latency 45ms', type: 'info' },
              { time: '10:15:00', msg: 'Ingest service connected to AngelOne', type: 'info' },
              { time: '09:15:01', msg: 'Market Open. Monitoring 50 instruments.', type: 'info' },
            ].map((log, idx) => (
              <div key={idx} className="flex gap-3 items-start border-b border-gray-800/50 pb-3 last:border-0 last:pb-0">
                <span className="text-xs font-mono text-sher-muted mt-1">{log.time}</span>
                <div>
                  <p className={`text-sm ${log.type === 'buy' ? 'text-sher-success' : log.type === 'sell' ? 'text-sher-danger' : 'text-sher-text'}`}>
                    {log.msg}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
