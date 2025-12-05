
import React, { useState } from 'react';
import { Zap, UserPlus, Mail, Lock, ArrowRight, Loader2, User } from 'lucide-react';

interface RegisterViewProps {
  onRegisterSuccess: () => void;
  onBackToLogin: () => void;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegisterSuccess, onBackToLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Success
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sher-dark flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-sher-accent/10 rounded-full blur-[100px]"></div>

      <div className="w-full max-w-md bg-sher-card border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-sher-muted mb-4 border border-gray-700">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Join SHER<span className="text-sher-accent">.AI</span></h1>
          <p className="text-sher-muted text-sm mt-2">Create your trading intelligence account</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-3 rounded-lg mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-sher-muted uppercase tracking-wider ml-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-sher-accent transition-colors" size={18} />
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
                className="w-full bg-slate-900/50 border border-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sher-accent focus:ring-1 focus:ring-sher-accent transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-sher-muted uppercase tracking-wider ml-1">Email</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-sher-accent transition-colors" size={18} />
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="trader@sher-ai.com"
                className="w-full bg-slate-900/50 border border-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sher-accent focus:ring-1 focus:ring-sher-accent transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-sher-muted uppercase tracking-wider ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-sher-accent transition-colors" size={18} />
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••••••"
                className="w-full bg-slate-900/50 border border-gray-700 text-white rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-sher-accent focus:ring-1 focus:ring-sher-accent transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-sher-accent hover:bg-blue-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>Create Account <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-sher-muted">
            Already have an account?{' '}
            <button onClick={onBackToLogin} className="text-sher-accent hover:text-white font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
