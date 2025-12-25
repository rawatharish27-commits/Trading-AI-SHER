
import React, { useState, useEffect } from 'react';
import { 
  Zap, ArrowRight, Loader2, AlertCircle, CheckCircle2, Hash, Fingerprint, ChevronLeft, Smartphone
} from 'lucide-react';
import { UserRole, Plan, BillingCycle, UserProfile } from '../types';
import { securityService } from '../lib/services/securityService';

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', mobile: '', city: '', district: '', state: '', pin: '', userId: '', password: '', confirmPassword: '', otp: ''
  });

  const [isUserIdAvailable, setIsUserIdAvailable] = useState<boolean | null>(null);

  const isFormValid = formData.firstName && formData.lastName && formData.email && 
                     formData.mobile && formData.city && formData.district && 
                     formData.state && formData.pin && formData.userId && 
                     formData.password && (formData.password === formData.confirmPassword);

  useEffect(() => {
    if (formData.userId.length < 3) {
      setIsUserIdAvailable(null);
      return;
    }
    const taken = securityService.isUserIdTaken(formData.userId);
    setIsUserIdAvailable(!taken);
  }, [formData.userId]);

  const handleInitializeHandshake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUserIdAvailable) {
       setError("Identity Shard Taken. Selection rejected.");
       return;
    }
    setIsLoading(true);
    await securityService.dispatchHandshake(formData.email, formData.mobile);
    setStep(2);
    setIsLoading(false);
  };

  const handleVerifyAndProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));

    if (formData.otp === '123456') { 
      const newProfile: UserProfile = {
        id: 'u-' + Math.random().toString(36).substring(2, 11),
        tenantId: 'sher-master',
        userId: formData.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobile: formData.mobile,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pin: formData.pin,
        password: formData.password,
        role: UserRole.TRADER,
        plan: Plan.FREE,
        billingCycle: BillingCycle.MONTHLY,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        onboardingCompleted: false,
        securityAudit: {
          lastPasswordChange: new Date().toISOString(),
          mfaVerified: true,
          identityVerified: true
        }
      };

      securityService.registerUser(newProfile);
      setStep(3); 
    } else {
      setError('Neural Handshake Refused: Invalid Shard Key (Try 123456).');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      <div className="w-full max-w-2xl bg-panel border border-border rounded-[48px] p-10 shadow-2xl relative z-10 overflow-hidden">
        
        <button onClick={onBackToLogin} className="absolute top-6 left-6 p-2 text-sher-muted hover:text-white flex items-center gap-1 group">
          <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-widest">Terminal</span>
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Provision <span className="text-sher-accent not-italic">Identity Shard</span></h1>
          <p className="text-sher-muted text-[9px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Identity Provisioning Protocol</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black p-4 rounded-2xl mb-8 flex items-center gap-3 animate-in shake">
            <AlertCircle size={18} />
            <span className="uppercase tracking-tight flex-1">{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleInitializeHandshake} className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">First Name</label>
                    <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">Last Name</label>
                    <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">Email ID</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" placeholder="Institutional Email" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">Mobile Number</label>
                    <input type="tel" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" placeholder="+91" required />
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">City / State</label>
                      <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" placeholder="Mumbai" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">PIN Code</label>
                      <input type="text" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" required maxLength={6} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">Unique User ID</label>
                    <div className="relative">
                       <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 ${isUserIdAvailable === false ? 'text-rose-500' : 'text-slate-700'}`} size={14} />
                       <input type="text" value={formData.userId} onChange={e => setFormData({...formData, userId: e.target.value.toLowerCase()})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 pl-10 px-4 text-xs font-black text-white focus:border-sher-accent outline-none" placeholder="trader_alpha" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">Password</label>
                      <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest ml-1">Re-enter</label>
                      <input type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-border rounded-2xl py-3 px-4 text-xs font-bold text-white focus:border-sher-accent outline-none" required />
                    </div>
                  </div>
               </div>
            </div>

            <button type="submit" disabled={!isFormValid || isLoading} className={`w-full py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3 shadow-2xl ${isFormValid ? 'bg-sher-accent text-white hover:bg-blue-600' : 'bg-slate-900 text-sher-muted border border-border opacity-50 cursor-not-allowed'}`}>
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <>Initialize Node <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyAndProvision} className="space-y-8 animate-in fade-in duration-500 max-w-md mx-auto">
             <div className="text-center space-y-4">
                <div className="p-5 bg-sher-accent/10 rounded-full w-fit mx-auto border border-sher-accent/20">
                   <Smartphone size={32} className="text-sher-accent" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Identity Verification</h3>
                <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest leading-relaxed">
                   Enter 6-digit shard key dispatched to identity mobile (123456)
                </p>
             </div>
             <input type="text" value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} className="w-full bg-slate-950 border-2 border-sher-accent/40 text-white text-center text-4xl font-black tracking-[0.6em] rounded-3xl py-6 outline-none" maxLength={6} required />
             <button type="submit" disabled={isLoading} className="w-full bg-emerald-500 text-white font-black uppercase tracking-[0.3em] py-6 rounded-[28px] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                {isLoading ? <Loader2 size={22} className="animate-spin" /> : 'Map Identity'}
             </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-8 animate-in zoom-in-95 duration-700 py-10">
             <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/30 mx-auto shadow-2xl">
                <CheckCircle2 size={56} />
             </div>
             <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Identity Established</h3>
             <p className="text-sm text-sher-muted uppercase font-bold tracking-widest">Node @{formData.userId} provisioned in neural registry.</p>
             <button onClick={onRegisterSuccess} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xs hover:bg-sher-accent hover:text-white transition-all shadow-2xl">Terminal Login</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterView;
