
import React, { useState } from 'react';
import { AISignal } from '../types';
import { Zap, Activity, ChevronRight, BrainCircuit, ShieldAlert, Filter, Bell, Clock, Search } from 'lucide-react';

interface AlertFeedProps {
  signals: AISignal[];
  onSignalClick: (signal: AISignal) => void;
  onClose?: () => void;
}

const AlertFeed: React.FC<AlertFeedProps> = ({ signals, onSignalClick, onClose }) => {
  const [filterHighProb, setFilterHighProb] = useState(true);

  const filteredSignals = filterHighProb 
    ? signals.filter(s => s.probability > 0.85) 
    : signals;

  // Sort by newest and probability
  const sortedSignals = [...filteredSignals].sort((a, b) => b.probability - a.probability);

  return (
    <div className="flex flex-col h-full bg-bg border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header Area */}
      <div className="p-6 border-b border-border bg-panel/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sher-accent/10 rounded-xl text-sher-accent">
              <Bell size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase tracking-tighter">Alpha Intel</h2>
              <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">Neural Discovery Stream</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-2 text-sher-muted hover:text-white bg-white/5 rounded-full">
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 bg-black/40 p-1 rounded-2xl border border-white/5">
           <button 
             onClick={() => setFilterHighProb(true)}
             className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filterHighProb ? 'bg-sher-accent text-white shadow-lg' : 'text-sher-muted'}`}
           >
             Alpha Only
           </button>
           <button 
             onClick={() => setFilterHighProb(false)}
             className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!filterHighProb ? 'bg-sher-accent text-white shadow-lg' : 'text-sher-muted'}`}
           >
             All Discovery
           </button>
        </div>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {sortedSignals.length > 0 ? sortedSignals.map((signal) => {
          const isExtreme = signal.probability > 0.92;
          const isBuy = signal.action === 'BUY';

          return (
            <div 
              key={signal.id}
              onClick={() => onSignalClick(signal)}
              className={`relative group bg-panel border-2 rounded-[28px] p-5 cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                isExtreme ? 'border-sher-accent shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-border hover:border-gray-700'
              }`}
            >
              {/* Critical Glow for Extreme Probability */}
              {isExtreme && (
                <div className="absolute inset-0 bg-sher-accent/5 rounded-[28px] animate-pulse pointer-events-none" />
              )}

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl flex items-center justify-center ${
                    isBuy ? 'bg-sher-success/20 text-sher-success' : 'bg-sher-danger/20 text-sher-danger'
                  }`}>
                    <Zap size={20} fill="currentColor" className={isExtreme ? 'animate-bounce' : ''} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                       <h3 className="text-xl font-black text-white tracking-tighter uppercase">{signal.symbol}</h3>
                       {isExtreme && (
                         <span className="text-[7px] bg-sher-accent text-white px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest animate-pulse">Critical</span>
                       )}
                    </div>
                    <p className="text-[9px] text-sher-muted font-black uppercase tracking-widest opacity-60">{signal.strategy}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest mb-0.5">Ensemble</p>
                  <p className={`text-lg font-black tabular-nums tracking-tighter ${isExtreme ? 'text-sher-accent' : 'text-white'}`}>
                    {(signal.probability * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest mb-1">Action</p>
                   <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${isBuy ? 'text-sher-success' : 'text-sher-danger'}`}>
                     {isBuy ? 'Long Entry' : 'Short Entry'}
                   </span>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest mb-1">Flow</p>
                   <span className="text-[10px] font-black text-white uppercase truncate">{signal.smartMoneyFlow}</span>
                </div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5">
                   <Clock size={10} className="text-sher-muted" />
                   <span className="text-[9px] font-black text-sher-muted uppercase font-mono">{signal.timestamp}</span>
                </div>
                <button className="flex items-center gap-1 text-[9px] font-black text-sher-accent uppercase tracking-widest hover:underline group">
                  Audit Logic <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              {/* Bottom Confidence Slider */}
              <div className="mt-4 h-1 w-full bg-slate-900 rounded-full overflow-hidden relative z-10 border border-white/5">
                <div 
                  className={`h-full transition-all duration-1000 ${isExtreme ? 'bg-sher-accent' : (isBuy ? 'bg-sher-success' : 'bg-sher-danger')}`} 
                  style={{ width: `${signal.probability * 100}%` }} 
                />
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-40">
             <Activity size={48} className="text-sher-muted animate-pulse" />
             <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest max-w-[160px]">Neural core scanning for high-alpha entry points...</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border bg-panel/30">
         <div className="flex items-start gap-3">
            <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-sher-muted font-bold leading-relaxed uppercase tracking-tight">
               Signals are filtered through <span className="text-white">Institutional Guardrails</span>. High probability does not guarantee capital safety.
            </p>
         </div>
      </div>
    </div>
  );
};

export default AlertFeed;
