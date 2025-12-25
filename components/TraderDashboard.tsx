
import React, { useState, useEffect } from 'react';
import { AISignal, SymbolAnalysis } from '../types';
import { 
  Radio, 
  Activity, 
  Zap, 
  Loader2, 
  AlertCircle,
  Terminal,
  Cpu
} from 'lucide-react';
import { analyzeSymbol } from '../services/geminiService';
import AIDecisionPanel from './explain/AIDecisionPanel';
import PnlWidget from './widgets/PnlWidget';
import PositionsWidget from './widgets/PositionsWidget';
import { signalStreamService } from '../lib/services/signalStreamService';

const TraderDashboard: React.FC = () => {
  const [signals, setSignals] = useState<AISignal[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<AISignal | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: SymbolAnalysis }>({});
  const [systemLogs, setSystemLogs] = useState<string[]>(["[09:00:00] SHER NODE ONLINE", "[09:00:01] Neural Bridge established..."]);

  useEffect(() => {
    const unsubscribe = signalStreamService.subscribe((signal) => {
      setSignals(prev => {
        const next = [signal, ...prev].slice(0, 10);
        if (!selectedSignal) setSelectedSignal(signal);
        return next;
      });
      addLog(`[${signal.timestamp}] DISCOVERY: ${signal.symbol} ${signal.action} (${(signal.probability*100).toFixed(0)}% Prob)`);
    });
    return unsubscribe;
  }, [selectedSignal]);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [msg, ...prev].slice(0, 20));
  };

  const handleSelectSignal = async (signal: AISignal) => {
    setSelectedSignal(signal);
    if (!aiAnalysis[signal.id]) {
      setAnalyzingId(signal.id);
      addLog(`[${new Date().toLocaleTimeString()}] AUDIT: Initiating neural reasoning for ${signal.symbol}...`);
      const result = await analyzeSymbol(signal.symbol);
      if (result) {
        setAiAnalysis(prev => ({ ...prev, [signal.id]: result }));
        addLog(`[${new Date().toLocaleTimeString()}] AUDIT: Logic synchronized for ${signal.symbol}.`);
      }
      setAnalyzingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0 overflow-hidden">
      {/* LEFT COLUMN: Intelligence Feed */}
      <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-[10px] font-black text-sher-muted uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={14} className="text-sher-accent" /> Neural Signal Stream
            </h2>
            <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-sher-success animate-pulse" />
                <div className="w-1 h-1 rounded-full bg-sher-success animate-pulse delay-75" />
                <div className="w-1 h-1 rounded-full bg-sher-success animate-pulse delay-150" />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          {signals.length > 0 ? signals.map(signal => (
            <div 
              key={signal.id}
              onClick={() => handleSelectSignal(signal)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden animate-in slide-in-from-left-4 ${
                selectedSignal?.id === signal.id 
                ? 'bg-panel border-sher-accent shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'bg-panel/50 border-border hover:border-gray-600'
              }`}
            >
              <div className={`absolute top-0 left-0 w-1 h-full ${signal.action === 'BUY' ? 'bg-sher-success' : 'bg-sher-danger'}`} />
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-black text-white group-hover:text-sher-accent transition-colors">{signal.symbol}</span>
                <span className="text-[9px] font-black text-sher-muted uppercase font-mono">{signal.timestamp}</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                   <p className="text-[8px] text-sher-muted font-bold uppercase tracking-widest mb-1">{signal.strategy}</p>
                   <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${signal.action === 'BUY' ? 'bg-sher-success/10 text-sher-success' : 'bg-sher-danger/10 text-sher-danger'}`}>
                     {signal.action}
                   </span>
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest mb-1">PROBABILITY</p>
                   <p className="text-sm font-black text-white tabular-nums">{(signal.probability * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex flex-col items-center justify-center h-40 border border-dashed border-border rounded-2xl text-sher-muted opacity-50">
               <Loader2 className="animate-spin mb-2" size={16} />
               <p className="text-[8px] font-black uppercase tracking-widest">Scanning Market Depth...</p>
            </div>
          )}
        </div>

        {/* Neural Log Terminal */}
        <div className="bg-black/40 rounded-2xl border border-border overflow-hidden h-40 flex flex-col">
            <div className="bg-slate-900 p-2 border-b border-border flex items-center justify-between">
                <span className="text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal size={10} className="text-sher-accent" /> Master Brain Telemetry
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono text-[9px] space-y-1 custom-scrollbar-thin text-emerald-400/80">
                {systemLogs.map((log, i) => (
                    <div key={i} className="truncate">
                        <span className="text-white/20 mr-2 opacity-50 select-none">{systemLogs.length - i}</span>
                        {log}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* CENTER COLUMN: AI Analysis & Decision */}
      <div className="lg:col-span-6 flex flex-col gap-6 overflow-hidden">
        {selectedSignal ? (
          <AIDecisionPanel 
            signal={selectedSignal} 
            analysis={aiAnalysis[selectedSignal.id]} 
            isLoading={analyzingId === selectedSignal.id} 
          />
        ) : (
          <div className="flex-1 bg-panel border border-border rounded-3xl flex flex-col items-center justify-center text-center p-12 space-y-4">
            <Radio size={64} className="text-sher-muted/20 animate-pulse" />
            <div>
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Awaiting Link</h3>
                <p className="text-xs text-sher-muted max-w-xs mt-2">Select a signal from the left feed to initialize the neural decision audit.</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Real-time Monitor Widgets */}
      <div className="lg:col-span-3 flex flex-col gap-6 overflow-hidden">
        <PnlWidget />
        <PositionsWidget />
      </div>
    </div>
  );
};

export default TraderDashboard;
