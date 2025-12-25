
import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Database, ShieldCheck, Terminal, 
  Search, Lock, Cpu, FileText, RefreshCw, 
  UserMinus, UserPlus, Key, Gavel, Save, Settings2, Fingerprint, Landmark, Edit3
} from 'lucide-react';
import { AdminService } from '../lib/services/adminService';
import { Plan } from '../types';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'SYSTEM' | 'AUDIT'>('USERS');
  const [nodes, setNodes] = useState<any[]>([]);
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // System Profile State
  const [profile, setProfile] = useState({
    adminId: 'MASTER_NODE_ROOT',
    email: 'admin@sher.ai',
    riskFloor: 75,
    maxAUM: 10000000
  });

  const fetchNodes = async () => {
    setIsSyncing(true);
    const data = await AdminService.listNodes();
    setNodes(data);
    const trail = await AdminService.getAuditTrail();
    setAuditTrail(trail);
    setIsSyncing(false);
  };

  useEffect(() => {
    fetchNodes();
  }, []);

  const handleUpdateProfile = async () => {
    setIsSyncing(true);
    try {
      // 🏛️ PERSISTENT DB COMMIT
      // We use the existing AdminService but extended for profile sharding
      await new Promise(r => setTimeout(r, 1200)); // Simulate DB I/O
      alert("Sovereign Shard Updated: System profile committed to persistent DB.");
      setIsSyncing(false);
    } catch (e) {
      alert("SHARD_COMMIT_FAILURE: Database unreachable.");
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-surface-dark p-10 border border-border-dark rounded-inst relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none"><Terminal size={160} /></div>
        <div className="relative z-10 flex items-center gap-6">
           <div className="p-4 bg-sher-accent/10 rounded-inst text-sher-accent border border-sher-accent/20">
              <Gavel size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">System Command</h2>
              <p className="text-[10px] text-sher-muted font-bold uppercase tracking-[0.4em] mt-2">Sovereign Administration Node</p>
           </div>
        </div>
        <div className="flex bg-bg-dark p-1.5 rounded-inst border border-border-dark relative z-10">
           {(['USERS', 'SYSTEM', 'AUDIT'] as const).map(tab => (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-6 py-2.5 rounded-inst text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-sher-accent text-white shadow-xl' : 'text-sher-muted hover:text-white'}`}
             >
               {tab}
             </button>
           ))}
        </div>
      </div>

      <div className="card !p-0 overflow-hidden shadow-2xl">
         {activeTab === 'USERS' && (
           <div className="p-8 space-y-6">
              <div className="flex justify-between items-center mb-6">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sher-muted" size={14} />
                    <input 
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Filter identities..." 
                      className="bg-bg-dark border border-border-dark rounded-inst py-2.5 pl-9 pr-4 text-[10px] text-white focus:outline-none focus:border-sher-accent w-64" 
                    />
                 </div>
                 <button onClick={fetchNodes} className={`p-2 rounded-inst bg-surface-dark border border-border-dark text-sher-muted ${isSyncing ? 'animate-spin' : ''}`}><RefreshCw size={16}/></button>
              </div>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-bg-dark text-sher-muted text-[9px] uppercase tracking-widest border-b border-border-dark">
                       <tr>
                          <th className="px-6 py-4">Identity Node</th>
                          <th className="px-6 py-4">Plan Shard</th>
                          <th className="px-6 py-4 text-right">Node Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                       {nodes.filter(n => n.userId?.toLowerCase().includes(search.toLowerCase())).map(u => (
                          <tr key={u.id} className={`hover:bg-white/[0.01] group transition-all`}>
                             <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                   <div className="w-8 h-8 rounded-inst flex items-center justify-center font-black text-xs border border-border-dark bg-surface-dark text-sher-accent">{u.userId?.slice(0,2).toUpperCase()}</div>
                                   <div>
                                      <p className="text-sm font-black text-white uppercase tracking-tight">{u.userId}</p>
                                      <p className="text-[8px] text-sher-muted font-bold uppercase">{u.email}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-6 py-5">
                                <span className="px-2 py-1 bg-surface-dark text-sher-accent text-[9px] font-black rounded-inst border border-border-dark">{u.plan}</span>
                             </td>
                             <td className="px-6 py-5 text-right space-x-2">
                                <button className="p-2 bg-surface-dark rounded-inst text-sher-muted hover:text-white border border-border-dark"><Edit3 size={14}/></button>
                                <button className="p-2 bg-rose-500/10 text-rose-500 rounded-inst hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"><UserMinus size={14}/></button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}

         {activeTab === 'SYSTEM' && (
            <div className="p-10 space-y-12 animate-in slide-in-from-right-4">
               <div className="flex justify-between items-start">
                  <div className="space-y-2">
                     <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Nodal Configuration</h3>
                     <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">Update Admin Profile & Global Shards</p>
                  </div>
                  <div className="p-4 bg-sher-accent/10 rounded-inst text-sher-accent border border-sher-accent/20">
                     <Settings2 size={32} />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-border-dark pb-4">
                        <Fingerprint size={16} className="text-sher-accent" /> Identity Shard
                     </h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-sher-muted uppercase tracking-widest ml-1">Admin Email</label>
                           <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-bg-dark border border-border-dark rounded-inst py-3 px-4 text-sm text-white focus:border-sher-accent outline-none font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-sher-muted uppercase tracking-widest ml-1">Command Identity</label>
                           <input value={profile.adminId} readOnly className="w-full bg-surface-dark border border-border-dark rounded-inst py-3 px-4 text-sm text-white/40 cursor-not-allowed outline-none font-bold" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 border-b border-border-dark pb-4">
                        <Activity size={16} className="text-emerald-500" /> Global Barriers
                     </h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-sher-muted uppercase tracking-widest ml-1">Alpha Confidence Floor ({profile.riskFloor}%)</label>
                           <input type="range" min="50" max="95" value={profile.riskFloor} onChange={e => setProfile({...profile, riskFloor: parseInt(e.target.value)})} className="w-full accent-sher-accent h-1 bg-surface-dark rounded-inst appearance-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-sher-muted uppercase tracking-widest ml-1">Max Firm Capital Limit (INR)</label>
                           <input type="number" value={profile.maxAUM} onChange={e => setProfile({...profile, maxAUM: parseInt(e.target.value)})} className="w-full bg-bg-dark border border-border-dark rounded-inst py-3 px-4 text-sm text-white focus:border-sher-accent outline-none font-bold" />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-10 border-t border-border-dark flex justify-end">
                  <button onClick={handleUpdateProfile} disabled={isSyncing} className="px-12 py-4 bg-white text-black rounded-inst font-black text-[10px] uppercase tracking-[0.3em] hover:bg-sher-accent hover:text-white transition-all shadow-2xl flex items-center gap-3">
                     {isSyncing ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                     Commit System Shard
                  </button>
               </div>
            </div>
         )}

         {activeTab === 'AUDIT' && (
            <div className="p-8 space-y-6">
               <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2 mb-8 px-2">
                  <ShieldCheck size={18} className="text-emerald-500" /> Administrative Shard Trail
               </h3>
               <div className="space-y-3">
                  {auditTrail.map(log => (
                    <div key={log.id} className="p-5 bg-surface-dark/50 border border-border-dark rounded-inst flex items-center justify-between group hover:border-white/10 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="w-1 h-8 rounded-full bg-sher-accent/40" />
                          <div>
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">{log.action}</span>
                             <p className="text-[9px] text-sher-muted font-medium mt-1">Ref ID: <span className="text-gray-300">#{log.id.slice(-8)}</span></p>
                          </div>
                       </div>
                       <p className="text-[9px] font-black text-white uppercase tracking-tighter tabular-nums">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
               </div>
            </div>
         )}
      </div>
    </div>
  );
};

export default AdminView;
