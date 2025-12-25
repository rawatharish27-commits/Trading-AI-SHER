
import React, { useState } from 'react';
import { Play, RotateCcw, BarChart2, Loader2, AlertCircle, Zap, ShieldCheck, TrendingUp, TrendingDown, Activity, Award, Target, Info, Cpu } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyzeBacktest } from '../services/geminiService';
import { BacktestResult, BacktestAnalysis } from '../types';

const BacktestView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<BacktestAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [symbol, setSymbol] = useState('RELIANCE');
  const [strategy, setStrategy] = useState('EMA_RSI');
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
            body: JSON.stringify({ symbol, strategyCode: strategy, initialCapital: capital })
        });

        if (!response.ok) throw new Error('Simulation Engine Handshake Failed');
        const data = await response.json();
        setResult(data);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsRunning(false);
    }
  };

  const handleAiAudit = async () => {
    if (!result) return;
    setIsAnalyzing(true);
    const analysis = await analyzeBacktest(strategy, result.stats.win_rate, result.stats.max_drawdown_pct, result.stats.total_return_pct);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Config Panel */}
        <div className="lg:col-span-1 bg-panel border border-border rounded-[32px] p-6 h-fit space-y-6 shadow-2xl">
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <Cpu size={16} className="text-sher-accent" /> Strategy Unit
          </h2>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-sher-muted uppercase tracking-widest ml-1">Asset Node</label>
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                className="w-full bg-slate-900 border border-white/5 text-white rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:border-sher-accent uppercase"
                placeholder="RELIANCE"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-sher-muted uppercase tracking-widest ml-1">Execution Logic</label>
              <select 
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 text-white rounded-xl px-4 py-3 text-xs font-black focus:outline-none focus:border-sher-accent"
              >
                <option value="EMA_RSI">Neural EMA+RSI (v2)</option>
                <option value="VWAP_TREND_RIDE">VWAP Trend Ride</option>
                <option value="LIQUIDITY_SWEEP">Institutional Sweep</option>
              </select>
            </div>

            <button 
              onClick={runBacktest}
              disabled={isRunning}
              className="w-full bg-sher-accent hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[10px] py-4 rounded-xl shadow-xl shadow-sher-accent/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isRunning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
              {isRunning ? 'Processing...' : 'Run Simulation'}
            </button>
          </div>
          
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-white/5 space-y-3">
             <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-sher-muted uppercase">Learning Node</span>
                <span className="text-[8px] font-black text-emerald-400 uppercase">Active</span>
             </div>
             <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 animate-pulse" style={{ width: '65%' }} />
             </div>
             <p className="text-[7px] text-sher-muted italic font-bold">Weights calibrated via reinforcement loops.</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {!result ? (
            <div className="bg-panel border border-dashed border-border rounded-[40px] p-20 flex flex-col items-center justify-center text-center opacity-40">
              <Activity size={48} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Initialize Strategy Node to generate Alpha logs.</p>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700 space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Net Alpha', val: `${result.stats.total_return_pct.toFixed(2)}%`, icon: TrendingUp, color: 'text-emerald-400' },
                  { label: 'Win Probability', val: `${result.stats.win_rate.toFixed(1)}%`, icon: Award, color: 'text-sher-accent' },
                  { label: 'Max Drawdown', val: `-${result.stats.max_drawdown_pct.toFixed(2)}%`, icon: TrendingDown, color: 'text-rose-400' },
                  { label: 'Profit Factor', val: result.stats.profit_factor.toFixed(2), icon: Target, color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="bg-panel border border-border p-5 rounded-2xl shadow-xl">
                    <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-1.5 mb-2">
                       <s.icon size={10} className={s.color} /> {s.label}
                    </p>
                    <p className={`text-2xl font-black ${s.color} tabular-nums tracking-tighter`}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                      <TrendingUp size={18} className="text-sher-accent" /> Equity Walk-Forward Path
                   </h3>
                   <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                      <Zap size={10} fill="currentColor" /> Live Ready
                   </div>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.equity_curve}>
                      <defs>
                        <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.1} />
                      <XAxis dataKey="time" hide />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#64748b" domain={['auto', 'auto']} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{backgroundColor: '#0B0F14', border: '1px solid #1F2937', borderRadius: '12px'}} />
                      <Area type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={3} fill="url(#curveGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Audit Block */}
              <div className="bg-gradient-to-br from-purple-900/40 to-slate-900/60 border border-purple-500/20 rounded-[40px] p-8 shadow-2xl">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                       <Zap size={24} className="text-purple-400" fill="currentColor" />
                       <h3 className="text-lg font-black text-white uppercase tracking-tighter">Neural Audit Node</h3>
                    </div>
                    <button 
                      onClick={handleAiAudit}
                      disabled={isAnalyzing}
                      className="px-6 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/20"
                    >
                      {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : 'Deep Reasoning Scan'}
                    </button>
                 </div>

                 {aiAnalysis ? (
                   <div className="space-y-6 animate-in slide-in-from-top-4">
                      <p className="text-sm text-purple-100/80 leading-relaxed italic font-medium">"{aiAnalysis.summary}"</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Statistical Edge</p>
                          {aiAnalysis.pros.map((p, i) => <div key={i} className="flex gap-2 text-[11px] text-gray-300 items-start"><ShieldCheck size={12} className="text-emerald-500 mt-0.5" /> {p}</div>)}
                        </div>
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Regime Vulnerability</p>
                          {aiAnalysis.cons.map((c, i) => <div key={i} className="flex gap-2 text-[11px] text-gray-300 items-start"><AlertCircle size={12} className="text-rose-400 mt-0.5" /> {c}</div>)}
                        </div>
                      </div>
                   </div>
                 ) : (
                   <div className="flex items-center gap-3 text-sher-muted">
                      <Info size={16} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Neural scanner ready for logic decomposition.</p>
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BacktestView;
