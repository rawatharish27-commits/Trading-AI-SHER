
import React, { useEffect, useState } from 'react';
import { Trade, TradeAnalytics } from '../types';
import { BookOpen, TrendingUp, TrendingDown, Target, BarChart3, Clock, ArrowRightLeft, Search, Download } from 'lucide-react';

const HistoryView: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<TradeAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tradesRes, analyticsRes] = await Promise.all([
        fetch('/api/trades'),
        fetch('/api/analytics')
      ]);
      if (tradesRes.ok) setTrades(await tradesRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
    } catch (e) {
      console.error("Failed to fetch journal data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/export/trades';
  };

  const filteredTrades = trades.filter(t => 
    t.symbol.toUpperCase().includes(search.toUpperCase()) ||
    t.strategy.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Analytics Grid */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-sher-card border border-gray-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-sher-accent">
                <BarChart3 size={18} />
              </div>
              <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">Total Efficiency</span>
            </div>
            <p className="text-2xl font-black text-white">{analytics.winRate.toFixed(1)}% <span className="text-xs text-sher-muted">Win Rate</span></p>
            <p className="text-[10px] font-bold text-sher-muted mt-1 uppercase tracking-tighter">Based on {analytics.totalTrades} closed trades</p>
          </div>

          <div className="bg-sher-card border border-gray-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-sher-success">
                <TrendingUp size={18} />
              </div>
              <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">Net Realized P&L</span>
            </div>
            <p className={`text-2xl font-black tabular-nums ${analytics.netPnL >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
              ₹{analytics.netPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] font-bold text-sher-muted mt-1 uppercase tracking-tighter">Lifetime performance</p>
          </div>

          <div className="bg-sher-card border border-gray-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Target size={18} />
              </div>
              <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">Profit Factor</span>
            </div>
            <p className="text-2xl font-black text-white">{analytics.profitFactor.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-sher-muted mt-1 uppercase tracking-tighter">Gross profit / Gross loss</p>
          </div>

          <div className="bg-sher-card border border-gray-800 rounded-xl p-5 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                <Clock size={18} />
              </div>
              <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">Expectancy</span>
            </div>
            <p className="text-2xl font-black text-white">₹{analytics.expectancy.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-sher-muted mt-1 uppercase tracking-tighter">Avg outcome per trade</p>
          </div>
        </div>
      )}

      {/* Trade Journal Table */}
      <div className="bg-sher-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/20">
          <h2 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <BookOpen size={20} className="text-sher-accent" /> Trade Journal
          </h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-sher-muted" size={16} />
              <input 
                type="text" 
                placeholder="Filter journal..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-sher-accent transition-all"
              />
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors border border-gray-700"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-sher-muted text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Symbol / Strategy</th>
                <th className="px-6 py-4">Execution Time</th>
                <th className="px-6 py-4 text-center">Side</th>
                <th className="px-6 py-4 text-right">Entry</th>
                <th className="px-6 py-4 text-right">Exit</th>
                <th className="px-6 py-4 text-right">PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">{trade.symbol}</span>
                      <span className="text-[10px] text-sher-muted font-bold uppercase tracking-wider">{trade.strategy}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-sher-muted font-mono">
                    {new Date(trade.entryTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      trade.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-mono text-xs">
                    ₹{trade.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-white font-mono text-xs">
                    {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-bold text-sm ${
                    trade.pnl !== undefined ? (trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-sher-muted'
                  }`}>
                    {trade.pnl !== undefined ? `${trade.pnl >= 0 ? '+' : ''}₹${trade.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
                  </td>
                </tr>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sher-muted italic text-sm">
                    No matching trades found in the journal.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
