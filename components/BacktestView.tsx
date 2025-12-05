
import React, { useState } from 'react';
import { Play, RotateCcw, BarChart2, Calendar, Bot, Loader2, Activity, Clock, DollarSign, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyzeBacktest } from '../services/geminiService';
import { BacktestResult } from '../types';

interface ExtendedBacktestResult extends BacktestResult {
    tradeLogs: { time: string; pnl: number }[];
}

const BacktestView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExtendedBacktestResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configuration State
  const [symbol, setSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState('MOMENTUM_V1');
  const [timeFrame, setTimeFrame] = useState('1d');
  const [lookback, setLookback] = useState(365);
  const [capital, setCapital] = useState(100000);

  const runBacktest = async () => {
    setIsRunning(true);
    setResult(null);
    setAiAnalysis(null);
    setError(null);

    try {
        const response = await fetch('/api/backtest/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol: symbol.toUpperCase(),
                strategyCode: strategy,
                timeFrame,
                lookback,
                initialCapital: capital
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Backtest simulation failed');
        }

        const data = await response.json();
        
        // Map API response to UI model
        const mappedResult: ExtendedBacktestResult = {
            totalReturn: Number(data.stats.total_return_pct.toFixed(2)),
            winRate: Number(data.stats.win_rate.toFixed(2)),
            maxDrawdown: Number(data.stats.max_drawdown_pct.toFixed(2)),
            sharpeRatio: 0, // Not provided by current backend
            trades: data.stats.num_trades,
            equityCurve: data.equity_curve.map((p: any) => ({
                date: new Date(p.time).toLocaleDateString(),
                equity: p.equity
            })),
            tradeLogs: data.trades
        };

        setResult(mappedResult);

    } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred during simulation.");
    } finally {
        setIsRunning(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!result) return;
    setIsAnalyzing(true);
    const text = await analyzeBacktest(strategy, result.winRate, result.maxDrawdown, result.totalReturn);
    setAiAnalysis(text);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Configuration Panel */}
        <div className="bg-sher-card border border-gray-800 rounded-xl p-6 h-fit overflow-y-auto">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <RotateCcw size={20} className="text-sher-accent" /> Strategy Config
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-sher-muted uppercase mb-2">Symbol Universe</label>
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-slate-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sher-accent uppercase placeholder:normal-case"
                placeholder="e.g. RELIANCE"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-sher-muted uppercase mb-2">Strategy Model</label>
              <select 
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-slate-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sher-accent"
              >
                <option value="MOMENTUM_V1">Momentum Trend Follower (V1)</option>
                <option value="BREAKOUT_V1">Range Breakout (V1)</option>
                <option value="MEAN_REVERSION_V1">Mean Reversion RSI (V1)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-xs font-semibold text-sher-muted uppercase mb-2 flex items-center gap-1">
                     <Clock size={12} /> Timeframe
                  </label>
                  <select 
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value)}
                    className="w-full bg-slate-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sher-accent"
                  >
                    <option value="1d">Daily (1D)</option>
                    <option value="1h">Hourly (1H)</option>
                    <option value="15m">15 Minutes</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-semibold text-sher-muted uppercase mb-2 flex items-center gap-1">
                     <Activity size={12} /> Lookback
                  </label>
                  <input 
                    type="number" 
                    value={lookback}
                    onChange={(e) => setLookback(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sher-accent"
                  />
               </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-sher-muted uppercase mb-2 flex items-center gap-1">
                 <DollarSign size={12} /> Initial Capital
              </label>
              <input 
                type="number" 
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full bg-slate-900 border border-gray-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:border-sher-accent"
              />
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3 rounded-lg flex gap-2 items-start">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <button 
              onClick={runBacktest}
              disabled={isRunning}
              className="w-full mt-4 bg-sher-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
              {isRunning ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6 flex flex-col min-h-0 overflow-y-auto pr-2 custom-scrollbar">
          {!result ? (
            <div className="bg-sher-card border border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-sher-muted h-full min-h-[400px]">
              <BarChart2 size={48} className="mb-4 opacity-20" />
              <p className="text-lg text-center">Configure strategy parameters and run simulation<br/>to generate backtest analytics.</p>
            </div>
          ) : (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
                <div className="bg-slate-900/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-sher-muted uppercase">Total Return</p>
                  <p className={`text-xl font-bold ${result.totalReturn >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
                    {result.totalReturn > 0 ? '+' : ''}{result.totalReturn}%
                  </p>
                </div>
                <div className="bg-slate-900/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-sher-muted uppercase">Win Rate</p>
                  <p className="text-xl font-bold text-white">{result.winRate}%</p>
                </div>
                <div className="bg-slate-900/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-sher-muted uppercase">Max Drawdown</p>
                  <p className="text-xl font-bold text-sher-danger">{result.maxDrawdown}%</p>
                </div>
                <div className="bg-slate-900/50 border border-gray-800 rounded-xl p-4">
                  <p className="text-xs text-sher-muted uppercase">Trades</p>
                  <p className="text-xl font-bold text-blue-400">{result.trades}</p>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-sher-card border border-gray-800 rounded-xl p-6 h-[300px] shrink-0">
                <h3 className="text-sm font-bold text-white mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.equityCurve}>
                    <defs>
                      <linearGradient id="backtestGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                        formatter={(value: number) => [`₹ ${value.toLocaleString()}`, 'Equity']}
                    />
                    <Area type="monotone" dataKey="equity" stroke="#10b981" fill="url(#backtestGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* AI Analysis */}
              <div className="bg-slate-900 border border-dashed border-gray-700 rounded-xl p-6 shrink-0">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Bot size={20} className="text-purple-400" /> Sher Risk Assessment
                    </h3>
                    {!aiAnalysis && (
                        <button 
                            onClick={handleAiAnalysis}
                            disabled={isAnalyzing}
                            className="text-xs bg-purple-600/20 text-purple-400 border border-purple-600/50 px-3 py-1.5 rounded-full hover:bg-purple-600/30 transition-colors"
                        >
                            {isAnalyzing ? 'Analyzing...' : 'Generate Report'}
                        </button>
                    )}
                 </div>
                 
                 {aiAnalysis ? (
                    <div className="text-gray-300 text-sm leading-relaxed animate-in fade-in">
                        {aiAnalysis}
                    </div>
                 ) : (
                    <p className="text-sher-muted text-sm italic">
                        Generate an AI report to detect overfitting or hidden risks in this strategy.
                    </p>
                 )}
              </div>

              {/* Trade Logs */}
              <div className="bg-sher-card border border-gray-800 rounded-xl p-6">
                <h3 className="text-sm font-bold text-white mb-4">Trade Log</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-sher-muted border-b border-gray-700 text-xs uppercase">
                            <tr>
                                <th className="px-4 py-2">Date</th>
                                <th className="px-4 py-2 text-right">PnL</th>
                                <th className="px-4 py-2 text-right">Outcome</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {result.tradeLogs.length === 0 ? (
                                <tr><td colSpan={3} className="px-4 py-4 text-center text-sher-muted">No trades generated.</td></tr>
                            ) : (
                                result.tradeLogs.slice().reverse().map((trade, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/50">
                                        <td className="px-4 py-2 font-mono text-xs">
                                            {new Date(trade.time).toLocaleDateString()} {new Date(trade.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </td>
                                        <td className={`px-4 py-2 text-right font-medium ${trade.pnl >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
                                            {trade.pnl >= 0 ? '+' : ''}₹{trade.pnl.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${trade.pnl >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                {trade.pnl >= 0 ? 'WIN' : 'LOSS'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacktestView;
