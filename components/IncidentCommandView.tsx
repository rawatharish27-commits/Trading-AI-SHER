
import React, { useState } from 'react';
import { Activity, ShieldAlert, Power, ClipboardList, Clock, CheckCircle2, AlertOctagon, ChevronRight, Terminal, ZapOff } from 'lucide-react';
import { IncidentLog } from '../types';

const IncidentCommandView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentLog[]>([
    { id: 'inc-01', type: 'MODEL_DRIFT', status: 'RESOLVED', severity: 'HIGH', timestamp: '2025-01-28 14:20:00', details: 'Nifty Shard win-rate decay below 35% detected.', actionItems: ['Auto-retired strategy', 'Calibrated neural weights'] },
    { id: 'inc-02', type: 'API_OUTAGE', status: 'CONTAINED', severity: 'CRITICAL', timestamp: '2025-01-30 09:15:22', details: 'Broker bridge heartbeat failed (Mumbai).', actionItems: ['Rerouted to Singapore node', 'Dispatched alert to admins'] }
  ]);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-rose-600/10 p-10 rounded-[48px] border border-rose-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldAlert size={160} /></div>
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-500 border border-rose-500/30">
              <AlertOctagon size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Incident Command</h2>
              <p className="text-[10px] text-rose-400/60 font-black uppercase tracking-[0.4em] mt-2 italic">Institutional Outage & Recovery Core</p>
           </div>
        </div>
        <button className="px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 active:scale-95 animate-pulse">
           <Power size={18} /> Emergency Protocol Shard
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <ClipboardList size={18} className="text-sher-accent" /> Incident Log Registry
              </h3>
              <button className="text-[8px] font-black text-sher-muted uppercase hover:text-white transition-all">Export Post-Mortem Pack</button>
           </div>

           <div className="space-y-4">
              {incidents.map(inc => (
                <div key={inc.id} className="bg-panel border border-border rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-rose-500/30 transition-all shadow-xl">
                   <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner ${inc.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                         <ShieldAlert size={24} />
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight italic">{inc.type}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${inc.status === 'RESOLVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>{inc.status}</span>
                         </div>
                         <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1">{inc.timestamp} UTC</p>
                      </div>
                   </div>

                   <div className="flex-1 px-8 border-l border-white/5">
                      <p className="text-xs text-gray-400 font-medium italic">"{inc.details}"</p>
                      <div className="mt-4 flex gap-2">
                         {inc.actionItems.map(item => (
                            <span key={item} className="text-[7px] font-black bg-slate-900 text-emerald-400 px-2 py-1 rounded-lg border border-white/5 uppercase">{item}</span>
                         ))}
                      </div>
                   </div>

                   <button className="p-3 bg-slate-950 rounded-xl text-sher-muted hover:text-white transition-all"><Terminal size={18}/></button>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Activity size={18} className="text-sher-accent" /> Table-Top Drills
              </h3>
              <div className="space-y-4">
                 {[
                   { t: 'Data Breach Handshake', d: 'Simulate credential sharding rotation.', icon: ZapOff },
                   { t: 'Model Decay Protocol', d: 'Simulate 50% WinRate drop recovery.', icon: Terminal },
                   { t: 'API Poison Audit', d: 'Simulate bad tick injection detection.', icon: ShieldAlert }
                 ].map(drill => (
                   <div key={drill.t} className="p-6 bg-slate-950 rounded-[32px] border border-white/5 group hover:bg-slate-900 transition-colors">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <drill.icon size={14} className="text-sher-accent" /> {drill.t}
                      </p>
                      <p className="text-[9px] text-sher-muted font-bold mt-1 uppercase opacity-60">"{drill.d}"</p>
                      <button className="mt-6 w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black text-white uppercase tracking-widest hover:bg-sher-accent transition-all">Launch Simulation Shard</button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentCommandView;
