
import React, { useState, useEffect, useMemo } from 'react';
import { PortfolioItem, MarketTick, AssetClass, PortfolioSummary } from '../types';
import { Bot, Loader2, X, RefreshCw, AlertCircle, Zap, Lock, ShieldCheck, TrendingUp, Landmark, Calculator } from 'lucide-react';
import { analyzePortfolio } from '../services/geminiService';
import { fetchAllHoldings } from '../services/brokerService';

const MOCK_HOLDINGS: PortfolioItem[] = [
  { id: '1', symbol: 'RELIANCE', assetClass: AssetClass.EQUITY, quantity: 25, avgPrice: 2450.00, currentPrice: 2480.50, pnl: 762.50, pnlPercent: 1.24 },
  { id: '2', symbol: 'TATASTEEL', assetClass: AssetClass.EQUITY, quantity: 100, avgPrice: 142.50, currentPrice: 145.20, pnl: 270.00, pnlPercent: 1.89 },
];

interface PortfolioProps {
    brokerConnected: boolean;
    livePrices: { [key: string]: MarketTick };
    onOpenVault?: () => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ brokerConnected, livePrices, onOpenVault }) => {
  const [baseHoldings, setBaseHoldings] = useState<PortfolioItem[]>(MOCK_HOLDINGS);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const holdings = useMemo(() => {
      return baseHoldings.map(item => {
          const cleanSymbol = item.symbol.split('-')[0].replace(/\s/g, '');
          const liveTick = livePrices[cleanSymbol] || livePrices[item.symbol];
          if (!liveTick) return item;
          const currentPrice = liveTick.price;
          const pnl = (currentPrice - item.avgPrice) * item.quantity;
          const pnlPercent = (pnl / (item.avgPrice * item.quantity)) * 100;
          return { ...item, currentPrice, pnl, pnlPercent };
      });
  }, [baseHoldings, livePrices]);

  const loadBrokerHoldings = async () => {
    if (!brokerConnected) return;
    setIsRefreshing(true);
    const result = await fetchAllHoldings();
    if (result.holdings.length > 0) setBaseHoldings(result.holdings);
    if (result.summary) setSummary(result.summary);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (brokerConnected) {
        loadBrokerHoldings();
        const interval = setInterval(loadBrokerHoldings, 30000);
        return () => clearInterval(interval);
    } else {
        setBaseHoldings(MOCK_HOLDINGS);
        setSummary(null);
    }
  }, [brokerConnected]);

  const handleAudit = async () => {
    setIsAnalyzing(true);
    const result = await analyzePortfolio(holdings);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const totalPnL = summary ? summary.totalprofitandloss : holdings.reduce((sum, h) => sum + h.pnl, 0);
  const totalInvested = summary ? summary.totalinvvalue : holdings.reduce((sum, h) => sum + (h.avgPrice * h.quantity), 0);
  const totalValue = summary ? summary.totalholdingvalue : (totalInvested + totalPnL);
  const totalPnLPct = summary ? summary.totalpnlpercentage : (totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-sher-card border border-gray-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Landmark size={48}/></div>
              <span className="text-[10px] font-black text-sher-muted uppercase tracking-[0.2em]">Invested Capital</span>
              <span className="text-2xl font-black text-white mt-1 tabular-nums">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <div className="mt-4 flex items-center gap-2">
                 <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-sher-accent" style={{ width: '100%' }} />
                 </div>
              </div>
          </div>
          <div className="bg-sher-card border border-gray-800 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={48}/></div>
              <span className="text-[10px] font-black text-sher-muted uppercase tracking-[0.2em]">Current Market Value</span>
              <span className="text-2xl font-black text-white mt-1 tabular-nums">₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <p className="text-[8px] font-black text-sher-muted uppercase mt-4 tracking-widest">Marked to Market</p>
          </div>
          <div className={`bg-sher-card border rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden group transition-all ${totalPnL >= 0 ? 'border-emerald-500/20 bg-emerald-500/[0.02]' : 'border-rose-500/20 bg-rose-500/[0.02]'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={48} className={totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}/></div>
              <div className="flex justify-between items-center relative z-10">
                  <span className="text-[10px] font-black text-sher-muted uppercase tracking-[0.2em]">Unrealized Performance</span>
                  <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${totalPnL >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
                      <span className="text-[8px] font-black text-sher-muted uppercase tracking-widest">Neural Feed</span>
                  </div>
              </div>
              <div className="flex items-baseline gap-3 mt-1 relative z-10">
                  <span className={`text-2xl font-black tabular-nums tracking-tighter ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-sm font-black ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totalPnL >= 0 ? '▲' : '▼'} {Math.abs(totalPnLPct).toFixed(2)}%
                  </span>
              </div>
          </div>
      </div>

      <div className="bg-sher-card border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-slate-900/30">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-sher-accent border border-white/5 shadow-inner">
                <Calculator size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tight">Core Holdings</h2>
                <p className="text-[9px] text-sher-muted font-black uppercase tracking-widest">Institutional Asset Inventory</p>
              </div>
              {brokerConnected ? (
                  <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <ShieldCheck size={10} /> LIVE NODE ACTIVE
                  </span>
              ) : (
                  <button 
                    onClick={onOpenVault}
                    className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 hover:bg-amber-500/20 transition-all uppercase tracking-widest"
                  >
                      <Lock size={10} /> INITIALIZE VAULT
                  </button>
              )}
          </div>
          <div className="flex gap-2">
               <button 
                  onClick={loadBrokerHoldings}
                  disabled={!brokerConnected || isRefreshing}
                  className={`p-2.5 rounded-xl border border-gray-800 text-sher-muted hover:text-white transition-all bg-slate-900/50 ${isRefreshing ? 'animate-spin' : ''} disabled:opacity-30`}
               >
                  <RefreshCw size={16} />
               </button>
               <button 
                  onClick={handleAudit}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 bg-sher-accent text-white text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-sher-accent/20 hover:bg-blue-600 active:scale-95 border border-white/10"
               >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                  Neural Risk Audit
               </button>
          </div>
        </div>

        {analysis && (
            <div className="bg-purple-900/10 border-b border-purple-500/20 p-6 flex gap-4 animate-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Bot size={80}/></div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/30 shrink-0 shadow-inner">
                   <Bot size={24} />
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">Audit Verdict</p>
                   <p className="text-sm text-purple-100/80 leading-relaxed italic font-medium">"{analysis}"</p>
                </div>
                <button onClick={() => setAnalysis(null)} className="p-2 h-fit bg-white/5 rounded-full text-purple-400/50 hover:text-purple-400 hover:bg-white/10 transition-all"><X size={18}/></button>
            </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950 text-sher-muted text-[10px] uppercase font-black tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Node Identity</th>
                <th className="px-8 py-5 text-right">Units</th>
                <th className="px-8 py-5 text-right">Basis Node</th>
                <th className="px-8 py-5 text-right">LTP Probe</th>
                <th className="px-8 py-5 text-right">Session Delta</th>
                <th className="px-8 py-5 text-right">ROI Edge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {holdings.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-1.5 h-10 rounded-full transition-all group-hover:scale-y-110 ${item.pnl >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                        <div>
                           <p className="font-black text-white group-hover:text-sher-accent transition-colors uppercase tracking-tight">{item.symbol}</p>
                           <p className="text-[9px] font-bold text-sher-muted uppercase tracking-widest">{item.exchange || 'NSE'} | {item.product || 'CNC'}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right text-white font-black tabular-nums">{item.quantity}</td>
                  <td className="px-8 py-6 text-right text-sher-muted font-bold tabular-nums text-xs">₹{item.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6 text-right text-white font-black tabular-nums text-xs">
                    ₹{item.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-8 py-6 text-right font-black tabular-nums text-xs ${item.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.pnl >= 0 ? '+' : ''}₹{item.pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black tabular-nums border transition-all ${item.pnlPercent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                        {item.pnlPercent >= 0 ? '▲' : '▼'} {Math.abs(item.pnlPercent).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
              {holdings.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-8 py-32 text-center">
                          <div className="flex flex-col items-center justify-center space-y-6 opacity-30">
                            <ShieldCheck size={64} className="text-sher-muted animate-pulse" />
                            <div className="space-y-2">
                               <p className="text-xs font-black text-white uppercase tracking-[0.4em]">Zero Capital Exposure</p>
                               <p className="text-[10px] text-sher-muted font-black uppercase tracking-widest">Connect your Production Node to synchronize holdings.</p>
                            </div>
                          </div>
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
