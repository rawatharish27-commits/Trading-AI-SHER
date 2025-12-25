
import React, { useEffect, useState, useRef } from 'react';
import { AISignal } from '../../types';
import { Zap, X, Crosshair, TrendingUp, TrendingDown, BrainCircuit, Volume2, ShieldAlert } from 'lucide-react';

interface SignalToastProps {
  signal: AISignal;
  onClose: (id: string) => void;
  onAction: (signal: AISignal) => void;
}

const SignalToast: React.FC<SignalToastProps> = ({ signal, onClose, onAction }) => {
  const [progress, setProgress] = useState(100);
  const TTL = 10000; // 10 seconds visibility
  
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / TTL) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onClose(signal.id);
      }
    }, 50);

    // 🔊 SECURE AUDIO HANDLER
    const settings = JSON.parse(localStorage.getItem('sher_settings') || '{}');
    const soundEnabled = settings.soundEnabled ?? true;

    if (soundEnabled && signal.probability > 0.90) {
      const audioUrl = signal.probability > 0.95 
        ? 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' 
        : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
      
      const audio = new Audio(audioUrl);
      audio.volume = 0.15;
      
      // Fix: Handling browser audio play promise to prevent unhandled rejection errors.
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.debug("[SignalToast] Audio interaction prevented by system policy until user interaction.");
        });
      }
    }

    return () => clearInterval(interval);
  }, [signal.id, onClose, signal.probability]);

  const isBuy = signal.action === 'BUY';
  const isExtreme = signal.probability > 0.93;

  return (
    <div className={`w-85 bg-panel border-2 rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden animate-in slide-in-from-right-10 duration-500 relative group ${
      isExtreme ? 'border-sher-accent shadow-sher-accent/20' : 'border-border shadow-black'
    }`}>
      {isExtreme && (
        <div className="absolute inset-0 bg-sher-accent/5 animate-pulse pointer-events-none" />
      )}
      
      <div className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl flex items-center justify-center ${
              isBuy ? 'bg-sher-success/20 text-sher-success' : 'bg-sher-danger/20 text-sher-danger'
            } border ${isBuy ? 'border-sher-success/20' : 'border-sher-danger/20'}`}>
              <Zap size={18} fill="currentColor" className={isExtreme ? 'animate-bounce' : ''} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[9px] font-black text-sher-muted uppercase tracking-[0.2em]">Neural Discovery</p>
                {isExtreme && <span className="text-[8px] bg-sher-accent text-white px-1.5 py-0.5 rounded-full font-black uppercase">Alpha+</span>}
              </div>
              <h4 className="text-lg font-black text-white tracking-tight uppercase">{signal.symbol}</h4>
            </div>
          </div>
          <button onClick={() => onClose(signal.id)} className="p-1 text-sher-muted hover:text-white transition-colors bg-white/5 rounded-full">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-black/20 p-3 rounded-xl border border-white/5">
            <span className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${isBuy ? 'text-sher-success' : 'text-sher-danger'}`}>
              {isBuy ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {signal.action}
            </span>
            <p className="text-[9px] text-sher-muted font-bold uppercase mt-1 truncate">{signal.strategy}</p>
          </div>
          <div className="bg-black/20 p-3 rounded-xl border border-white/5 text-right">
             <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Confidence</p>
             <p className={`text-lg font-black tabular-nums tracking-tighter ${isExtreme ? 'text-sher-accent' : 'text-white'}`}>
                {(signal.probability * 100).toFixed(1)}%
             </p>
          </div>
        </div>

        <div className="flex gap-2">
            <button 
                onClick={() => onAction(signal)}
                className="flex-1 py-3 bg-white text-black hover:bg-sher-accent hover:text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
            >
                <Crosshair size={14} /> Audit Alpha
            </button>
            {isExtreme && (
                <div className="p-3 bg-sher-accent/10 rounded-xl border border-sher-accent/20 flex items-center justify-center text-sher-accent">
                    <BrainCircuit size={16} className="animate-spin-slow" />
                </div>
            )}
        </div>
      </div>

      <div className="h-1.5 bg-slate-950 w-full overflow-hidden">
        <div 
          className={`h-full transition-all linear shadow-[0_0_10px_rgba(255,255,255,0.2)] ${
            isExtreme ? 'bg-sher-accent' : (isBuy ? 'bg-sher-success' : 'bg-sher-danger')
          }`} 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <style>{`
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignalToast;
