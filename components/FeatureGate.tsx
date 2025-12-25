import React from 'react';
import { UserRole, Plan } from '../types';
import { hasAccess, getRequiredPlan } from '../lib/accessControl';
import { Feature } from '../lib/permissions';
import { Lock, Zap, Crown, Award, ArrowRight, ShieldAlert } from 'lucide-react';

interface FeatureGateProps {
  feature: Feature;
  role: UserRole;
  plan: Plan;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const FeatureGate: React.FC<FeatureGateProps> = ({ feature, role, plan, children, fallback }) => {
  const allowed = hasAccess(role, plan, feature);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  // CASE A: Access Denied due to Role (Admin module attempted by non-admin)
  if (feature === 'ADMIN_PANEL' && role !== UserRole.ADMIN) {
    return (
      <div className="bg-rose-500/5 border border-rose-500/20 rounded-[40px] p-12 lg:p-24 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 border border-rose-500/20 shadow-2xl">
          <ShieldAlert size={48} />
        </div>
        <div className="max-w-md">
          <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Clearance Denied</h3>
          <p className="text-sm text-sher-muted mt-3 font-medium leading-relaxed uppercase tracking-widest leading-loose">
            The <span className="text-rose-400 font-black">SYSTEM COMMAND</span> node is restricted to Admin clearance. Your attempt has been logged for security audit.
          </p>
        </div>
      </div>
    );
  }

  // CASE B: Access Denied due to Subscription Tier
  const requiredPlan = getRequiredPlan(feature);

  return (
    <div className="bg-slate-900/50 border border-border border-dashed rounded-[40px] p-12 lg:p-24 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-500">
      <div className="relative">
        <div className="w-24 h-24 bg-sher-accent/10 rounded-full flex items-center justify-center text-sher-accent border border-sher-accent/20">
          <Lock size={40} />
        </div>
        <div className="absolute -top-2 -right-2">
          {requiredPlan === Plan.ELITE ? (
            <div className="bg-purple-600 p-2.5 rounded-full text-white shadow-2xl animate-pulse"><Crown size={20} fill="currentColor" /></div>
          ) : (
            <div className="bg-sher-accent p-2.5 rounded-full text-white shadow-2xl"><Award size={20} fill="currentColor" /></div>
          )}
        </div>
      </div>
      
      <div className="max-w-lg">
        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Module Restricted</h3>
        <p className="text-sm text-sher-muted mt-4 font-medium leading-relaxed uppercase tracking-widest leading-loose">
          The <span className="text-sher-accent font-black">{feature.replace('_', ' ')}</span> protocol requires a <span className="text-white font-black">{requiredPlan}</span> subscription for authorization.
        </p>
      </div>

      <button 
        onClick={() => {
          const navEvent = new CustomEvent('sher-nav', { detail: 'PRICING' });
          window.dispatchEvent(navEvent);
        }}
        className="px-12 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-sher-accent hover:text-white transition-all shadow-2xl active:scale-95 flex items-center gap-3"
      >
        Upgrade Access <ArrowRight size={18} />
      </button>
    </div>
  );
};

export default FeatureGate;
