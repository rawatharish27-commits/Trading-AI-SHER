
import React from 'react';
import { Globe, Server, Activity, ShieldCheck, Zap } from 'lucide-react';
import { RegionalNode } from '../types';

const nodes: RegionalNode[] = [
  { id: '1', region: 'Mumbai (Asia-South1)', status: 'OPTIMAL', latency: 42, activeNodes: 8 },
  { id: '2', region: 'Singapore (Asia-Southeast1)', status: 'OPTIMAL', latency: 58, activeNodes: 4 },
  { id: '3', region: 'London (Europe-West1)', status: 'DEGRADED', latency: 112, activeNodes: 2 },
];

const RegionalNodeMap: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-4">
         <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
               <Globe size={24} className="text-sher-accent" /> Regional <span className="text-sher-accent not-italic">Shard Map</span>
            </h3>
            <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1">Real-time Latency & Health Distribution</p>
         </div>
         <div className="p-3 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20"><Zap size={20} /></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {nodes.map(node => (
          <div key={node.id} className="bg-panel border border-border rounded-[32px] p-8 shadow-xl hover:border-sher-accent/20 transition-all group relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:scale-110 transition-transform"><Server size={80}/></div>
             <div className="flex justify-between items-start mb-6">
                <div>
                   <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1">{node.region}</p>
                   <h4 className="text-sm font-black text-white uppercase tracking-tight">{node.status} NODE</h4>
                </div>
                <div className={`w-2 h-2 rounded-full ${node.status === 'OPTIMAL' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
             </div>
             
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{node.latency}ms</p>
                   <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest mt-1">Round-trip Time</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-black text-white">{node.activeNodes}</p>
                   <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Active Shards</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-start gap-4">
         <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-1" />
         <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase">
           Automatic Failover <span className="text-white">ENABLED</span>. If the Mumbai shard latency breaches <span className="text-rose-400">250ms</span>, execution is automatically re-routed through the Singapore node to ensure minimal slippage.
         </p>
      </div>
    </div>
  );
};

export default RegionalNodeMap;
