
import React from 'react';
import { ShieldCheck, Lock, Fingerprint, Activity, Zap, Shield, AlertTriangle, CheckCircle2, Terminal, Globe, Server } from 'lucide-react';
import { PentestVulnerability } from '../types';

const SecurityAuditView: React.FC = () => {
  const vulns: PentestVulnerability[] = [
    { id: 'v-01', title: 'SQL Sharding Latency Drift', severity: 'LOW', status: 'FIXED' },
    { id: 'v-02', title: 'TOTP Heartbeat Timeout', severity: 'MEDIUM', status: 'IN_REMEDIATION' }
  ];

  return (
    <div className="space-y-10 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-slate-900/30 p-10 rounded-[48px] border border-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><Shield size={180} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent border border-sher-accent/20">
            <Lock size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Security <span className="text-sher-accent not-italic">Posture</span></h2>
            <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2">Sovereign Encryption Core v4.1</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-emerald-500/10 px-8 py-6 rounded-3xl border border-emerald-500/20 relative z-10">
           <ShieldCheck size={32} className="text-emerald-500" />
           <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">SOC-2 Status</p>
              <p className="text-lg font-black text-white uppercase">AUDIT READY</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-panel border border-border rounded-[48px] p-8 shadow-2xl space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Terminal size={18} className="text-sher-accent" /> Pentest Remediation
              </h3>
              <div className="grid grid-cols-1 gap-4">
                 {vulns.map(v => (
                   <div key={v.id} className="bg-slate-950 p-6 rounded-3xl border border-white/5 flex items-center justify-between group hover:bg-slate-900 transition-colors">
                      <div className="flex items-center gap-6">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 ${v.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-sher-muted'}`}>
                            <AlertTriangle size={18} />
                         </div>
                         <div>
                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{v.title}</h4>
                            <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest mt-1">{v.severity} SEVERITY</p>
                         </div>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase ${v.status === 'FIXED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                         {v.status}
                      </span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                 <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20">
                    <Fingerprint size={32} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Cryptographic Ledger</h3>
                    <p className="text-xs text-sher-muted font-bold uppercase tracking-widest mt-1">Nodal integrity tracking via hash-chaining</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { label: 'Token Vault Hash', val: '8x72-4291-B7X', icon: Lock, status: 'SECURE' },
                   { label: 'Audit Chain Head', val: 'F9A2-821B-001', icon: Activity, status: 'VERIFIED' }
                 ].map(node => (
                   <div key={node.label} className="p-6 bg-slate-950 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2 mb-2">
                         <node.icon size={14} className="text-sher-accent" /> {node.label}
                      </p>
                      <p className="text-xs font-black text-white font-mono">{node.val}</p>
                      <div className="mt-6 flex items-center justify-between">
                         <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">{node.status}</span>
                         <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                 <Globe size={18} className="text-sher-accent" /> Regional Isolation
              </h3>
              <div className="space-y-4">
                 {[
                   { r: 'Asia-South1', s: 'OPTIMAL', i: Server },
                   { r: 'Europe-West1', s: 'OPTIMAL', i: Server },
                   { r: 'Americas-East1', s: 'STANDBY', i: Server }
                 ].map(reg => (
                   <div key={reg.r} className="p-5 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                         <reg.i size={16} className="text-sher-accent" />
                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{reg.r}</span>
                      </div>
                      <span className={`text-[8px] font-black uppercase ${reg.s === 'OPTIMAL' ? 'text-emerald-500' : 'text-sher-muted'}`}>{reg.s}</span>
                   </div>
                 ))}
              </div>
              <p className="text-[9px] text-sher-muted font-bold uppercase tracking-widest text-center leading-relaxed italic opacity-60">
                 Data is region-locked to Mumbai (IN) for SEBI/CERT-In residency compliance.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityAuditView;
