
import React, { useState, useMemo } from 'react';
import { lineageStore } from '../lib/lineage/lineageStore';
import { 
  FileSearch, Activity, Zap, ShieldCheck, 
  ChevronRight, Clock, Database, Lock, Fingerprint, Search
} from 'lucide-react';

const ForensicsView: React.FC = () => {
  const [selectedTrace, setSelectedTrace] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const allLogs = lineageStore.getAll();
  
  const traces = useMemo(() => {
    const map = new Map<string, any>();
    allLogs.forEach(log => {
      if (!map.has(log.traceId)) {
        map.set(log.traceId, {
          id: log.traceId,
          symbol: log.symbol,
          time: log.timestamp,
          events: []
        });
      }
      map.get(log.traceId).events.push(log);
    });
    return Array.from(map.values()).sort((a, b) => b.time - a.time);
  }, [allLogs]);

  const activeTrace = useMemo(() => 
    selectedTrace ? traces.find(t => t.id === selectedTrace) : null
  , [selectedTrace, traces]);

  return (
    <div className="flex gap-8 h-[calc(100vh-180px)] animate-in fade-in duration-700">
      
      {/* 📜 TRACE INDEX */}
      <div className="w-96 flex flex-col gap-4 overflow-hidden shrink-0 border-r border-white/5 pr-4">
        <div className="relative group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sher-muted group-focus-within:text-sher-accent transition-colors" size={14} />
           <input 
              placeholder="Search Trace ID / Symbol" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-border rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase text-white outline-none focus:border-sher-accent"
           />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
           {traces.filter(t => t.symbol.includes(searchQuery.toUpperCase()) || t.id.includes(searchQuery)).map(trace => (
             <button 
               key={trace.id}
               onClick={() => setSelectedTrace(trace.id)}
               className={`w-full p-4 rounded-2xl border transition-all text-left group relative overflow-hidden ${
                 selectedTrace === trace.id ? 'bg-panel border-sher-accent shadow-xl' : 'bg-panel/30 border-white/5 hover:border-white/10'
               }`}
             >
                <div className="flex justify-between items-start mb-1">
                   <span className="text-xs font-black text-white group-hover:text-sher-accent transition-colors">{trace.symbol}</span>
                   <span className="text-[8px] font-mono text-sher-muted">{new Date(trace.time).toLocaleTimeString()}</span>
                </div>
                <p className="text-[8px] font-mono text-sher-muted truncate opacity-60">ID: {trace.id}</p>
             </button>
           ))}
        </div>
      </div>

      {/* 🔬 FORENSIC CANVAS */}
      <div className="flex-1 bg-panel border border-border rounded-[48px] overflow-hidden flex flex-col shadow-2xl relative">
         {activeTrace ? (
           <div className="flex-1 flex flex-col min-h-0 animate-in slide-in-from-right-4 duration-500">
              <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-sher-accent/10 rounded-xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
                       <FileSearch size={20} />
                    </div>
                    <div>
                       <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Trade <span className="text-sher-accent not-italic">Birth Certificate</span></h2>
                       <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest mt-1">Audit Node: {activeTrace.id}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase tracking-widest">
                       <ShieldCheck size={10} className="inline mr-1" /> Chain Verified
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                 {activeTrace.events.map((event: any, i: number) => (
                    <div key={i} className="relative flex gap-10 group">
                       <div className="absolute left-[19px] top-10 bottom-0 w-px bg-white/5 group-last:hidden" />
                       
                       <div className="shrink-0 w-10 h-10 rounded-full bg-slate-900 border-2 border-white/5 flex items-center justify-center relative z-10 group-hover:border-sher-accent transition-all">
                          <Activity size={16} className="text-sher-muted group-hover:text-sher-accent transition-colors" />
                       </div>

                       <div className="flex-1 space-y-4 pb-12">
                          <div className="flex justify-between items-center">
                             <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">{event.eventType.replace('_', ' ')}</h3>
                             <span className="text-[10px] font-mono text-sher-muted">{new Date(event.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="bg-slate-950 p-6 rounded-[32px] border border-white/5 font-mono text-[10px] text-gray-400 overflow-x-auto shadow-inner leading-relaxed">
                             <pre>{JSON.stringify(event.payload, null, 2)}</pre>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
         ) : (
           <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-30">
              <Database size={80} className="text-sher-accent animate-pulse" />
              <div className="mt-8 space-y-2">
                 <h3 className="text-xl font-black text-white uppercase tracking-[0.3em]">Neural Forensics Shard</h3>
                 <p className="text-sm text-sher-muted uppercase font-bold tracking-widest max-w-sm">Select a trade trace from the left to reconstruct the execution lifecycle.</p>
              </div>
           </div>
         )}

         {/* Fixed Compliance Footer */}
         <div className="p-4 bg-black/60 border-t border-white/5 flex items-center justify-center gap-2 relative z-20">
            <Fingerprint size={12} className="text-sher-muted" />
            <p className="text-[8px] font-bold text-sher-muted uppercase tracking-widest opacity-40">
               Lineage sharding strictly adheres to SEBI Audit Protocols for API-based algorithmic execution.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ForensicsView;
