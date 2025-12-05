
import React, { useState } from 'react';
import { Shield, Key, Sliders, LogOut, Save, Smartphone, CheckCircle, Copy } from 'lucide-react';
import { RiskConfig } from '../types';

interface SettingsViewProps {
    onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'broker' | 'risk' | 'security'>('security');
  
  const [riskConfig, setRiskConfig] = useState<RiskConfig>({
      maxCapitalPerTrade: 25000,
      maxDailyLoss: 5000,
      maxOpenPositions: 3,
      stopLossDefault: 2.0
  });

  // 2FA State
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  const handleSave = () => {
      alert("Configuration saved successfully.");
  };

  const setup2FA = async () => {
      try {
          const res = await fetch('/api/2fa/setup', { method: 'POST' });
          const data = await res.json();
          if (data.qrDataUrl) {
              setQrCode(data.qrDataUrl);
              setSecretKey(data.manualKey);
          }
      } catch (e) {
          console.error("Failed to setup 2FA");
      }
  };

  const verify2FA = async () => {
      try {
          const res = await fetch('/api/2fa/verify', {
              method: 'POST',
              body: JSON.stringify({ code: verifyCode })
          });
          const data = await res.json();
          if (data.success) {
              setIs2FAEnabled(true);
              setQrCode(null);
              alert("Two-Factor Authentication Enabled Successfully!");
          } else {
              alert("Invalid Code");
          }
      } catch (e) {
          alert("Verification failed");
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">System Configuration</h2>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-slate-900/50 p-1 rounded-lg border border-gray-800 w-fit">
        <button onClick={() => setActiveTab('security')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'bg-sher-accent text-white shadow' : 'text-sher-muted hover:text-white'}`}>
            <Shield size={16} /> Security
        </button>
        <button onClick={() => setActiveTab('risk')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'risk' ? 'bg-sher-accent text-white shadow' : 'text-sher-muted hover:text-white'}`}>
            <Sliders size={16} /> Risk Mgmt
        </button>
        <button onClick={() => setActiveTab('broker')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'broker' ? 'bg-sher-accent text-white shadow' : 'text-sher-muted hover:text-white'}`}>
            <Key size={16} /> Broker API
        </button>
        <button onClick={() => setActiveTab('general')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'general' ? 'bg-sher-accent text-white shadow' : 'text-sher-muted hover:text-white'}`}>
            <LogOut size={16} /> Account
        </button>
      </div>

      <div className="bg-sher-card border border-gray-800 rounded-xl p-8">
        
        {/* Security Tab (2FA) */}
        {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="border-l-4 border-sher-accent pl-4 mb-6">
                    <h3 className="text-lg font-bold text-white">Two-Factor Authentication</h3>
                    <p className="text-sm text-sher-muted">Protect your trading account with TOTP (Google Authenticator).</p>
                </div>

                {is2FAEnabled ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-500">
                            <CheckCircle size={32} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-white">2FA is Active</h4>
                            <p className="text-sm text-sher-muted">Your account is secured. You will be asked for a code upon login.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {!qrCode ? (
                             <div className="flex items-center justify-between bg-slate-900/50 p-6 rounded-xl border border-gray-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-800 rounded-lg text-white">
                                        <Smartphone size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">Enable Authenticator App</h4>
                                        <p className="text-sm text-sher-muted">Use Google Authenticator or Authy</p>
                                    </div>
                                </div>
                                <button onClick={setup2FA} className="bg-sher-accent hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    Setup 2FA
                                </button>
                             </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-gray-800 rounded-xl p-6">
                                <h4 className="font-bold text-white mb-4">Scan QR Code</h4>
                                <div className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="bg-white p-2 rounded-lg">
                                        {/* Display simulated QR */}
                                        <img src={qrCode} alt="2FA QR Code" className="w-40 h-40 object-contain" />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-2">
                                            <p className="text-sm text-sher-muted">Can't scan? Enter this code manually:</p>
                                            <div className="flex items-center gap-2 bg-slate-950 p-3 rounded font-mono text-sher-accent text-sm">
                                                <span>{secretKey}</span>
                                                <button className="ml-auto text-gray-500 hover:text-white"><Copy size={14}/></button>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-white font-medium">Verify Code</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="123456" 
                                                    value={verifyCode}
                                                    onChange={e => setVerifyCode(e.target.value)}
                                                    className="bg-slate-950 border border-gray-700 text-white rounded px-4 py-2 w-32 text-center tracking-widest"
                                                />
                                                <button onClick={verify2FA} className="bg-sher-success hover:bg-emerald-600 text-white px-4 py-2 rounded font-medium">
                                                    Activate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <div className="border-l-4 border-rose-500 pl-4 mb-6">
                    <h3 className="text-lg font-bold text-white">Risk Parameters</h3>
                    <p className="text-sm text-sher-muted">AI Guardrails for automated execution.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-semibold text-sher-muted uppercase mb-2">Max Capital per Trade (₹)</label>
                        <input 
                            type="number" 
                            value={riskConfig.maxCapitalPerTrade}
                            onChange={e => setRiskConfig({...riskConfig, maxCapitalPerTrade: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-sher-accent" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-sher-muted uppercase mb-2">Daily Loss Limit (₹)</label>
                        <input 
                            type="number" 
                            value={riskConfig.maxDailyLoss}
                            onChange={e => setRiskConfig({...riskConfig, maxDailyLoss: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-rose-900/50 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-rose-500" 
                        />
                    </div>
                </div>
            </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                <h3 className="text-lg font-bold text-white mb-4">Session Management</h3>
                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-700 hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-900/50 transition-colors text-sm font-medium"
                >
                    <LogOut size={18} /> Sign Out Session
                </button>
            </div>
        )}

        {/* Action Bar */}
        {activeTab !== 'security' && (
            <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                <button 
                    onClick={handleSave}
                    className="bg-white text-sher-dark font-bold px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                    <Save size={18} /> Save Changes
                </button>
            </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;
