import React, { useState, useEffect } from 'react';
import { AISignal, SymbolAnalysis, DecisionState } from '../types';
import { 
  Zap, Bot, Loader2, Crosshair, Activity as Pulse, BrainCircuit, 
  ChevronRight, X, ShieldCheck, Database, RefreshCw, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { analyzeSymbol } from '../services/geminiService';
import PriceChart from './charts/PriceChart';
import AIDecisionPanel from './explain/AIDecisionPanel';
import DecisionTracePanel from './explain/DecisionTracePanel';
import NoTradeExplanationCard from './explain/NoTradeExplanationCard';
import MLTrainingTerminal from './MLTrainingTerminal';
import { signalStreamService } from '../lib/services/signalStreamService';

const SignalsView: React.FC = () => {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: SymbolAnalysis }>({});

  useEffect(() => {
    return signalStreamService.subscribe((newSignal) => {
      setSignals(prev => [newSignal, ...prev].slice(0, 20));
      if (!selectedSignal) setSelectedSignal(newSignal);
    });
  }, [selectedSignal]);

  const handleAnalyze = async (signal: AISignal) => {
    if (analyzingId === signal.id) return;
    setAnalyzingId(signal.id);
    const result = await analyzeSymbol(signal.symbol);
    if (result) setAiAnalysis(prev => ({ ...prev, [signal.id]: result }));
    setAnalyzingId(null);
  };

  const isRejected = selectedSignal?.decisionState === DecisionState.REJECTED;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px] animate-in fade-in duration-700">
      
      {/* 🧭 LIVE SIGNAL FLOW (Decision Shards) */}
      <div className="w-full lg:w-96 flex flex-col gap-4 overflow-hidden shrink-0">
        <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-[10px] font-black text-sher-muted uppercase tracking-[0.3em] flex items-center gap-2">
                <Pulse size={14} className="text-sher-accent" /> Alpha Shard Stream
            </h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 text-sher-muted border border-white/5 text-[8px] font-black uppercase">
               Node Logs
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {signals.length > 0 ? signals.map((signal) => {
            const rejected = signal.decisionState === DecisionState.REJECTED;
            return (
              <div 
                key={signal.id} 
                onClick={() => setSelectedSignal(signal)}
                className={`p-5 rounded-[28px] border transition-all cursor-pointer relative group overflow-hidden ${
                  selectedSignal?.id === signal.id 
                    ? (rejected ? 'bg-slate-900 border-amber-500/50 shadow-2xl' : 'bg-panel border-sher-accent shadow-2xl')
                    : 'bg-panel/50 border-border hover:border-gray-700'
                }`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${rejected ? 'bg-amber-500' : (signal.action === 'BUY' ? 'bg-emerald-500' : 'bg-rose-500')}`}></div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                     <span className="text-lg font-black text-white italic group-hover:text-sher-accent transition-colors">{signal.symbol}</span>
                     <p className="text-[8px] text-sher-muted font-black uppercase tracking-widest mt-1">
                       {rejected ? 'NO_TRADE DECISION' : signal.strategy}
                     </p>
                  </div>
                  <div className="text-right">
                     {rejected ? (
                        <span className="text-[8px] font-black text-amber-500 border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Vetoed</span>
                     ) : (
                        <p className="text-xs font-black text-white">₹{signal.targets.entry}</p>
                     )}
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/5">
                   <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Ensemble Conviction</span>
                      <span className={`text-[9px] font-black ${rejected ? 'text-amber-500' : 'text-white'}`}>{(signal.probability * 100).toFixed(0)}%</span>
                   </div>
                   <ChevronRight size={14} className="text-sher-muted group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          }) : (
            <div className="h-full flex flex-col items-center justify-center opacity-30 space-y-4 py-20">
               <RefreshCw size={48} className="animate-spin text-sher-muted" />
               <p className="text-[10px] font-black uppercase tracking-widest">Scanning Ticks...</p>
            </div>
          )}
        </div>
      </div>

      {/* 🧠 DECISION WORKSPACE (Main Column) */}
      <div className="flex-1 flex flex-col gap-6 min-h-0 relative">
        {selectedSignal ? (
          <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
              
              <div className="xl:col-span-7 space-y-8">
                {isRejected ? (
                   <NoTradeExplanationCard 
                     symbol={selectedSignal.symbol} 
                     reason={selectedSignal.institutionalGuard?.gates.find(g => !g.passed)?.label || 'Alpha Logic'} 
                   />
                ) : (
                   <AIDecisionPanel signal={selectedSignal} analysis={aiAnalysis[selectedSignal.id]} isLoading={analyzingId === selectedSignal.id} />
                )}

                <div className="bg-panel border border-border rounded-[40px] p-8 h-[450px] shrink-0 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none"><Pulse size={120} /></div>
                   <div className="flex justify-between items-center mb-6 relative z-10">
                      <div className="flex items-center gap-3">
                         <Database size={16} className="text-sher-accent" />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">Node Path: {selectedSignal.symbol}</span>
                      </div>
                      <div className="flex gap-2">
                         {['15M', '5M', '1M'].map(tf => <button key={tf} className="px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-[8px] font-black text-sher-muted hover:text-white hover:border-white/20 transition-all">{tf}</button>)}
                      </div>
                   </div>
                   <div className="h-full">
                      <PriceChart data={[]} symbol={selectedSignal.symbol} />
                   </div>
                </div>
              </div>
              
              <div className="xl:col-span-5 space-y-8">
                {/* 🧠 Phase 12: ML Training Terminal */}
                <MLTrainingTerminal />

                {/* Decision Trace Timeline (Phase 1) */}
                {selectedSignal.institutionalGuard && (
                   <DecisionTracePanel 
                      gates={selectedSignal.institutionalGuard.gates} 
                      isRejected={isRejected} 
                   />
                )}
                
                <div className="bg-gradient-to-br from-slate-900 to-black p-8 rounded-[40px] border border-white/5 flex items-center gap-6 shadow-2xl group">
                   <div className={`p-4 rounded-3xl border transition-all ${isRejected ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
                      <ShieldAlert size={32} className={isRejected ? 'animate-pulse' : ''} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-widest">Sovereign Integrity Audit</h4>
                      <p className="text-[9px] text-sher-muted font-bold uppercase mt-1 leading-relaxed opacity-60">
                        {isRejected ? 'Capital safely gated via Institutional Firewall.' : 'Full alpha alignment verified. Dispatch authorized.'}
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 bg-panel border border-border rounded-[48px] flex flex-col items-center justify-center text-center p-12 space-y-6 opacity-30">
            <Zap size={80} className="text-sher-accent animate-pulse" />
            <p className="text-xl font-black text-white uppercase tracking-widest italic">Select Shard to Initialize Audit Trace</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignalsView;
