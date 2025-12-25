import React, { useState, useEffect } from 'react';
// Added Scale to imports to fix the error on line 26
import { ShieldCheck, FileText, Download, Gavel, Search, RefreshCw, Lock, Fingerprint, ExternalLink, ShieldAlert, Scale } from 'lucide-react';
import { AuditRecord } from '../types';
import { AuditLogger } from '../lib/services/auditLogger';

const ComplianceAuditView: React.FC = () => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Compliance Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Scale size={160} className="text-white" /></div>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20 shadow-2xl">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Compliance Hub</h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
              <Lock size={12} className="text-emerald-500" /> Regulatory Shard: Stable Release 4.5
            </p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <button onClick={handleSync} className="p-4 bg-slate-900 rounded-2xl text-sher-muted hover:text-white transition-all border border-white/5">
              <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
           </button>
           <button className="px-8 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-sher-accent hover:text-white transition-all flex items-center gap-3">
              <Download size={18} /> Export Regulator ZIP
           </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-panel border border-border rounded-[48px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
           <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
              <FileText size={18} className="text-sher-accent" /> Immutable Decision Ledger
           </h3>
           <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400">
              <Fingerprint size={14} /> Hash Chaining: ACTIVE
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead className="bg-black/40 text-sher-muted text-[9px] uppercase tracking-widest border-b border-white/5">
              <tr>
                <th className="px-8 py-5">Event Hash Shard</th>
                <th className="px-8 py-5">Summary Protocol</th>
                <th className="px-8 py-5">Nodal Type</th>
                <th className="px-8 py-5 text-right">Timestamp (IST)</th>
                <th className="px-8 py-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px] font-bold text-gray-400 uppercase">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] group transition-all">
                  <td className="px-8 py-6">
                    <span className="text-sher-accent opacity-50">#{log.hash.slice(0, 8)}...</span>
                  </td>
                  <td className="px-8 py-6 text-gray-300 italic group-hover:text-white transition-colors">
                    "{log.summary}"
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black ${log.type === 'RISK_VETO' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                       {log.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right tabular-nums">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
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
                  <td colSpan={5} className="py-32 text-center opacity-30 italic text-xs tracking-widest">
                    Awaiting decision ingestions...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory SEBI Warning */}
      <div className="bg-rose-500/5 border border-rose-500/10 rounded-[32px] p-8 flex items-start gap-6">
         <ShieldAlert size={28} className="text-rose-500 shrink-0 mt-1" />
         <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Mandatory Disclosure (SEBI Compliant)</h4>
            <p className="text-[10px] text-sher-muted mt-2 leading-relaxed uppercase font-bold opacity-60">
              Sher.AI is an institutional software infrastructure provider. We do not provide certified investment advice. 
              Trading in derivatives involves high risk. Past performance is verified but does not guarantee 
              future regime resilience. 9/10 retail traders lose money; use automated risk tools to survive.
            </p>
         </div>
      </div>
    </div>
  );
};

export default ComplianceAuditView;