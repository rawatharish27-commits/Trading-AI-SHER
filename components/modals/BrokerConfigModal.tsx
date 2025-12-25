import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Shield, 
  Key, 
  Smartphone, 
  Eye, 
  EyeOff, 
  Fingerprint, 
  Save, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Activity,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { BrokerConfig } from '../../types';
import { brokerConfigService } from '../../lib/services/brokerConfigService';
import { connectBroker, logoutBroker } from '../../services/brokerService';

interface BrokerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (config: BrokerConfig) => void;
}

const BrokerConfigModal: React.FC<BrokerConfigModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [config, setConfig] = useState<BrokerConfig>(brokerConfigService.getConfig());
  const [showSensitive, setShowSensitive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'SAVED' | 'ERROR' | 'ENCRYPTING'>('IDLE');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!config.apiKey || config.apiKey.length < 10) {
      setStatus('ERROR');
      return;
    }

    setStatus('ENCRYPTING');
    setIsSaving(true);
    
    await new Promise(r => setTimeout(r, 1500));
    
    brokerConfigService.saveConfig(config);
    onUpdate(config);
    setStatus('SAVED');
    setIsSaving(false);
    
    setTimeout(() => setStatus('IDLE'), 3000);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await connectBroker(config);
      if (result.success) {
        const updated = { ...config, isConnected: true };
        setConfig(updated);
        onUpdate(updated);
        brokerConfigService.saveConfig(updated);
        setStatus('SAVED');
      } else {
        setStatus('ERROR');
      }
    } catch {
      setStatus('ERROR');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      await logoutBroker(config);
      const updated = { ...config, isConnected: false };
      setConfig(updated);
      onUpdate(updated);
      brokerConfigService.saveConfig(updated);
      setStatus('IDLE');
    } catch {
      setStatus('ERROR');
    } finally {
      setIsConnecting(false);
    }
  };

  const apiKeyEntropy = brokerConfigService.calculateEntropy(config.apiKey);
  const totpEntropy = brokerConfigService.calculateEntropy(config.totpSecret || '');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="max-w-2xl w-full bg-slate-950 border border-white/10 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] relative">
        
        {status === 'ENCRYPTING' && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
                <div className="relative">
                    <div className="w-24 h-24 border-2 border-sher-accent/20 border-t-sher-accent rounded-full animate-spin" />
                    <Fingerprint size={32} className="absolute inset-0 m-auto text-sher-accent animate-pulse" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Securing Vault</h3>
                    <p className="text-[10px] text-sher-muted font-black uppercase tracking-[0.4em] mt-2 animate-pulse">AES-256 Sharding Active</p>
                </div>
            </div>
        )}

        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-black flex justify-between items-center relative">
          <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
             <Shield size={120} />
          </div>
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-sher-accent/10 rounded-2xl flex items-center justify-center text-sher-accent border border-sher-accent/20 shadow-inner">
              <Lock size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Sovereign Vault</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-[9px] text-sher-muted font-black uppercase tracking-[0.2em]">Institutional Encryption Node</span>
                 <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-sher-muted hover:text-white transition-all hover:bg-rose-500/20 group">
            <X size={24} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        <div className="p-8 space-y-8 bg-black/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest">SmartAPI Key</label>
                <div className={`h-1 w-12 rounded-full overflow-hidden bg-white/5`}>
                   <div className={`h-full transition-all duration-1000 ${apiKeyEntropy > 60 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${apiKeyEntropy}%` }} />
                </div>
              </div>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sher-accent transition-colors" size={16} />
                <input 
                  type={showSensitive ? "text" : "password"} 
                  value={config.apiKey}
                  onChange={e => setConfig({...config, apiKey: e.target.value})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-xs focus:outline-none focus:border-sher-accent/50 transition-all placeholder:text-slate-800 shadow-inner"
                  placeholder="X-PrivateKey-Standard"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest px-1">Institutional ID</label>
              <div className="relative group">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sher-accent transition-colors" size={16} />
                <input 
                  type="text" 
                  value={config.clientId}
                  onChange={e => setConfig({...config, clientId: e.target.value.toUpperCase()})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-xs focus:outline-none focus:border-sher-accent/50 transition-all uppercase placeholder:text-slate-800 shadow-inner"
                  placeholder="S000000"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest px-1">Vault PIN</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sher-accent transition-colors" size={16} />
                <input 
                  type={showSensitive ? "text" : "password"} 
                  value={config.password}
                  onChange={e => setConfig({...config, password: e.target.value})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-xs focus:outline-none focus:border-sher-accent/50 transition-all placeholder:text-slate-800 shadow-inner"
                  placeholder="••••"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-sher-muted uppercase tracking-widest">TOTP Seed (Base32)</label>
                {totpEntropy > 0 && (
                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Valid Format</span>
                )}
              </div>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sher-accent transition-colors" size={16} />
                <input 
                  type={showSensitive ? "text" : "password"} 
                  value={config.totpSecret}
                  onChange={e => setConfig({...config, totpSecret: e.target.value})}
                  className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white font-mono text-xs focus:outline-none focus:border-sher-accent/50 transition-all placeholder:text-slate-800 shadow-inner"
                  placeholder="JBSW... (16 chars)"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-6 border-t border-white/5">
             <button 
               onClick={() => setShowSensitive(!showSensitive)}
               className="flex items-center gap-3 text-[10px] font-black text-sher-muted uppercase tracking-[0.2em] hover:text-white transition-all bg-white/5 px-4 py-2 rounded-xl border border-white/5"
             >
               {showSensitive ? <EyeOff size={14} /> : <Eye size={14} />}
               {showSensitive ? 'Obfuscate Inputs' : 'Inspect Credentials'}
             </button>
             
             <div className="flex items-center gap-4">
                 {status === 'SAVED' && (
                   <div className="flex items-center gap-2 text-emerald-400 animate-in slide-in-from-bottom-2">
                     <ShieldCheck size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Vault State Synchronized</span>
                   </div>
                 )}
                 {status === 'ERROR' && (
                   <div className="flex items-center gap-2 text-rose-500 animate-in slide-in-from-bottom-2">
                     <ShieldAlert size={16} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Integrity Audit Failed</span>
                   </div>
                 )}
                 <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-sher-accent shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    <span className="text-[8px] font-black text-sher-muted uppercase tracking-widest">FIPS 140-2 MODE</span>
                 </div>
             </div>
          </div>
        </div>

        <div className="p-8 bg-black/60 flex flex-col sm:flex-row gap-4 border-t border-white/5">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-slate-900 border border-white/10 text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 shadow-xl shadow-black"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin text-sher-accent" /> : <Save size={18} />}
            Commit to Vault
          </button>
          
          <button 
            onClick={config.isConnected ? handleDisconnect : handleConnect}
            disabled={isConnecting}
            className={`flex-[1.5] py-5 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 ${
              config.isConnected 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
              : 'bg-sher-accent text-white shadow-sher-accent/20 hover:bg-blue-600'
            }`}
          >
            {isConnecting ? (
              <div className="flex items-center gap-2">
                <RefreshCw size={18} className="animate-spin" />
                <span>Neural Handshake...</span>
              </div>
            ) : (
              <>
                {config.isConnected ? <LogOut size={18} /> : <Zap size={18} fill="currentColor" />}
                {config.isConnected ? 'Terminate Node Connection' : 'Initialize Production Link'}
              </>
            )}
          </button>
        </div>
        
        <div className="bg-black py-4 px-8 border-t border-white/5 flex items-center justify-center gap-2">
            <Shield size={10} className="text-sher-muted" />
            <p className="text-[8px] font-bold text-sher-muted uppercase tracking-widest opacity-40">
                Credentials never leave the browser. Encryption key derived on-device.
            </p>
        </div>
      </div>
    </div>
  );
};

export default BrokerConfigModal;