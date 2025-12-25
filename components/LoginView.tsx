import React, { useState } from 'react';
import { 
  Zap, Lock, Hash, Loader2, AlertCircle, ShieldCheck, 
  ChevronLeft, CheckCircle2, RefreshCw, Key
} from 'lucide-react';
import { UserProfile } from '../types';
import { securityService } from '../lib/services/securityService';
import { sessionManager } from '../lib/services/sessionManager';

interface LoginViewProps {
  onLogin: (profile: UserProfile) => void;
  onGoToRegister: () => void;
}

type LoginProtocol = 'IDENT_ENTRY' | 'ADMIN_OTP' | 'SUCCESS';

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGoToRegister }) => {
  const [protocol, setProtocol] = useState<LoginProtocol>('IDENT_ENTRY');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [credentials, setCredentials] = useState({ userId: '', password: '', otp: '' });
  const [adminRef, setAdminRef] = useState<string | null>(null);

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const isNodeId = credentials.userId.trim().toUpperCase().startsWith('MASTER_NODE_');
    
    if (isNodeId) {
      // 🛡️ ADMIN PROTOCOL
      const result = await securityService.initiateAdminLogin(credentials.userId, credentials.password);
      if (result) {
        setAdminRef(result.adminId);
        setProtocol('ADMIN_OTP');
      } else {
        setError('Audit Failed: Command Key Invalid.');
      }
    } else {
      // 👤 USER PROTOCOL
      const result = await securityService.login(credentials.userId, credentials.password);
      if (result) {
        sessionManager.storeTokens(result.accessToken, result.refreshToken);
        onLogin(result.profile);
      } else {
        setError('Audit Failed: Identity Shard not found.');
      }
    }
    setIsLoading(false);
  };

  const handleVerifyAdminOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminRef) return;
    
    setIsLoading(true);
    const result = await securityService.verifyAdminOTP(adminRef, credentials.otp);
    
    if (result) {
      sessionManager.storeTokens(result.accessToken, result.refreshToken);
      onLogin(result.profile);
    } else {
      setError("Handshake Refused: Shard Key Mismatch or Expired.");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sher-accent/5 via-bg to-bg opacity-40" />

      <div className="w-full max-w-md bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative z-10 overflow-hidden">
        
        {protocol !== 'IDENT_ENTRY' && (
          <button onClick={() => setProtocol('IDENT_ENTRY')} className="absolute top-6 left-6 p-2 text-sher-muted hover:text-white flex items-center gap-1 group">
            <ChevronLeft size={16} /> <span className="text-[8px] font-black uppercase tracking-widest">Abort</span>
          </button>
        )}

        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-sher-accent mb-6 border border-border shadow-2xl">
            <Zap size={32} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">SHER<span className="text-sher-accent not-italic">.AI</span></h1>
          <p className="text-sher-muted text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Sovereign Access Portal</p>
        </div>

        {error && (
            <div className="text-[10px] font-black p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in shake bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle size={18} />
                <span className="uppercase tracking-tight flex-1">{error}</span>
            </div>
        )}

        {protocol === 'IDENT_ENTRY' && (
          <form onSubmit={handleAudit} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-sher-muted uppercase tracking-[0.3em] ml-1">Identity ID</label>
                  <div className="relative">
                    <Hash className={`absolute left-4 top-1/2 -translate-y-1/2 ${credentials.userId.startsWith('MASTER_NODE_') ? 'text-purple-400' : 'text-slate-700'}`} size={14} />
                    <input type="text" value={credentials.userId} onChange={(e) => setCredentials({...credentials, userId: e.target.value})} className={`w-full bg-slate-950 border ${credentials.userId.toUpperCase().startsWith('MASTER_NODE_') ? 'border-purple-500/30' : 'border-border'} text-white rounded-2xl py-4 pl-12 pr-4 text-xs font-black focus:border-sher-accent outline-none transition-all`} placeholder="trader_id / MASTER_NODE_ID" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-sher-muted uppercase tracking-[0.3em] ml-1">Access Key</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={14} />
                    <input type="password" value={credentials.password} onChange={(e) => setCredentials({...credentials, password: e.target.value})} className="w-full bg-slate-950 border border-border text-white rounded-2xl py-4 pl-12 pr-4 text-xs font-bold focus:border-sher-accent outline-none transition-all" placeholder="••••••••" required />
                  </div>
                </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-slate-900 border border-white/10 text-white font-black uppercase tracking-[0.2em] py-5 rounded-3xl hover:bg-slate-800 flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl">
                {isLoading ? <Loader2 size={20} className="animate-spin text-sher-accent" /> : 'Initiate Audit'}
            </button>
          </form>
        )}

        {protocol === 'ADMIN_OTP' && (
           <div className="space-y-8 animate-in zoom-in-95 text-center">
              <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-500 border border-purple-500/30 mx-auto shadow-2xl">
                 <ShieldCheck size={40} />
              </div>
              <div>
                 <h3 className="text-xl font-black text-white uppercase tracking-tight italic">System <span className="text-sher-accent not-italic">Challenge</span></h3>
                 <p className="text-[10px] text-sher-muted font-bold uppercase mt-2 tracking-widest">Verify Shard Key from Mobile.</p>
              </div>
              <form onSubmit={handleVerifyAdminOTP} className="space-y-6">
                 <input type="text" value={credentials.otp} onChange={e => setCredentials({...credentials, otp: e.target.value})} placeholder="000000" className="w-full bg-slate-950 border-2 border-sher-accent/50 text-white text-center text-4xl font-black tracking-[0.5em] rounded-3xl py-6 outline-none shadow-2xl" maxLength={6} required />
                 <button type="submit" disabled={isLoading} className="w-full bg-sher-accent text-white font-black uppercase tracking-[0.2em] py-6 rounded-3xl shadow-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3">
                    {isLoading ? <RefreshCw size={20} className="animate-spin" /> : 'Authorize Root'}
                 </button>
              </form>
              <button className="text-[8px] font-black text-sher-muted hover:text-white uppercase tracking-[0.3em]">Resend Shard Key</button>
           </div>
        )}

        <div className="mt-12 text-center border-t border-white/5 pt-6">
            <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest">
              New node?{' '}
              <button onClick={onGoToRegister} className="text-white hover:text-sher-accent transition-colors underline decoration-sher-accent/30 underline-offset-4 font-black">
                Register Shard
              </button>
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
