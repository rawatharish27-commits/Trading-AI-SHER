
import React, { useState } from 'react';
import { 
  Shield, Key, Sliders, LogOut, Save, Smartphone, CheckCircle, Lock, 
  Palette, Fingerprint, Loader2, AlertCircle, Mail, User, ShieldCheck, RefreshCw, X, Hash, Download, FileText 
} from 'lucide-react';
import { UserProfile, VerificationAction, SecurityHandshake } from '../types';
import { securityService } from '../lib/services/securityService';

interface SettingsViewProps {
    currentUser: UserProfile;
    onLogout: () => void;
    onUpdateProfile: (p: UserProfile) => void;
    onThemeChange: (theme: string) => void;
    activeTheme: string;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onLogout, onUpdateProfile, onThemeChange, activeTheme }) => {
  const [activeTab, setActiveTab] = useState<'security' | 'profile' | 'appearance'>('security');
  const [handshake, setHandshake] = useState<{ action: VerificationAction | null, state: SecurityHandshake }>({ action: null, state: 'IDLE' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Pending Updates State
  const [pendingUpdate, setPendingUpdate] = useState<Partial<UserProfile>>({});

  const initiateSecurityAction = async (action: VerificationAction, data: Partial<UserProfile>) => {
    setPendingUpdate(data);
    setHandshake({ action, state: 'CHALLENGE_SENT' });
    await securityService.dispatchHandshake(currentUser.email, currentUser.mobile);
  };

  const verifyAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456') {
      setHandshake(prev => ({ ...prev, state: 'VERIFYING' }));
      await new Promise(r => setTimeout(r, 1000));
      
      const success = securityService.commitUpdate(currentUser.userId, pendingUpdate);
      if (success) {
        onUpdateProfile({ ...currentUser, ...pendingUpdate });
        setHandshake({ action: null, state: 'SUCCESS' });
        setTimeout(() => setHandshake({ action: null, state: 'IDLE' }), 2000);
      }
    } else {
      setError("Challenge Refused: Key Mismatch.");
    }
  };

  /**
   * 📄 DOWNLOAD USER MANUAL
   * Fetches the generated manual content and triggers a local file export.
   */
  const handleDownloadManual = async () => {
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 1500)); // Network simulation

    try {
      // In a real app, this would be a fetch call to an endpoint or static file
      // Here we simulate getting the content from the documentation we created
      const manualContent = `# SHER.AI USER MANUAL\nVersion: 4.2.0-Stable\n\n(Follow the documentation provided in USER_MANUAL.md for full details.)`;
      
      const element = document.createElement("a");
      const file = new Blob([manualContent], {type: 'text/markdown'});
      element.href = URL.createObjectURL(file);
      element.download = "SHER_AI_User_Manual.md";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      console.error("Manual Export Failed", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight italic">Node <span className="text-sher-accent not-italic">Governance</span></h2>
            <p className="text-sher-muted text-xs font-black uppercase tracking-widest mt-1 opacity-60">System ID: {currentUser.userId}</p>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck size={12}/> Verified Identity
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-1 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
          {[
            { id: 'security', label: 'Vault Security', icon: Shield },
            { id: 'profile', label: 'Identity Node', icon: User },
            { id: 'appearance', label: 'Visual UI', icon: Palette },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-sher-accent text-white shadow-xl shadow-sher-accent/20' : 'text-sher-muted hover:text-white'}`}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        <button 
          onClick={handleDownloadManual}
          disabled={isDownloading}
          className="px-6 py-3 bg-slate-800 border border-border text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-700 transition-all shadow-xl shadow-black/20"
        >
          {isDownloading ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
          User Manual.md
        </button>
      </div>

      <div className="bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative overflow-hidden min-h-[500px]">
        {/* CHALLENGE MODAL OVERLAY */}
        {handshake.state !== 'IDLE' && handshake.state !== 'SUCCESS' && (
           <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in">
              <div className="max-w-sm w-full text-center space-y-8">
                 <div className="w-20 h-20 bg-sher-accent/10 rounded-3xl flex items-center justify-center text-sher-accent mx-auto border border-sher-accent/20">
                    <Smartphone size={40} className="animate-bounce" />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Security Handshake</h3>
                    <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest leading-relaxed">Enter the 6-digit key sent to registered shard (123456)</p>
                 </div>
                 <form onSubmit={verifyAction} className="space-y-6">
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-slate-900 border-2 border-sher-accent/50 text-white text-center text-4xl font-black tracking-[0.5em] rounded-3xl py-6 outline-none shadow-2xl" maxLength={6} required />
                    <div className="flex gap-4">
                       <button type="button" onClick={() => {setHandshake({action:null, state:'IDLE'}); setOtp('');}} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">Abort</button>
                       <button type="submit" className="flex-[2] py-4 bg-sher-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Commit Identity</button>
                    </div>
                 </form>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex justify-between items-start">
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Key Management</h3>
                   <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">Last changed: {new Date(currentUser.securityAudit.lastPasswordChange).toLocaleDateString()}</p>
                </div>
                <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20"><Lock size={24} /></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-950 p-8 rounded-[40px] border border-white/5 space-y-6">
                   <h4 className="text-[10px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2"><Key size={14} className="text-sher-accent" /> New Access Key</h4>
                   <div className="space-y-4">
                      <input id="new_pass" type="password" placeholder="Min 8 characters" className="w-full bg-slate-900 border border-border text-white rounded-2xl py-4 px-6 text-sm font-bold focus:border-sher-accent outline-none" />
                      <button onClick={() => initiateSecurityAction('PWD_CHANGE', { password: (document.getElementById('new_pass') as HTMLInputElement).value })} className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sher-accent hover:text-white transition-all active:scale-95 shadow-xl">Update Access Shard</button>
                   </div>
                </div>

                <div className="bg-rose-500/5 p-8 rounded-[40px] border border-rose-500/10 space-y-6 flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500"><LogOut size={32} /></div>
                   <h4 className="text-xs font-black text-white uppercase tracking-widest">Terminate Account</h4>
                   <p className="text-[10px] text-sher-muted font-bold leading-relaxed uppercase">Nuclear option: Purges all neural shards and execution nodes permanently.</p>
                   <button onClick={onLogout} className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest">Terminate Session</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-12 animate-in slide-in-from-left-4">
             <div className="flex justify-between items-start border-b border-white/5 pb-8">
                <div className="space-y-2">
                   <h3 className="text-xl font-black text-white uppercase tracking-tight italic">Identity Registry</h3>
                   <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">Immutable Institutional Record</p>
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-sher-accent border border-white/5 shadow-inner">
                   <Fingerprint size={32} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-8">
                {[
                   { label: 'Registered Email', val: currentUser.email, icon: Mail, key: 'email' },
                   { label: 'Secure Mobile', val: currentUser.mobile, icon: Smartphone, key: 'mobile' },
                   { label: 'Regional Shard', val: `${currentUser.city}, ${currentUser.state}`, icon: Hash, key: 'location' }
                ].map(item => (
                  <div key={item.label} className="p-6 bg-slate-950 rounded-3xl border border-white/5 group hover:bg-slate-900 transition-colors">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[9px] font-black text-sher-muted uppercase tracking-widest mb-1">{item.label}</p>
                           <p className="text-sm font-black text-white uppercase tracking-tight">{item.val}</p>
                        </div>
                        <button onClick={() => initiateSecurityAction(item.key.toUpperCase() as any, {})} className="p-2 bg-slate-800 rounded-xl text-sher-muted hover:text-sher-accent transition-colors"><RefreshCw size={14}/></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'appearance' && (
           <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-3 gap-6">
                 {['default', 'alpha', 'obsidian'].map(t => (
                    <button key={t} onClick={() => onThemeChange(t)} className={`p-8 rounded-[40px] border-2 transition-all text-center relative overflow-hidden ${activeTheme === t ? 'border-sher-accent bg-slate-950' : 'border-border bg-slate-900 hover:border-gray-600'}`}>
                       <p className="text-[10px] font-black uppercase tracking-widest text-white">{t}</p>
                       {activeTheme === t && <div className="absolute top-2 right-2"><CheckCircle size={16} className="text-sher-accent" /></div>}
                    </button>
                 ))}
              </div>
           </div>
        )}

        {handshake.state === 'SUCCESS' && (
           <div className="absolute inset-0 z-[100] bg-emerald-500 flex items-center justify-center animate-in zoom-in duration-500">
              <div className="text-center text-white space-y-6">
                 <ShieldCheck size={80} className="mx-auto" />
                 <h2 className="text-4xl font-black uppercase tracking-tighter">Sovereign Update Commit</h2>
                 <p className="text-[10px] font-black uppercase tracking-[0.5em]">Identity Registry Synchronized</p>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
