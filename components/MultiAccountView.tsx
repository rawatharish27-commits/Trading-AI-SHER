
import React, { useState } from 'react';
import { Layers, Briefcase, Zap, ShieldCheck, ArrowRight, Activity, Plus, Database, Landmark, Globe } from 'lucide-react';
import { AccountNode } from '../types';

const MOCK_ACCOUNTS: AccountNode[] = [
    { id: '1', name: 'Primary Prop Desk', broker: 'ANGEL_ONE', balance: 2500000, allocationPct: 60, status: 'CONNECTED' },
    { id: '2', name: 'Beta Algo Node', broker: 'ZERODHA', balance: 1200000, allocationPct: 30, status: 'CONNECTED' },
    { id: '3', name: 'Client Alpha 01', broker: 'MOCK_PAPER', balance: 500000, allocationPct: 10, status: 'DISCONNECTED' },
];

const MultiAccountView: React.FC = () => {
  const [accounts, setAccounts] = useState(MOCK_ACCOUNTS);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-panel p-10 rounded-[40px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5"><Database size={160} className="text-white" /></div>
        <div className="relative z-10">
           <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Account Sharding</h2>
           <p className="text-xs text-sher-muted mt-1 uppercase font-black tracking-[0.2em] flex items-center gap-2">
             <Globe size={14} className="text-sher-accent" /> Institutional Capital Bridge v3.1
           </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
           <div className="text-center sm:text-right px-6 border-r border-white/5 last:border-0">
              <p className="text-[10px] font-black text-sher-muted uppercase mb-1">Total Sharded AUM</p>
              <p className="text-2xl font-black text-white">₹42.00L</p>
           </div>
           <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95 flex items-center gap-3">
              <Plus size={16} /> Attach Account Node
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         <div className="xl:col-span-2 space-y-4">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-panel border border-border rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-sher-accent/20 transition-all shadow-xl">
                 <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white border border-white/5 shadow-inner ${acc.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-sher-muted'}`}>
                       <Landmark size={28} />
                    </div>
                    <div>
                       <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-sher-accent transition-colors">{acc.name}</h4>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-sher-muted uppercase tracking-widest">{acc.broker}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${acc.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span className={`text-[8px] font-black uppercase ${acc.status === 'CONNECTED' ? 'text-emerald-500' : 'text-rose-500'}`}>{acc.status}</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex-1 max-w-md w-full px-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mb-2">
                       <span className="text-sher-muted">AUM Weightage</span>
                       <span className="text-white">{acc.allocationPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                       <div className="h-full bg-sher-accent shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: `${acc.allocationPct}%` }} />
                    </div>
                 </div>

                 <div className="text-center md:text-right min-w-[120px]">
                    <p className="text-[9px] font-black text-sher-muted uppercase mb-1">Session Equity</p>
                    <p className="text-xl font-black text-white tabular-nums tracking-tighter">₹{(acc.balance / 100000).toFixed(1)}L</p>
                 </div>
              </div>
            ))}
         </div>

         <div className="bg-panel border border-border rounded-[32px] p-8 shadow-2xl flex flex-col">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
               <Layers size={18} className="text-sher-accent" /> Routing Policy
            </h3>
            <div className="space-y-6 flex-1">
               {[
                  { label: 'Latency Priority', val: 'SHARD_MUM_01', color: 'text-emerald-400' },
                  { label: 'Fill Logic', val: 'SMART_SWEEP', color: 'text-sher-accent' },
                  { label: 'Risk Barrier', val: 'HARD_STOP_1%', color: 'text-rose-400' },
                  { label: 'Hedge Node', val: 'BANKNIFTY_AUTO', color: 'text-amber-400' },
               ].map(p => (
                 <div key={p.label} className="p-5 bg-slate-950 rounded-2xl border border-white/5 group hover:bg-slate-900 transition-colors">
                    <p className="text-[8px] font-black text-sher-muted uppercase mb-1">{p.label}</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${p.color}`}>{p.val}</p>
                 </div>
               ))}
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4 text-center">
               <ShieldCheck size={32} className="text-emerald-500" />
               <p className="text-[9px] text-sher-muted font-bold uppercase max-w-[200px] leading-relaxed">
                  Execution orders are automatically split across nodes to ensure zero market impact.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MultiAccountView;
