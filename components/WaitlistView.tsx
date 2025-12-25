
import React, { useState } from 'react';
import { Zap, ShieldCheck, ArrowRight, BrainCircuit, Globe, Users, Award, Lock, Loader2, Sparkles } from 'lucide-react';

interface WaitlistViewProps {
  onGoToLogin: () => void;
  onGoToRegister: () => void;
}

const WaitlistView: React.FC<WaitlistViewProps> = ({ onGoToLogin, onGoToRegister }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsJoined(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Neural Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sher-accent rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-4xl w-full text-center space-y-12 relative z-10">
        <div className="space-y-4 animate-in fade-in slide-in-from-top-8 duration-700">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sher-accent/10 border border-sher-accent/20 text-[10px] font-black text-sher-accent uppercase tracking-widest mb-4">
              <Sparkles size={12} fill="currentColor" /> Beta Access Open
           </div>
           <h1 className="text-6xl md:text-8xl font-black text-white italic tracking-tighter uppercase leading-[0.9]">
             Trade Like <span className="text-sher-accent not-italic">The 1%.</span>
           </h1>
           <p className="text-lg md:text-xl text-sher-muted max-w-2xl mx-auto font-medium leading-relaxed">
             Sher AI is an institutional-grade neural terminal. We filter market entropy to reveal high-probability accumulation zones. 
           </p>
        </div>

        {!isJoined ? (
          <form onSubmit={handleJoin} className="max-w-md mx-auto space-y-4 animate-in fade-in duration-1000 delay-300">
            <div className="relative group">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Institutional Email"
                className="w-full bg-panel border-2 border-border rounded-[24px] py-6 px-8 text-white text-lg font-bold focus:outline-none focus:border-sher-accent transition-all placeholder:text-slate-800 shadow-2xl"
                required
              />
              <button 
                type="submit"
                disabled={isSubmitting}
                className="absolute right-3 top-3 bottom-3 px-8 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-sher-accent hover:text-white transition-all active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Secure Invite"}
              </button>
            </div>
            <p className="text-[9px] text-sher-muted uppercase font-black tracking-widest">Limited to 1,000 Beta Nodes globally.</p>
          </form>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[40px] max-w-md mx-auto animate-in zoom-in-95 duration-500">
             <ShieldCheck size={48} className="text-emerald-500 mx-auto mb-4" />
             <h3 className="text-2xl font-black text-white uppercase tracking-tight">Identity Queued</h3>
             <p className="text-sm text-emerald-400 mt-2 font-bold uppercase tracking-widest">You are #482 in line for Alpha access.</p>
             <div className="mt-8 flex gap-2">
                <button onClick={onGoToLogin} className="flex-1 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Authorize Node</button>
             </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 border-t border-white/5 opacity-40">
           {[
             { label: 'Neural Accuracy', val: '64.2%', icon: BrainCircuit },
             { label: 'Active Capital', val: '₹1.4Cr', icon: Globe },
             { label: 'Execution Speed', val: '42ms', icon: Zap },
             { label: 'User Rating', val: '4.9/5', icon: Award },
           ].map(stat => (
             <div key={stat.label}>
                <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-lg font-black text-white tracking-tighter uppercase">{stat.val}</p>
             </div>
           ))}
        </div>

        <div className="flex justify-center gap-6 text-[10px] font-black text-sher-muted uppercase tracking-[0.2em]">
           <button onClick={onGoToLogin} className="hover:text-white transition-colors">Login</button>
           <span>/</span>
           <button onClick={onGoToRegister} className="hover:text-white transition-colors">Register</button>
        </div>
      </div>
    </div>
  );
};

export default WaitlistView;
