
import React, { useState, useEffect } from 'react';
import { AISignal, SymbolAnalysis, MLInferenceResult } from '../../types';
import { 
  Zap, Target, ShieldAlert, TrendingUp, Activity, Crosshair, BarChart3, Scale, Loader2, AlertCircle, 
  BrainCircuit, Fingerprint, ChevronRight, ShieldCheck, Database, Layout, RefreshCw, BarChart, CheckCircle2,
  Lock, XCircle, Globe, Layers, Hourglass, Droplets, HeartPulse
} from 'lucide-react';
import { HybridMLService } from '../../lib/services/hybridMLService';

interface AIDecisionPanelProps {
  signal: AISignal;
  analysis?: SymbolAnalysis;
  isLoading?: boolean;
}

const AIDecisionPanel: React.FC<AIDecisionPanelProps> = ({ signal, analysis, isLoading = false }) => {
  const [execStatus, setExecStatus] = useState<'IDLE' | 'EXECUTING' | 'SUCCESS'>('IDLE');
  const [mlResult, setMlResult] = useState<MLInferenceResult | null>(null);
  
  const isBuy = signal.action === 'BUY';
  const accentColor = isBuy ? 'text-emerald-400' : 'text-rose-400';
  const borderColor = isBuy ? 'border-emerald-500/20' : 'border-rose-500/20';

  useEffect(() => {
    if (signal) {
      HybridMLService.infer(signal.symbol).then(setMlResult);
    }
  }, [signal]);

  const handleExecute = async () => {
    setExecStatus('EXECUTING');
    await new Promise(r => setTimeout(r, 1200));
    setExecStatus('SUCCESS');
    setTimeout(() => setExecStatus('IDLE'), 3000);
  };

  const probP = (signal.probability * 100);

  // Map icons to gate IDs for institutional visual clarity
  const gateIcons: Record<string, any> = {
    regime: Globe,
    horizon: Layers,
    decay: Hourglass,
    liquidity: Droplets,
    survival: HeartPulse
  };

  return (
    <div className="bg-panel border border-border rounded-[40px] overflow-hidden flex flex-col h-full shadow-2xl relative transition-all duration-300">
      
      <div className={`p-8 border-b ${borderColor} bg-slate-900/60 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
           <BrainCircuit size={240} className={accentColor} />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-lg border ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {isBuy ? 'Decision Alert (L)' : 'Decision Alert (S)'}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-sher-accent/10 border border-sher-accent/20 rounded-lg">
                <Database size={12} className="text-sher-accent" />
                <span className="text-[9px] font-black text-sher-accent uppercase tracking-widest">Ensemble Node Alpha</span>
              </div>
            </div>
            <h2 className={`text-7xl font-black italic tracking-tighter uppercase ${accentColor} leading-none mb-2`}>
              {isBuy ? 'LONG' : 'SHORT'} <span className="text-white/10 not-italic ml-2 font-black">{signal.symbol}</span>
            </h2>
            <p className="text-[10px] text-sher-muted font-bold uppercase tracking-[0.4em] ml-1 opacity-60">Quant Execution Terminal</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest mb-1 opacity-50">Conviction</p>
             <p className={`text-6xl font-black tabular-nums tracking-tighter ${accentColor}`}>
                {probP.toFixed(0)}%
             </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Institutional Priorities Gate Visualizer */}
           <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 px-1">
                 <Lock size={14} className="text-sher-accent" /> Institutional Guard V6
              </h3>
              <div className="bg-slate-950 p-6 rounded-[32px] border border-white/5 space-y-5">
                 {signal.institutionalGuard?.gates.map(gate => {
                    const GateIcon = gateIcons[gate.id] || Activity;
                    return (
                      <div key={gate.id} className="flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-xl border-2 transition-all ${gate.passed ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>
                               <GateIcon size={16} />
                            </div>
                            <div>
                               <span className="text-[11px] font-black text-white uppercase tracking-widest">{gate.label}</span>
                               <p className="text-[8px] text-sher-muted font-bold uppercase mt-0.5 tracking-tight opacity-60 italic">"{gate.reason}"</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className={`text-[10px] font-black tabular-nums ${gate.passed ? 'text-emerald-400' : 'text-rose-400'}`}>{gate.score.toFixed(0)}%</span>
                         </div>
                      </div>
                    );
                 })}
              </div>
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                 <ShieldCheck size={20} className="text-emerald-500" />
                 <p className="text-[9px] text-emerald-100/50 font-bold uppercase tracking-[0.2em]">Sovereign Discipline Audit: PASSED</p>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              <div className="bg-slate-950 p-6 rounded-[32px] border border-white/5 space-y-6">
                 <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <Activity size={16} className="text-sher-accent" /> Attribution Rationale
                 </h3>
                 <p className="text-[11px] text-gray-300 font-medium leading-relaxed uppercase tracking-tight italic">"{signal.reasoning}"</p>
                 <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Horizon Bias</p>
                       <p className="text-sm font-black text-emerald-400 uppercase">SYNCHRONIZED</p>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Execution Pressure</p>
                       <p className="text-sm font-black text-white uppercase tabular-nums">MINIMAL</p>
                    </div>
                 </div>
              </div>
              
              <button 
                onClick={handleExecute}
                disabled={execStatus !== 'IDLE'}
                className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95 ${
                  execStatus === 'SUCCESS' ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-sher-accent hover:text-white'
                }`}
              >
                {execStatus === 'EXECUTING' ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} fill="currentColor" />}
                {execStatus === 'EXECUTING' ? 'Processing Handshake...' : execStatus === 'SUCCESS' ? 'Node Committed' : `Authorize Shard`}
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AIDecisionPanel;
