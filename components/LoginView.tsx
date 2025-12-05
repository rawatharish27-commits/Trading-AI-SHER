
import React, { useState, useEffect, useRef } from 'react';
import { Zap, Shield, Lock, Mail, ArrowRight, Loader2, Smartphone, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { signIn } from 'next-auth/react';

interface LoginViewProps {
  onLogin: () => void;
  onGoToRegister: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, onGoToRegister }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus ref for 2FA input
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus 2FA input when state changes
  useEffect(() => {
    if (is2FARequired && codeInputRef.current) {
        codeInputRef.current.focus();
    }
  }, [is2FARequired]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Attempt sign in using NextAuth Credentials
    try {
      const result = await signIn('credentials', {
        email,
        password,
        code: twoFactorCode,
        redirect: false
      });

      if (result?.error) {
        if (result.error === 'TWO_FA_REQUIRED') {
            // Credential check passed, moving to 2FA step
            setIs2FARequired(true);
            setError(null); // Clear any previous errors as this is a progressive step
        } else {
            // Handle actual errors
            if (is2FARequired) {
                setError('Invalid authentication code. Please check your app and try again.');
                setTwoFactorCode(''); // Clear invalid code for better UX
            } else {
                setError('Invalid email or password.');
            }
        }
      } else {
        // Success
        onLogin();
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIs2FARequired(false);
    setTwoFactorCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-sher-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-sher-accent/10 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-sher-card border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sher-accent/10 text-sher-accent mb-4">
            <Zap size={24} fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">SHER<span className="text-sher-accent">.AI</span></h1>
          <p className="text-sher-muted text-sm mt-2">Professional Intelligence Trading System</p>
        </div>

        {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg mb-6 text-center animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
                <Shield size={16} />
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phase 1: Email & Password */}
            {!is2FARequired ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-sher-muted uppercase tracking-wider ml-1">Email Access</label>
                        <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-sher-accent transition-colors" size={18} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="trader@sher-ai.com"
                            className="w-full bg-slate-900/50 border border-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sher-accent focus:ring-1 focus:ring-sher-accent transition-all placeholder:text-slate-600"
                            required
                        />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-sher-muted uppercase tracking-wider ml-1">Secure Key</label>
                        <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-sher-accent transition-colors" size={18} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full bg-slate-900/50 border border-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sher-accent focus:ring-1 focus:ring-sher-accent transition-all placeholder:text-slate-600"
                            required
                        />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2">
                        <label className="flex items-center text-sher-muted cursor-pointer hover:text-white transition-colors">
                            <input type="checkbox" className="mr-2 rounded border-gray-700 bg-slate-800 text-sher-accent focus:ring-0" />
                            Remember device
                        </label>
                        <a href="#" className="text-sher-accent hover:text-blue-400 transition-colors ml-auto">Forgot key?</a>
                    </div>
                </div>
            ) : (
                /* Phase 2: 2FA Input */
                 <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 items-start">
                        <div className="mt-1 p-1 bg-blue-500/20 rounded-full text-blue-400">
                            <CheckCircle2 size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Credentials Verified</h3>
                            <p className="text-blue-200/80 text-xs mt-1 leading-relaxed">
                                Your account is protected. Please enter the 6-digit code from your authenticator app to complete login.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-sher-muted uppercase tracking-wider ml-1">Authenticator Code</label>
                        <div className="relative group">
                            <Smartphone className="absolute left-3 top-3.5 text-sher-accent" size={18} />
                            <input 
                                ref={codeInputRef}
                                type="text" 
                                value={twoFactorCode}
                                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                placeholder="000 000"
                                className="w-full bg-slate-900/50 border border-sher-accent text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-sher-accent/50 tracking-[0.5em] text-center font-mono text-lg placeholder:tracking-normal placeholder:font-sans transition-all"
                                required
                                autoComplete="one-time-code"
                            />
                        </div>
                    </div>
                 </div>
            )}

          <div className="flex flex-col gap-3 mt-8">
            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-sher-accent to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
                ) : (
                <>{is2FARequired ? 'Verify Identity' : 'Authenticate'} <ArrowRight size={18} /></>
                )}
            </button>

            {is2FARequired && (
                <button 
                    type="button" 
                    onClick={handleBackToLogin}
                    disabled={isLoading}
                    className="w-full bg-transparent text-sher-muted hover:text-white py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Credentials
                </button>
            )}
          </div>
        </form>

        {!is2FARequired && (
            <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                <p className="text-sm text-sher-muted mb-4">
                    Don't have an account?{' '}
                    <button onClick={onGoToRegister} className="text-sher-accent hover:text-white font-medium transition-colors">
                        Apply for access
                    </button>
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-sher-muted mb-2">
                    <Shield size={12} className="text-sher-success" />
                    <span>256-bit Encrypted Session</span>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginView;
