
import React from 'react';
import { ViewState, UserRole, Plan } from '../types';
import { 
  LayoutDashboard, Briefcase, Activity, Settings, Zap, List, History, 
  ChevronRight, LogOut, ShieldCheck, FileText, Award, Gavel, Server, 
  Award as CertIcon, Library, RefreshCw, Lock, AlertTriangle, Key, Shield, Globe,
  Headphones, Rocket, Heart, Microscope, LineChart, ClipboardCheck, Presentation,
  CreditCard, ScrollText, FileSearch
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  totalEquity?: number;
  userRole: UserRole;
  userPlan: Plan;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, totalEquity = 245300, userRole, userPlan }) => {
  const isAdmin = userRole === UserRole.ADMIN;
  const isInstitutional = userPlan === Plan.INSTITUTIONAL || isAdmin;

  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Command Center', icon: LayoutDashboard },
    { id: ViewState.SIGNALS, label: 'Neural Signals', icon: Activity },
    { id: ViewState.PORTFOLIO, label: 'Quant Portfolio', icon: Briefcase },
    { id: ViewState.LINEAGE_FORENSICS, label: 'Trade Forensics', icon: FileSearch },
    ...(isInstitutional ? [
      { id: ViewState.OPERATING_DOCUMENT, label: 'Master Operating Doc', icon: ScrollText },
      { id: ViewState.SANDBOX_HUB, label: 'Pilot Sandbox', icon: Microscope },
      { id: ViewState.AI_HEALTH_DASHBOARD, label: 'Intelligence Health', icon: LineChart },
      { id: ViewState.INSTITUTIONAL_READINESS, label: 'Readiness Audit', icon: ClipboardCheck },
      { id: ViewState.PITCH, label: 'Investor Pitch', icon: Presentation },
    ] : []),
    { id: ViewState.PRICING, label: 'SaaS Shards', icon: CreditCard },
    { id: ViewState.TRUST_CENTER, label: 'Trust Shard', icon: ShieldCheck },
    { id: ViewState.SUPPORT_DESK, label: 'Support Desk', icon: Headphones },
    ...(isAdmin ? [
      { id: ViewState.LAUNCH_CONTROL, label: 'Launch Control', icon: Rocket },
      { id: ViewState.ADMIN, label: 'System Admin', icon: ShieldCheck },
      { id: ViewState.STRATEGY_LICENSES, label: 'Alpha Licensing', icon: Key },
      { id: ViewState.SECURITY_AUDIT, label: 'Security Posture', icon: Shield },
    ] : []),
    { id: ViewState.LEGAL_CENTER, label: 'Legal Center', icon: Library },
    { id: ViewState.FIRM_GOVERNANCE, label: 'Node Governance', icon: Gavel },
    { id: ViewState.SETTINGS, label: 'Node Settings', icon: Settings },
  ];

  return (
    <div className="w-72 bg-panel border-r border-border flex flex-col h-full relative">
      <div className="h-24 flex flex-col justify-center px-8 border-b border-white/5 shrink-0 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <Zap className="text-sher-accent" size={24} fill="currentColor" />
          <span className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">SHER<span className="text-sher-accent not-italic">.AI</span></span>
        </div>
        <p className="text-[8px] font-black text-sher-muted uppercase tracking-[0.4em] mt-2 ml-1">Sovereign Node v4.5</p>
      </div>

      <nav className="flex-1 py-8 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                isActive ? 'bg-sher-accent text-white shadow-xl shadow-sher-accent/20' : 'text-sher-muted hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Icon size={18} className={`${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[10px] font-black uppercase tracking-[0.2em]`}>{item.label}</span>
              {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          );
        })}
      </nav>

      <div className="p-6 space-y-4 mt-auto border-t border-white/5 bg-black/40">
        <div className="bg-panel rounded-2xl p-5 border border-white/5 shadow-inner group cursor-pointer hover:border-sher-accent/30 transition-all">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[9px] text-sher-muted font-black uppercase tracking-[0.2em]">Live AUM Shard</p>
            <ShieldCheck size={10} className="text-emerald-500" />
          </div>
          <p className="text-xl font-black text-white tabular-nums tracking-tighter italic">₹{totalEquity.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
