import React, { useState } from 'react';
import { AISignal, SymbolAnalysis } from '../types';
import { Zap, TrendingUp, TrendingDown, Bot, Loader2, X, Activity, BarChart3, Target, ArrowRight } from 'lucide-react';
import { analyzeSymbol } from '../services/geminiService';

const MOCK_SIGNALS: AISignal[] = [
  { id: '1', symbol: 'SBIN', action: 'BUY', confidence: 0.88, timestamp: '10:45:00', reasoning: 'Strong momentum breakout above 200 EMA with volume spike.', strategy: 'Momentum' },
  { id: '2', symbol: 'ADANIENT', action: 'SELL', confidence: 0.72, timestamp: '11:15:23', reasoning: 'RSI divergence detected at resistance zone.', strategy: 'Mean Reversion' },
  { id: '3', symbol: 'MARUTI', action: 'BUY', confidence: 0.91, timestamp: '13:30:10', reasoning: 'Ascending triangle pattern breakout.', strategy: 'Breakout' },
];

const SignalsView: React.FC = () => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: SymbolAnalysis }>({});

  const handleAnalyze = async (signal: AISignal) => {
    if (analyzingId === signal.id) return;
    
    setAnalyzingId(signal.id);
    
    // Call the backend Agent Tool
    const result = await analyzeSymbol(signal.symbol);
    
    if (result) {
        setAiAnalysis(prev => ({ ...prev, [signal.id]: result }));
    }
    setAnalyzingId(null);
  };

  const getRegimeColor = (regime: string) => {
      switch(regime) {
          case 'BULL': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
          case 'BEAR': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
          case 'SIDEWAYS': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
          default: return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
      {/* Signals Feed */}
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2 sticky top-0 bg-sher-dark z-10 py-2">
          <Zap size={20} className="text-sher-accent" /> Live AI Signals
        </h2>
        
        {MOCK_SIGNALS.map((signal) => (
          <div key={signal.id} className="bg-sher-card border border-gray-800 rounded-xl p-5 relative overflow-hidden hover:border-sher-accent/50 transition-all group">
            <div className={`absolute top-0 left-0 w-1 h-full ${signal.action === 'BUY' ? 'bg-sher-success' : 'bg-sher-danger'}`}></div>
            
            <div className="flex justify-between items-start mb-2 pl-2">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {signal.symbol}
                  <span className={`text-xs px-2 py-0.5 rounded border ${signal.action === 'BUY' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
                    {signal.action}
                  </span>
                </h3>
                <p className="text-xs text-sher-muted mt-1">{signal.timestamp} • {signal.strategy}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">{(signal.confidence * 100).toFixed(0)}%</span>
                <p className="text-[10px] text-sher-muted uppercase tracking-wider">Confidence</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 pl-2 mb-4 border-l border-gray-700 ml-1 py-1">
              "{signal.reasoning}"
            </p>

            <div className="pl-2 flex gap-3">
              <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm py-2 rounded-lg font-medium transition-colors border border-gray-700">
                Execute
              </button>
              <button 
                onClick={() => handleAnalyze(signal)}
                disabled={analyzingId === signal.id}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-sm py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
              >
                {analyzingId === signal.id ? (
                  <><Loader2 size={16} className="animate-spin" /> Deep Dive...</>
                ) : (
                  <><Bot size={16} /> Sher Insight</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Panel */}
      <div className="bg-slate-900/50 border border-dashed border-gray-800 rounded-xl p-6 relative flex flex-col h-full overflow-hidden">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 shrink-0">
          <Bot size={20} className="text-purple-400" /> Sher Intelligence Hub
        </h2>
        
        {Object.keys(aiAnalysis).length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-sher-muted opacity-50">
            <Activity size={48} className="mb-4" />
            <p className="text-center">Select "Sher Insight" on a signal to trigger<br/>real-time deep technical analysis.</p>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
             {Object.entries(aiAnalysis).map(([id, analysis]: [string, SymbolAnalysis]) => (
                <div key={id} className="bg-sher-card border border-gray-700 rounded-xl p-5 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 border-b border-gray-800 pb-4">
                    <div>
                        <h3 className="font-bold text-xl text-white flex items-center gap-2">
                            {analysis.symbol} 
                            <span className="text-xs text-sher-muted font-normal px-2 py-1 bg-slate-800 rounded-full">
                                {new Date(analysis.timestamp).toLocaleTimeString()}
                            </span>
                        </h3>
                        <div className={`mt-2 inline-flex text-xs font-bold px-3 py-1 rounded-full border ${getRegimeColor(analysis.regime)}`}>
                            MARKET REGIME: {analysis.regime}
                        </div>
                    </div>
                    <button onClick={() => {
                      const newAnalysis = {...aiAnalysis};
                      delete newAnalysis[id];
                      setAiAnalysis(newAnalysis);
                    }} className="text-sher-muted hover:text-white transition-colors">
                        <X size={20}/>
                    </button>
                  </div>

                  {/* Explanation */}
                  <div className="mb-6">
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        {analysis.explanation}
                      </p>
                  </div>

                  {/* Strategy Suitability */}
                  <div className="mb-6 space-y-3">
                      <h4 className="text-xs font-bold text-sher-muted uppercase flex items-center gap-2">
                          <Target size={14} /> Strategy Fit
                      </h4>
                      {[
                          { label: 'Momentum', score: analysis.strategySuitability.momentum, color: 'bg-blue-500' },
                          { label: 'Mean Reversion', score: analysis.strategySuitability.meanReversion, color: 'bg-purple-500' },
                          { label: 'Breakout', score: analysis.strategySuitability.breakout, color: 'bg-orange-500' }
                      ].map((strat) => (
                          <div key={strat.label} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-24">{strat.label}</span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                      className={`h-full ${strat.color} transition-all duration-1000`} 
                                      style={{ width: `${strat.score * 10}%` }}
                                  ></div>
                              </div>
                              <span className="text-xs font-mono w-8 text-right">{strat.score}/10</span>
                          </div>
                      ))}
                  </div>

                  {/* Forecast Probabilities */}
                  <div>
                      <h4 className="text-xs font-bold text-sher-muted uppercase flex items-center gap-2 mb-3">
                          <BarChart3 size={14} /> Next 24H Forecast
                      </h4>
                      <div className="flex h-8 rounded-lg overflow-hidden font-bold text-[10px] text-white/90">
                          <div 
                            className="bg-emerald-500/80 flex items-center justify-center relative group" 
                            style={{ width: `${analysis.forecast.up * 100}%` }}
                          >
                              {analysis.forecast.up > 0.1 && <span>UP {(analysis.forecast.up * 100).toFixed(0)}%</span>}
                          </div>
                          <div 
                            className="bg-gray-500/50 flex items-center justify-center border-l border-r border-slate-900/20" 
                            style={{ width: `${analysis.forecast.flat * 100}%` }}
                          >
                               {analysis.forecast.flat > 0.1 && <span>FLAT</span>}
                          </div>
                          <div 
                            className="bg-rose-500/80 flex items-center justify-center" 
                            style={{ width: `${analysis.forecast.down * 100}%` }}
                          >
                               {analysis.forecast.down > 0.1 && <span>DOWN</span>}
                          </div>
                      </div>
                  </div>

                </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsView;