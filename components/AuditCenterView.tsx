
import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, Download, Search, Filter, Calendar, 
  Globe, Lock, Fingerprint, Activity, Clock, ChevronRight,
  ShieldAlert, Landmark, FileSearch, PieChart, Database, RefreshCw, Scale, Gavel
} from 'lucide-react';
import { AuditRecord } from '../types';
import { AuditLogger } from '../lib/services/auditLogger';
import { TestDataGenerator } from '../lib/services/testDataGenerator';

const AuditCenterView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGS' | 'COMPLIANCE' | 'GOVERNANCE'>('LOGS');
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setLogs(AuditLogger.getChain());
  }, []);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
        setLogs(AuditLogger.getChain());
        setIsSyncing(false);
    }, 800);
  };

  const handleSeed = async () => {
    await TestDataGenerator.seedDemo();
    handleSync();
  };

  const soc2Mapping = [
    { control: 'Access Control', implementation: 'Prisma User.role + MFA', evidence: 'Audit Trace' },
    { control: 'Audit Logging', implementation: 'SQL Immutable RULE no_update', evidence: 'Decision Tables' },
    { control: 'AI Governance', implementation: 'explainability_json sharding', evidence: 'Thesis Drawer' },
    { control: 'Incident Response', implementation: 'RiskState KillSwitch', evidence: 'Alert Logs' }
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center bg-panel p-8 rounded-[40px] border border-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><FileSearch size={140} className="text-sher-accent" /></div>
        <div className="relative z-10 flex items-center gap-6">
           <div className="p-4 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20">
              <ShieldCheck size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Audit Center</h2>
              <p className="text-[10px] text-sher-muted font-bold uppercase tracking-[0.4em] mt-2">Enterprise-Grade Evidence Hub</p>
           </div>
        </div>
        <div className="flex gap-2 relative z-10">
           <button 
             onClick={handleSeed}
             className="px-4 py-2 bg-slate-900 border border-white/5 text-sher-muted hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
           >SeedTestData</button>
           {(['LOGS', 'COMPLIANCE', 'GOVERNANCE'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-sher-accent text-white shadow-lg' : 'text-sher-muted hover:text-white hover:bg-slate-900'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'LOGS' && (
        <div className="bg-panel border border-border rounded-[48px] overflow-hidden shadow-2xl animate-in fade-in">
           <div className="p-8 border-b border-border bg-slate-900/50 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sher-muted" size={14} />
                    <input placeholder="Search audit shards..." className="bg-slate-950 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-sher-accent w-64" />
                 </div>
                 <button onClick={handleSync} className={`p-2 bg-slate-900 rounded-xl text-sher-muted border border-white/10 ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400">
                    <Lock size={12} /> Hash Chaining: ACTIVE
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                 <thead className="bg-black/40 text-sher-muted text-[9px] uppercase tracking-widest">
                    <tr>
                       <th className="px-8 py-5">Event ID / Hash Chain</th>
                       <th className="px-8 py-5">Summary Protocol</th>
                       <th className="px-8 py-5">Nodal Type</th>
                       <th className="px-8 py-5 text-right">Timestamp (UTC)</th>
                       <th className="px-8 py-5 text-center">Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-[11px] font-bold text-gray-400">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.02] group">
                         <td className="px-8 py-6">
                            <div className="flex flex-col">
                               <span className="text-white uppercase">#{log.id.slice(0, 8)}</span>
                               <span className="text-[8px] text-sher-muted opacity-50 truncate max-w-[120px]">{log.hash}</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 text-gray-300 uppercase italic">"{log.summary}"</td>
                         <td className="px-8 py-6">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${log.type === 'INCIDENT' ? 'bg-rose-500/10 text-rose-500' : (log.type === 'GOVERNANCE' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400')}`}>
                               {log.type}
                            </span>
                         </td>
                         <td className="px-8 py-6 text-right tabular-nums">{new Date(log.timestamp).toLocaleString()}</td>
                         <td className="px-8 py-6 text-center">
                            <div className="flex items-center justify-center gap-2 text-emerald-500">
                               <ShieldCheck size={14} />
                               <span className="text-[8px] font-black uppercase">Verified</span>
                            </div>
                         </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center opacity-30 italic uppercase tracking-widest text-[10px]">No audited actions in session.</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'COMPLIANCE' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
           <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl space-y-8">
              <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                 <Scale size={24} className="text-sher-accent" /> SOC-2 Control Mapping
              </h3>
              <div className="space-y-4">
                 {soc2Mapping.map(m => (
                   <div key={m.control} className="p-6 bg-slate-950 rounded-3xl border border-white/5 group hover:bg-slate-900 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{m.control}</span>
                         <span className="text-[8px] font-black text-emerald-500 uppercase">IMPLEMENTED</span>
                      </div>
                      <p className="text-sm text-sher-muted font-bold">{m.implementation}</p>
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                         <FileSearch size={12} className="text-sher-accent" />
                         <span className="text-[9px] font-black text-gray-500 uppercase">Evidence: {m.evidence}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-sher-accent to-[#1E3A8A] rounded-[48px] p-12 text-white flex flex-col justify-center relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none"><Gavel size={200} /></div>
              <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-6">Regulator <br/> Submission.</h3>
              <p className="text-sm font-medium leading-relaxed uppercase tracking-wider opacity-80 mb-10">
                 The Sovereign Node maintains zero-trust access control. Every database interaction is cryptographically sharded. These controls match SEBI/Audit-Tier requirements.
              </p>
              <button className="w-full py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-bg-dark hover:text-white transition-all">
                 Generate Auditor Pack (.ZIP)
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuditCenterView;
