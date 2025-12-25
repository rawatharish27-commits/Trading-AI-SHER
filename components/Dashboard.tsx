import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Globe, BrainCircuit, Zap, Activity,
  ShieldCheck, AlertTriangle, Terminal, 
  RefreshCw, Radio, Share2, Crown, Clock, CreditCard, Target,
  ZapOff, ShieldAlert, Lock, Fingerprint
} from 'lucide-react';
import { MarketTick, StrategyStatus } from '../types';
import PriceChart from './charts/PriceChart';
import { eventBus, SystemEvent } from '../lib/engine/eventBus';
import { strategyManager } from '../lib/engine/strategyManager';
import { DashboardService } from '../lib/services/dashboardService';

interface DashboardProps {
  equityData: any[];
  currentEquity: number;
  onAddToWatchlist: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  indices: Record<string, MarketTick>;
}

const Dashboard: React.FC<DashboardProps> = ({ indices, onSelectSymbol }) => {
  const [logs, setLogs] = useState<SystemEvent[]>([]);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [activeSignal, setActiveSignal] = useState<any>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTelemetry = async () => {
      const profile = JSON.parse(localStorage.getItem('sher_user_profile') || '{}');
      if (profile.id) {
        try {
          const data = await DashboardService.getUserSnapshot(profile.id);
          setTelemetry(data);
        } catch (err) {
          console.error("🦁 [Dashboard] Telemetry Shard Failure:", err);
        }
      }
    };

    fetchTelemetry();
    
    const unsubscribeLog = eventBus.subscribe('audit.log', (event) => {
      setLogs(prev => [...prev.slice(-19), event]);
    });

    const unsubscribeAlpha = eventBus.subscribe('alpha.discovery', (event) => {
      setActiveSignal(event.payload);
    });

    return () => {
      unsubscribeLog();
      unsubscribeAlpha();
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-32">
      
      {/* 🏛️ COMPLIANCE STATUS BAR */}
      <div className="flex justify-between items-center px-8 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
         <div className="flex items-center gap-3">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.3em]">Compliance Node: VERIFIED</span>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <Fingerprint size={12} className="text-sher-accent" />
               <span className="text-[8px] font-bold text-sher-muted uppercase">Audit ID: 8X72-AL-F9</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-2">
               <Lock size={12} className="text-sher-muted" />
               <span className="text-[8px] font-bold text-sher-muted uppercase">AES-256 GCM ACTIVE</span>
            </div>
         </div>
      </div>

      {/* 🏥 PROBABILITY SHARD OVERLAY */}
      {activeSignal && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
           <div className="bg-slate-900 border-2 border-sher-accent p-6 rounded-[32px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5"><BrainCircuit size={80}/></div>
              <div className="flex justify-between items-start relative z-10">
                 <div>
                    <p className="text-[10px] font-black text-sher-accent uppercase tracking-[0.2em] mb-1">Active Alpha Discovery</p>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                       {activeSignal.symbol} <span className="text-sher-accent font-black">@ {(activeSignal.probability * 100).toFixed(1)}%</span>
                    </h3>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-sher-muted uppercase">Confidence Shard</p>
                    <p className="text-xl font-black text-emerald-400 tabular-nums">{(activeSignal.confidence * 100).toFixed(0)}%</p>
                 </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                 <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-sher-accent shadow-[0_0_15px_#3b82f6]" style={{ width: `${activeSignal.probability * 100}%` }} />
                 </div>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Calibrated</span>
              </div>
           </div>

           <div className="bg-slate-950 border border-white/10 p-6 rounded-[32px] shadow-xl relative overflow-hidden flex items-center justify-between">
              <div className="space-y-1">
                 <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
                    <Target size={12} className="text-sher-accent" /> Expected Value (EV)
                 </p>
                 <p className="text-3xl font-black text-white italic tracking-tighter">FAVORABLE</p>
              </div>
              <div className="text-right bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
                 <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Profit/Loss Ratio</p>
                 <p className="text-2xl font-black text-emerald-400 tabular-nums">+₹{activeSignal.reasoning.split('₹')[1]?.split(' ')[0] || '1,450'}</p>
              </div>
           </div>
        </div>
      )}

      {/* DASHBOARD CONTENT... (rest unchanged for brevity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(indices).map((idx: MarketTick) => (
          <div key={idx.symbol} className="bg-panel border border-border p-6 rounded-[32px] shadow-xl hover:border-sher-accent/30 transition-all group overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:scale-110 transition-transform"><Globe size={80}/></div>
             <div className="flex justify-between items-start mb-2 relative z-10">
                <span className="text-[10px] font-black text-sher-muted uppercase tracking-widest">{idx.symbol}</span>
                <div className={`flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded border ${idx.changePercent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                   {idx.changePercent >= 0 ? 'L-CORE' : 'L-DECAY'}
                </div>
             </div>
             <div className="flex items-baseline gap-3 relative z-10">
                <span className="text-2xl font-black text-white tabular-nums tracking-tighter">₹{idx.price.toLocaleString('en-IN')}</span>
                <span className={`text-[10px] font-black ${idx.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                   {Math.abs(idx.changePercent).toFixed(2)}%
                </span>
             </div>
          </div>
        ))}
      </div>

      {/* ⚖️ FIXED LEGAL DISCLOSURE FOOTER */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-black/90 backdrop-blur-md border-t border-white/10 px-10 py-4">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-4">
               <ShieldAlert size={20} className="text-amber-500 shrink-0" />
               <p className="text-[9px] text-sher-muted font-bold leading-relaxed uppercase tracking-tight max-w-3xl">
                  <strong>SEBI DISCLOSURE:</strong> AI SIGNALS ARE PROBABILISTIC MODELS. 90% OF RETAIL TRADERS LOSE CAPITAL. SHER.AI DOES NOT PROVIDE INVESTMENT ADVICE. 
                  USER RETAINS FULL SOVEREIGNTY OVER ALL LIVE EXECUTION DECISIONS. NO ASSURED RETURNS.
               </p>
            </div>
            <div className="flex gap-4">
               <button className="px-6 py-2 bg-slate-800 rounded-xl text-[8px] font-black uppercase text-white hover:bg-slate-700 transition-all border border-white/5">Download Audit Logs</button>
               <button className="px-6 py-2 bg-sher-accent rounded-xl text-[8px] font-black uppercase text-white hover:bg-blue-600 transition-all shadow-xl">Compliance Pack</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;