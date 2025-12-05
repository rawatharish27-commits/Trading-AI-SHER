
import React, { useState, useEffect } from 'react';
import { ViewState } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import SignalsView from './components/SignalsView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import TickerTape from './components/TickerTape';
import WatchlistView from './components/WatchlistView';
import BacktestView from './components/BacktestView';
import SettingsView from './components/SettingsView';
import { LayoutDashboard, Briefcase, Activity, Settings, Bell, LogOut, List, History } from 'lucide-react';
import { useMarketStream } from './hooks/useMarketStream';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  
  // Phase 4: Market Data Stream (Simulating Python Ingest Service)
  const { indices, equityData, currentEquity, isConnected } = useMarketStream(isAuthenticated);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView(ViewState.LOGIN);
  };

  const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      setCurrentView(ViewState.DASHBOARD);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard equityData={equityData} currentEquity={currentEquity} />;
      case ViewState.PORTFOLIO:
        return <Portfolio />;
      case ViewState.SIGNALS:
        return <SignalsView />;
      case ViewState.WATCHLIST:
        return <WatchlistView />;
      case ViewState.BACKTEST:
        return <BacktestView />;
      case ViewState.SETTINGS:
        return <SettingsView onLogout={handleLogout} />;
      default:
        return <Dashboard equityData={equityData} currentEquity={currentEquity} />;
    }
  };

  // Auth Routing
  if (!isAuthenticated) {
      if (currentView === ViewState.REGISTER) {
          return <RegisterView 
            onRegisterSuccess={() => setCurrentView(ViewState.LOGIN)} 
            onBackToLogin={() => setCurrentView(ViewState.LOGIN)} 
          />;
      }
      return <LoginView 
        onLogin={handleLoginSuccess} 
        onGoToRegister={() => setCurrentView(ViewState.REGISTER)} 
      />;
  }

  return (
    <div className="flex h-screen bg-sher-dark overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <div className="hidden md:flex">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-sher-card border-b border-gray-800 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center gap-2 md:hidden">
             {/* Mobile Menu Trigger (Simplified) */}
             <button onClick={() => setCurrentView(ViewState.DASHBOARD)} className="text-sher-text font-bold text-xl">
                SHER
             </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {currentView === ViewState.DASHBOARD && 'Market Overview'}
              {currentView === ViewState.PORTFOLIO && 'Portfolio Holdings'}
              {currentView === ViewState.SIGNALS && 'AI Signals Intelligence'}
              {currentView === ViewState.WATCHLIST && 'Market Watchlist'}
              {currentView === ViewState.BACKTEST && 'Backtest Simulation Engine'}
              {currentView === ViewState.SETTINGS && 'System Configuration'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-sher-success animate-pulse' : 'bg-sher-danger'}`}></div>
              <span className="text-xs font-medium text-sher-muted">
                {isConnected ? 'LIVE FEED ACTIVE' : 'CONNECTING...'}
              </span>
            </div>
            <button className="p-2 text-sher-muted hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-sher-accent rounded-full border border-sher-card"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sher-accent to-purple-600 flex items-center justify-center font-bold text-xs shadow-lg shadow-purple-900/20 cursor-pointer hover:ring-2 hover:ring-sher-accent/50 transition-all">
              AD
            </div>
          </div>
        </header>

        {/* Phase 4: Live Ticker Tape */}
        <TickerTape indices={indices} />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth bg-sher-dark">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Nav (Visible only on small screens) */}
      <div className="md:hidden absolute bottom-0 w-full bg-sher-card border-t border-gray-800 flex justify-around py-3 px-2 z-20">
        <button onClick={() => setCurrentView(ViewState.DASHBOARD)} className={`${currentView === ViewState.DASHBOARD ? 'text-sher-accent' : 'text-sher-muted'}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setCurrentView(ViewState.SIGNALS)} className={`${currentView === ViewState.SIGNALS ? 'text-sher-accent' : 'text-sher-muted'}`}>
          <Activity size={24} />
        </button>
        <button onClick={() => setCurrentView(ViewState.PORTFOLIO)} className={`${currentView === ViewState.PORTFOLIO ? 'text-sher-accent' : 'text-sher-muted'}`}>
          <Briefcase size={24} />
        </button>
        <button onClick={() => setCurrentView(ViewState.SETTINGS)} className={`${currentView === ViewState.SETTINGS ? 'text-sher-accent' : 'text-sher-muted'}`}>
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
};

export default App;
