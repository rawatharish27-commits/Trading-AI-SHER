
import React, { useState } from 'react';
import { Headphones, Mail, MessageSquare, Clock, ShieldAlert, ChevronRight, Filter, Search, CheckCircle2, User, AlertCircle, LifeBuoy } from 'lucide-react';
import { SupportTicket } from '../types';

const SupportDeskView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([
    { id: 'T-101', user: 'trader_alpha', subject: 'Broker connection heartbeat delay', level: 2, status: 'OPEN', timestamp: '2025-01-31 14:22:00' },
    { id: 'T-102', user: 'institutional_node_1', subject: 'CRITICAL: Multi-account shard drift', level: 3, status: 'IN_PROGRESS', timestamp: '2025-01-31 15:45:00' },
    { id: 'T-103', user: 'retail_node_42', subject: 'Clarification on VWAP Alpha Node', level: 1, status: 'RESOLVED', timestamp: '2025-01-30 11:10:00' }
  ]);

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-panel p-10 rounded-[48px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><LifeBuoy size={200} className="text-sher-accent" /></div>
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20 shadow-2xl">
              <Headphones size={32} />
           </div>
           <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Support Desk</h2>
              <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Nodal Resolution & Escalation Core</p>
           </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <button className="px-8 py-4 bg-slate-900 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3">
              <MessageSquare size={16} /> Assign Level 1 Node
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
           <div className="flex justify-between items-center px-4">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Clock size={18} className="text-sher-accent" /> Ticket Queue
              </h3>
              <div className="flex gap-3">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sher-muted" size={14} />
                    <input placeholder="Search tickets..." className="bg-slate-950 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-sher-accent w-48" />
                 </div>
                 <button className="p-2 bg-slate-900 rounded-xl text-sher-muted border border-white/10"><Filter size={16}/></button>
              </div>
           </div>

           <div className="space-y-4">
              {tickets.map(ticket => (
                <div key={ticket.id} className="bg-panel border border-border rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-sher-accent/20 transition-all shadow-xl relative overflow-hidden">
                   <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-white/5 ${
                        ticket.level === 3 ? 'bg-rose-500/10 text-rose-500' : (ticket.level === 2 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500')
                      }`}>
                         {ticket.level === 3 ? <AlertCircle size={28} /> : (ticket.level === 2 ? <ShieldAlert size={28} /> : <LifeBuoy size={28} />)}
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black text-white uppercase tracking-tight italic">{ticket.id}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ticket.status === 'RESOLVED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-black'}`}>{ticket.status}</span>
                         </div>
                         <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest mt-1">USER: {ticket.user}</p>
                      </div>
                   </div>

                   <div className="flex-1 px-8 border-l border-white/5">
                      <p className="text-xs text-gray-300 font-bold uppercase tracking-tight leading-relaxed italic">"{ticket.subject}"</p>
                      <p className="text-[8px] text-sher-muted mt-2 uppercase">{ticket.timestamp} UTC</p>
                   </div>

                   <button className="p-3 bg-slate-950 rounded-xl text-sher-muted hover:text-white transition-all"><ChevronRight size={20}/></button>
                </div>
              ))}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-10">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <ShieldAlert size={18} className="text-sher-accent" /> Escalation Matrix
              </h3>
              <div className="space-y-6">
                 {[
                   { l: 'LEVEL 1: General', t: '24 hrs', o: 'Support Shard', c: 'text-emerald-400' },
                   { l: 'LEVEL 2: Technical', t: '12 hrs', o: 'Quant Lead', c: 'text-amber-400' },
                   { l: 'LEVEL 3: Critical', t: '2 hrs', o: 'CTO / Compliance', c: 'text-rose-500' }
                 ].map(esc => (
                   <div key={esc.l} className="p-6 bg-slate-950 rounded-[32px] border border-white/5 space-y-2 group hover:bg-slate-900 transition-colors">
                      <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest">{esc.l}</p>
                      <div className="flex justify-between items-center">
                         <span className={`text-sm font-black uppercase ${esc.c}`}>SLA: {esc.t}</span>
                         <span className="text-[8px] font-black text-white/50 uppercase">{esc.o}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl text-center space-y-6">
              <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 w-fit mx-auto">
                 <CheckCircle2 size={32} />
              </div>
              <div>
                 <h4 className="text-sm font-black text-white uppercase tracking-tight">Resolution Integrity</h4>
                 <p className="text-[9px] text-sher-muted font-bold uppercase mt-2 px-4 leading-relaxed">
                   Every support resolution is audited for compliance to ensure no unauthorized trading advice was dispatched.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SupportDeskView;
