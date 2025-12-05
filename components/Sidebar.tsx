import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Briefcase, Activity, Settings, Zap, List, History } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.SIGNALS, label: 'AI Signals', icon: Activity },
    { id: ViewState.PORTFOLIO, label: 'Portfolio', icon: Briefcase },
    { id: ViewState.WATCHLIST, label: 'Watchlist', icon: List },
    { id: ViewState.BACKTEST, label: 'Backtesting', icon: History },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-sher-card border-r border-gray-800 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Zap className="text-sher-accent mr-2" size={24} fill="currentColor" />
        <span className="text-xl font-bold tracking-wider text-white">SHER<span className="text-sher-accent">.AI</span></span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-sher-accent/10 text-sher-accent shadow-sm shadow-sher-accent/5' 
                  : 'text-sher-muted hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className={`${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-sm font-medium ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sher-accent shadow-glow" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
          <p className="text-xs text-sher-muted mb-1">Equity Value</p>
          <p className="text-lg font-bold text-white">₹ 2,45,300.00</p>
          <p className="text-xs text-sher-success mt-1 flex items-center gap-1">
            +2.4% <span className="text-slate-500">today</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
