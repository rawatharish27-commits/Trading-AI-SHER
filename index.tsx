import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { TenantBrandingProvider } from './components/TenantBrandingProvider';
import { initializeNode } from './lib/services/nodeBoot';
import { Zap, Loader2, ShieldAlert } from 'lucide-react';

/**
 * 🦁 SOVEREIGN ENTRY POINT
 */
const Root: React.FC = () => {
  const [bootState, setBootState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    initializeNode().then(res => {
      if (res.success) setBootState('READY');
      else {
        setBootState('ERROR');
        setErrorMsg(res.error || 'Unknown Sharding Failure');
      }
    });
  }, []);

  if (bootState === 'LOADING') {
    return (
      <div className="h-screen w-screen bg-[#0b0f14] flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-sher-accent/20 border-t-sher-accent rounded-full animate-spin" />
          <Zap size={32} className="absolute inset-0 m-auto text-sher-accent animate-pulse" fill="currentColor" />
        </div>
        <div className="text-center">
           <p className="text-[10px] font-black text-white uppercase tracking-[0.6em] animate-pulse">Initializing Sovereign Node</p>
           <p className="text-[8px] text-sher-muted font-bold uppercase mt-2 tracking-widest">Sharding Logic & Security Vaults...</p>
        </div>
      </div>
    );
  }

  if (bootState === 'ERROR') {
    return (
      <div className="h-screen w-screen bg-[#0e1117] flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-6">
           <div className="w-20 h-20 bg-rose-500/10 rounded-3xl border border-rose-500/20 flex items-center justify-center text-rose-500 mx-auto">
              <ShieldAlert size={40} />
           </div>
           <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">Node Integrity Error</h1>
           <p className="text-sm text-sher-muted uppercase font-bold leading-relaxed">
             CRITICAL FAILURE: {errorMsg.replace(/_/g, ' ')}. Check system secrets or connection shards.
           </p>
           <button onClick={() => window.location.reload()} className="px-10 py-5 bg-white text-black font-black uppercase text-xs rounded-2xl hover:bg-sher-accent hover:text-white transition-all shadow-2xl active:scale-95">Restart Handshake</button>
        </div>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <TenantBrandingProvider>
        <App />
      </TenantBrandingProvider>
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<Root />);
}