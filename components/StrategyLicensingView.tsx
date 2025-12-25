
import React from 'react';
import { Award, Briefcase, Crown, Key, Landmark, Calculator, Globe, Database, ShieldCheck, ChevronRight, Share2 } from 'lucide-react';
import { StrategyLicense } from '../types';

const licenses: StrategyLicense[] = [
  { id: 'lic-01', strategyId: 'EMA-PB-V4', type: 'PROFESSIONAL', expiry: '2025-12-31', capitalCap: 5000000, revenueSplit: 20, status: 'ACTIVE' },
  { id: 'lic-02', strategyId: 'VWAP-INST', type: 'INSTITUTIONAL', expiry: '2026-06-30', capitalCap: 25000000, revenueSplit: 15, status: 'ACTIVE' },
];

const StrategyLicensingView: React.FC = () => {
  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-panel p-10 rounded-[48px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Key size={200} className="text-sher-accent" /></div>
        <div className="relative z-10 flex items-center gap-6">
           <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
              <Crown size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Strategy <span className="text-sher-accent not-italic">IP Licensing</span></h2>
              <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Sovereign Alpha Monetization Core</p>
           </div>
        </div>
        <div className="hidden lg:flex gap-4 relative z-10">
           <div className="text-right px-8 border-r border-white/5">
              <p className="text-[10px] font-black text-sher-muted uppercase mb-1">Active Licenses</p>
              <p className="text-2xl font-black text-white">42</p>
           </div>
           <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-sher-accent hover:text-white transition-all active:scale-95 flex items-center gap-3">
              <Share2 size={16} /> Deploy Strategy Shard
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 px-4">
               <Database size={18} className="text-sher-accent" /> Licensed Logic Shards
            </h3>

            <div className="grid grid-cols-1 gap-4">
               {licenses.map(lic => (
                 <div key={lic.id} className="bg-panel border border-border rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-sher-accent/30 transition-all shadow-xl relative overflow-hidden">
                    <div className="flex items-center gap-6 w-full md:w-auto">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white border border-white/5 shadow-inner ${lic.type === 'INSTITUTIONAL' ? 'bg-purple-500/10 text-purple-400' : 'bg-sher-accent/10 text-sher-accent'}`}>
                          <Briefcase size={24} />
                       </div>
                       <div>
                          <h4 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-sher-accent transition-colors">{lic.strategyId}</h4>
                          <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">{lic.type} LICENSE</p>
                       </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-8 w-full lg:w-auto px-8 border-l border-white/5">
                       <div>
                          <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1">AUM Limit</p>
                          <p className="text-sm font-black text-white uppercase">₹{(lic.capitalCap/100000).toFixed(0)}L</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1">Split Ratio</p>
                          <p className="text-sm font-black text-white uppercase">{lic.revenueSplit}%</p>
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1">Status</p>
                          <p className="text-sm font-black text-emerald-400 uppercase">ACTIVE</p>
                       </div>
                    </div>

                    <button className="p-3 bg-slate-950 rounded-xl text-sher-muted hover:text-white transition-all"><ChevronRight size={18}/></button>
                 </div>
               ))}
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-8">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                  <Calculator size={18} className="text-sher-accent" /> Revenue Attribution
               </h3>
               <div className="space-y-6">
                  {[
                    { label: 'Firm Alpha Split', val: '₹12,450', icon: Landmark, color: 'text-emerald-400' },
                    { label: 'Author Payout', val: '₹8,120', icon: Award, color: 'text-sher-accent' },
                    { label: 'License Overrun', val: '₹0.00', icon: Database, color: 'text-sher-muted' },
                  ].map(p => (
                    <div key={p.label} className="p-6 bg-slate-950 rounded-[32px] border border-white/5 group hover:bg-slate-900 transition-colors">
                       <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
                          <p.icon size={14} className={p.color} /> {p.label}
                       </p>
                       <p className="text-2xl font-black text-white mt-2 tabular-nums">{p.val}</p>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default StrategyLicensingView;
