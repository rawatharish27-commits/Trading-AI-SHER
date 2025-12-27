
import React, { useState, useEffect, useCallback, ReactNode, useMemo, Component } from 'react';
import { ViewState, BrokerConfig, UserProfile, Plan, BillingCycle, WatchlistItem, DataMode } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import SignalsView from './components/SignalsView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import SettingsView from './components/SettingsView';
import OnboardingView from './components/OnboardingView';
import PricingView from './components/PricingView';
import LandingView from './components/LandingView';
import WatchlistView from './components/WatchlistView';
import BacktestView from './components/BacktestView';
import MarketplaceView from './components/MarketplaceView';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';
import AdminView from './components/AdminView';
import StockDetailView from './components/StockDetailView';
import ForensicsView from './components/ForensicsView';
import GlobalStatusBar from './components/GlobalStatusBar';
import BrokerConfigModal from './components/modals/BrokerConfigModal';
import MarketContextBadge from './components/overlays/MarketContextBadge';
import FeatureGate from './components/FeatureGate';
import PitchMetricsView from './components/PitchMetricsView';
import InstitutionalWhitepaper from './components/InstitutionalWhitepaper';
import StrategyCertificationView from './components/StrategyCertificationView';
import AIGovernanceView from './components/AIGovernanceView';
import RegionalNodeMap from './components/RegionalNodeMap';
import LegalVaultView from './components/LegalVaultView';
import ModelRegistryView from './components/ModelRegistryView';
import StrategyIPView from './components/StrategyIPView';
import LegalCenterView from './components/LegalCenterView';
import IncidentCommandView from './components/IncidentCommandView';
import StrategyLicensingView from './components/StrategyLicensingView';
import SecurityAuditView from './components/SecurityAuditView';
import ComplianceMapView from './components/ComplianceMapView';
import TrustCenterView from './components/TrustCenterView';
import LaunchControlView from './components/LaunchControlView';
import SupportDeskView from './components/SupportDeskView';
import SandboxHubView from './components/SandboxHubView';
import InstitutionalOnboarding from './components/InstitutionalOnboarding';
import AIHealthDashboardView from './components/AIHealthDashboardView';
import InstitutionalReadinessView from './components/InstitutionalReadinessView';
import PitchDeckView from './components/PitchDeckView';
import SovereignOperatingDoc from './components/SovereignOperatingDoc';
import ThemeToggle from './components/ThemeToggle';
import { Menu, Zap, Loader2, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMarketStream } from './hooks/useMarketStream';
import { THEMES, applyTheme } from './lib/theme';
import { brokerConfigService } from './lib/services/brokerConfigService';
import { PitchAnalytics } from './lib/services/pitchAnalytics';
import { tradeJournal } from './lib/services/tradeJournal';
import { CertificationEngine } from './lib/services/certificationEngine';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LANDING);
  const [activeTheme, setActiveTheme] = useState('default');
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>(brokerConfigService.getConfig());
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(['RELIANCE', 'SBIN', 'TCS']);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);

  useEffect(() => {
    const profileSaved = localStorage.getItem('sher_user_profile');
    if (profileSaved) {
        try {
          const u = JSON.parse(profileSaved);
          setCurrentUser(u);
          setIsAuthenticated(true);
          setCurrentView(ViewState.DASHBOARD);
        } catch (e) {}
    }
    setTimeout(() => setIsInitializing(false), 800);
  }, []);

  const { indices, livePrices, currentEquity, equityData, dataMode } = useMarketStream(isAuthenticated, watchlistSymbols, 'DEMO');
  
  const mappedWatchlist = useMemo(() => {
    return watchlistSymbols.map(symbol => {
      const key = symbol.toUpperCase();
      const tick = livePrices[key];
      return { id: symbol, symbol, name: symbol, price: tick?.price || 0, change: tick?.change || 0, changePercent: tick?.changePercent || 0, volume: '0', sector: 'Equity' } as WatchlistItem;
    });
  }, [watchlistSymbols, livePrices]);

  const pitchMetrics = useMemo(() => PitchAnalytics.calculate([], 250000), []);
  const sampleCert = useMemo(() => CertificationEngine.runAudit('EMA-PB-V4', []), []);

  useEffect(() => { applyTheme(THEMES[activeTheme]); }, [activeTheme]);

  const renderContent = () => {
    if (!isAuthenticated) {
        if (currentView === ViewState.REGISTER) return <RegisterView onRegisterSuccess={() => setCurrentView(ViewState.LOGIN)} onBackToLogin={() => setCurrentView(ViewState.LANDING)} />;
        if (currentView === ViewState.LOGIN) return <LoginView onLogin={(p) => { setCurrentUser(p); setIsAuthenticated(true); setCurrentView(p.plan === Plan.INSTITUTIONAL ? ViewState.ONBOARDING_INSTITUTIONAL : ViewState.DASHBOARD); }} onGoToRegister={() => setCurrentView(ViewState.REGISTER)} />;
        return <LandingView onGetStarted={() => setCurrentView(ViewState.REGISTER)} onLogin={() => setCurrentView(ViewState.LOGIN)} onNavigate={(v) => setCurrentView(v)} />;
    }
    
    if (currentView === ViewState.ONBOARDING_INSTITUTIONAL) return <InstitutionalOnboarding onComplete={() => setCurrentView(ViewState.DASHBOARD)} />;
    
    if (currentView === ViewState.STOCK_DETAIL && selectedStock) return <StockDetailView symbol={selectedStock} onClose={() => { setSelectedStock(null); setCurrentView(ViewState.WATCHLIST); }} />;

    switch (currentView) {
      case ViewState.DASHBOARD: return <Dashboard equityData={equityData} currentEquity={currentEquity} indices={indices} onAddToWatchlist={() => {}} onSelectSymbol={(s) => { setSelectedStock(s); setCurrentView(ViewState.STOCK_DETAIL); }} />;
      case ViewState.SIGNALS: return <SignalsView />;
      case ViewState.PORTFOLIO: return <Portfolio brokerConnected={brokerConfig.isConnected} livePrices={livePrices} onOpenVault={() => setIsBrokerModalOpen(true)} />;
      case ViewState.WATCHLIST: return <WatchlistView items={mappedWatchlist} onAdd={(s) => setWatchlistSymbols([...new Set([...watchlistSymbols, s])])} onRemove={(id) => setWatchlistSymbols(watchlistSymbols.filter(s => s !== id))} onSelect={(s) => { setSelectedStock(s); setCurrentView(ViewState.STOCK_DETAIL); }} />;
      case ViewState.BACKTEST: return <BacktestView />;
      case ViewState.ANALYTICS: return <AnalyticsView />;
      case ViewState.LINEAGE_FORENSICS: return <ForensicsView />;
      case ViewState.SETTINGS: return <SettingsView currentUser={currentUser!} onLogout={() => { setIsAuthenticated(false); setCurrentView(ViewState.LANDING); }} onUpdateProfile={setCurrentUser} onThemeChange={setActiveTheme} activeTheme={activeTheme} />;
      case ViewState.WHITEPAPER: return <InstitutionalWhitepaper />;
      case ViewState.CERTIFICATION: return <StrategyCertificationView cert={sampleCert} />;
      case ViewState.FIRM_GOVERNANCE: return (
        <div className="space-y-12">
           <AIGovernanceView />
           <RegionalNodeMap />
        </div>
      );
      case ViewState.PITCH: return <PitchDeckView />;
      case ViewState.LEGAL_VAULT: return <LegalVaultView />;
      case ViewState.MODEL_REGISTRY: return <ModelRegistryView />;
      case ViewState.IP_PROTECTION: return <StrategyIPView />;
      case ViewState.LEGAL_CENTER: return <LegalCenterView />;
      case ViewState.INCIDENT_RESPONSE: return <IncidentCommandView />;
      case ViewState.STRATEGY_LICENSES: return <StrategyLicensingView />;
      case ViewState.SECURITY_AUDIT: return <SecurityAuditView />;
      case ViewState.COMPLIANCE_MAP: return <ComplianceMapView />;
      case ViewState.TRUST_CENTER: return <TrustCenterView />;
      case ViewState.LAUNCH_CONTROL: return <LaunchControlView />;
      case ViewState.SUPPORT_DESK: return <SupportDeskView />;
      case ViewState.SANDBOX_HUB: return <SandboxHubView />;
      case ViewState.AI_HEALTH_DASHBOARD: return <AIHealthDashboardView />;
      case ViewState.INSTITUTIONAL_READINESS: return <InstitutionalReadinessView />;
      case ViewState.OPERATING_DOCUMENT: return <SovereignOperatingDoc />;
      case ViewState.ADMIN: return <AdminView />;
      case ViewState.PRICING: return <PricingView currentPlan={currentUser!.plan} onSelectPlan={(p) => { 
          const up = {...currentUser!, plan: p};
          setCurrentUser(up);
          localStorage.setItem('sher_user_profile', JSON.stringify(up));
          setCurrentView(ViewState.DASHBOARD);
      }} />;
      default: return <Dashboard equityData={equityData} currentEquity={currentEquity} indices={indices} onAddToWatchlist={() => {}} onSelectSymbol={() => {}} />;
    }
  };

  if (isInitializing) return <div className="h-screen w-screen bg-bg-dark flex items-center justify-center"><Zap size={48} className="text-sher-accent animate-pulse" /></div>;

  return (
    <div className="flex h-screen bg-bg-light dark:bg-bg-dark overflow-hidden font-sans select-none">
      {isAuthenticated && (
        <div className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar currentView={currentView} onViewChange={(v) => { setCurrentView(v); setIsSidebarOpen(false); }} totalEquity={currentEquity} userRole={currentUser!.role} userPlan={currentUser!.plan} />
        </div>
      )}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {isAuthenticated && <GlobalStatusBar />}
        {isAuthenticated && (
          <header className="h-14 bg-panel-light dark:bg-panel-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-6 z-10 shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-text-secondary"><Menu size={18} /></button>
              <h1 className="text-sm font-black text-text-primary dark:text-white uppercase truncate tracking-widest">{currentView.replace('_', ' ')}</h1>
              <MarketContextBadge regime={dataMode === DataMode.LIVE ? "TRENDING" : (dataMode === DataMode.EOD ? "CHOPPY" : "CHOPPY")} />
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-3 pl-4 border-l border-border-dark">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-white leading-none">NODE_{currentUser?.userId?.toUpperCase()}</p>
                  <p className="text-[8px] font-bold text-sher-success uppercase mt-0.5 tracking-tighter flex items-center justify-end gap-1"><ShieldCheck size={8}/> Verified</p>
                </div>
                <div className="w-8 h-8 rounded-inst bg-sher-accent flex items-center justify-center font-bold text-xs text-white">{currentUser?.userId?.slice(0, 2)}</div>
              </div>
            </div>
          </header>
        )}
        <main className={`flex-1 overflow-y-auto ${isAuthenticated ? 'p-6' : ''} bg-bg-light dark:bg-bg-dark relative custom-scrollbar`}>
          <div className={`${isAuthenticated ? 'max-w-7xl mx-auto h-full' : 'w-full h-full'} print-section`}>
             {renderContent()}
          </div>
        </main>
      </div>
      <BrokerConfigModal isOpen={isBrokerModalOpen} onClose={() => setIsBrokerModalOpen(false)} onUpdate={(c) => { setBrokerConfig(c); brokerConfigService.saveConfig(c); }} />
    </div>
  );
};

export default App;
