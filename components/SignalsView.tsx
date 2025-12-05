import React, { useState } from 'react';
import { AISignal } from '../types';
import { Zap, TrendingUp, TrendingDown, Bot, Loader2, X, Activity } from 'lucide-react';
import { analyzeStock } from '../services/geminiService';

const MOCK_SIGNALS: AISignal[] = [
  { id: '1', symbol: 'SBIN', action: 'BUY', confidence: 0.88, timestamp: '10:45:00', reasoning: 'Strong momentum breakout above 200 EMA with volume spike.', strategy: 'Momentum' },
  { id: '2', symbol: 'ADANIENT', action: 'SELL', confidence: 0.72, timestamp: '11:15:23', reasoning: 'RSI divergence detected at resistance zone.', strategy: 'Mean Reversion' },
  { id: '3', symbol: 'MARUTI', action: 'BUY', confidence: 0.91, timestamp: '13:30:10', reasoning: 'Ascending triangle pattern breakout.', strategy: 'Breakout' },
];

const SignalsView: React.FC = () => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: string }>({});

  const handleAnalyze = async (signal: AISignal) => {
    if (analyzingId === signal.id) return;
    
    setAnalyzingId(signal.id);
    // Simulate price data since we don't have a live feed in this artifact
    const mockPrice = signal.symbol === 'SBIN' ? 620 : signal.symbol === 'ADANIENT' ? 2400 : 9500;
    const mockChange = signal.action === 'BUY' ? 1.5 : -1.2;

    const result = await analyzeStock(signal.symbol, mockPrice, mockChange, signal.strategy);
    
    setAiAnalysis(prev => ({ ...prev, [signal.id]: result }));
    setAnalyzingId(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Signals Feed */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
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
                  <><Loader2 size={16} className="animate-spin" /> Analyzing...</>
                ) : (
                  <><Bot size={16} /> Sher Insight</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Panel */}
      <div className="bg-slate-900/50 border border-dashed border-gray-800 rounded-xl p-6 relative">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Bot size={20} className="text-purple-400" /> Sher Intelligence Analysis
        </h2>
        
        {Object.keys(aiAnalysis).length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-sher-muted opacity-50">
            <Activity size={48} className="mb-4" />
            <p>Select "Sher Insight" on a signal to generate deep technical analysis.</p>
          </div>
        ) : (
          <div className="space-y-4">
             {Object.entries(aiAnalysis).map(([id, text]) => {
                const signal = MOCK_SIGNALS.find(s => s.id === id);
                return (
                  <div key={id} className="bg-sher-card border border-gray-700 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                      <span className="font-bold text-sher-accent">{signal?.symbol} Analysis</span>
                      <button onClick={() => {
                        const newAnalysis = {...aiAnalysis};
                        delete newAnalysis[id];
                        setAiAnalysis(newAnalysis);
                      }} className="text-sher-muted hover:text-white"><X size={16}/></button>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line font-mono">
                      {text}
                    </p>
                  </div>
                )
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsView;