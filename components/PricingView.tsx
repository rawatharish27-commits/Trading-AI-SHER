
import React, { useState } from 'react';
import { 
  Check, Zap, Award, Crown, ArrowRight, ShieldCheck, Loader2, 
  CreditCard, ShieldAlert, CheckCircle2, Lock, Globe, Server, X, 
  BrainCircuit, Fingerprint, Shield, Smartphone, Landmark, Wallet,
  ChevronRight
} from 'lucide-react';
import { Plan, BillingCycle } from '../types';
import { PaymentService } from '../lib/services/paymentService';
import { WebhookService } from '../lib/services/webhookService';

interface PricingViewProps {
  onSelectPlan: (plan: Plan, cycle: BillingCycle) => void;
  currentPlan: Plan;
}

const PricingView: React.FC<PricingViewProps> = ({ onSelectPlan, currentPlan }) => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);
  const [paymentStep, setPaymentStep] = useState<'IDLE' | 'GATEWAY' | 'PROCESSING' | 'SUCCESS'>('IDLE');
  const [selectedTier, setSelectedTier] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plans = [
    {
      id: Plan.FREE,
      name: 'Alpha Basic',
      price: 999, 
      icon: Zap,
      color: 'text-sher-muted',
      description: 'Signals only. Perfect for beginners.',
      features: ['Signals Only (Non-Exec)', '1 Strategy Cluster', 'Paper Trading Node', 'Community Access'],
    },
    {
      id: Plan.PRO,
      name: 'Prop Trader',
      price: 2999, 
      icon: Award,
      color: 'text-sher-accent',
      popular: true,
      description: 'The standard for serious retail alpha.',
      features: ['Multi-Strategy Signals', 'Confidence Bands', 'Trade Explanations', 'Paper + Limited Exec', 'P95 Latency Node'],
    },
    {
      id: Plan.ELITE,
      name: 'Elite Node',
      price: 9999,
      icon: Crown,
      color: 'text-purple-500',
      description: 'Institutional-grade automated execution.',
      features: ['Automated Execution', 'Portfolio Risk Control', 'Drawdown Protection', 'Priority Compute Node', 'Shadow Shard Lab'],
    }
  ];

  const handleInitiateUpgrade = (tierId: Plan) => {
    if (tierId === currentPlan) return;
    setSelectedTier(tierId);
    setPaymentStep('GATEWAY');
  };

  const handleSecureHandshake = async (method: string) => {
    setIsSubmitting(true);
    setPaymentStep('PROCESSING');

    const result = await PaymentService.simulateHandshake();
    
    if (result && selectedTier) {
      const userId = JSON.parse(localStorage.getItem('sher_user_profile') || '{}').id;
      await WebhookService.handlePaymentCaptured({
        userId,
        plan: selectedTier,
        amount: plans.find(p => p.id === selectedTier)?.price || 0,
        transactionId: `TXN-${Date.now()}`
      });

      setPaymentStep('SUCCESS');
      setTimeout(() => {
        onSelectPlan(selectedTier, billingCycle);
        window.location.reload();
      }, 2000);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 animate-in fade-in duration-700 relative">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sher-accent/10 border border-sher-accent/20 text-[10px] font-black text-sher-accent uppercase tracking-widest animate-pulse">
           Risk-Aware Decision Platform
        </div>
        <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Scale Your Alpha</h2>
        <p className="text-sher-muted max-w-2xl mx-auto font-medium">No profit sharing. No guaranteed returns. Just pure technical sharding.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-20">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-panel border-2 rounded-[32px] p-8 flex flex-col transition-all duration-500 group animate-fade-up ${plan.id === Plan.PRO ? 'border-sher-accent bg-gradient-to-b from-panel to-sher-accent/5 scale-105 shadow-2xl z-10' : 'border-border'}`}>
            <div className="mb-8">
              <div className={`w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center ${plan.color} mb-6 border border-border group-hover:scale-110 transition-transform`}><plan.icon size={32} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mt-6">
                <span className="text-4xl font-black text-white tabular-nums tracking-tighter">₹{plan.price.toLocaleString()}</span>
                <span className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">/ month</span>
              </div>
            </div>
            <div className="flex-1 space-y-4 mb-10 border-t border-border/50 pt-8">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check size={12} className="text-emerald-500 mt-1 shrink-0" />
                  <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-tight leading-relaxed">{feature}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => handleInitiateUpgrade(plan.id)}
              disabled={plan.id === currentPlan}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 ${plan.id === currentPlan ? 'bg-slate-900 text-sher-muted border border-border cursor-default' : 'bg-white text-black hover:bg-sher-accent hover:text-white shadow-xl'}`}
            >
              {plan.id === currentPlan ? 'Active Infrastructure' : 'Authorize Provisioning'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-10 flex flex-col md:flex-row items-center gap-10">
         <div className="p-5 bg-purple-500/10 rounded-3xl text-purple-400 border border-purple-500/20">
            <Landmark size={32} />
         </div>
         <div className="flex-1 space-y-2">
            <h4 className="text-xl font-black text-white uppercase tracking-tight italic">Institutional White-Label</h4>
            <p className="text-sm text-sher-muted font-medium leading-relaxed uppercase tracking-wider opacity-70">
              For Prop-Desks and Fund Managers. Custom risk rules, dedicated compute clusters, and white-label branding.
            </p>
         </div>
         <button className="px-10 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sher-accent hover:text-white transition-all active:scale-95 shadow-2xl">
            Contact Partnership Desk
         </button>
      </div>

      {paymentStep !== 'IDLE' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in">
          <div className="max-w-md w-full bg-slate-950 border border-white/10 rounded-[40px] p-10 overflow-hidden shadow-2xl relative">
            <button onClick={() => setPaymentStep('IDLE')} className="absolute top-6 right-6 p-2 text-sher-muted hover:text-white transition-all"><X size={20}/></button>
            
            {paymentStep === 'GATEWAY' && (
              <div className="space-y-8 animate-in zoom-in-95">
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter">Identity Upgrade</h3>
                   <p className="text-[10px] text-sher-muted font-black uppercase tracking-widest mt-1">Deploying settlement node for {selectedTier}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                   {['UPI', 'CARD', 'NETBANKING'].map(method => (
                    <button 
                      key={method}
                      onClick={() => handleSecureHandshake(method)}
                      className="p-5 rounded-2xl border border-white/5 bg-slate-900/50 hover:border-white/10 transition-all flex items-center gap-4 text-left group"
                    >
                       <div className="p-2 rounded-lg bg-sher-accent text-white group-hover:bg-blue-600 transition-colors"><CreditCard size={18}/></div>
                       <span className="text-[11px] font-black text-white uppercase tracking-widest">{method} SETTLEMENT</span>
                       <ChevronRight size={14} className="ml-auto text-sher-muted" />
                    </button>
                   ))}
                </div>
              </div>
            )}

            {paymentStep === 'PROCESSING' && (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95">
                <div className="w-20 h-20 border-4 border-sher-accent/20 rounded-full border-t-sher-accent animate-spin" />
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Encrypting Shard Path</h3>
                <p className="text-[10px] text-sher-muted font-black uppercase animate-pulse tracking-widest">Waiting for settlement confirmation...</p>
              </div>
            )}

            {paymentStep === 'SUCCESS' && (
              <div className="p-10 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-500/30 shadow-2xl animate-bounce"><CheckCircle2 size={48} /></div>
                <div>
                   <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Identity Provisioned</h3>
                   <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mt-2">Neural Link established successfully.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingView;
