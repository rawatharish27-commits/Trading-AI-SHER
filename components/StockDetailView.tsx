
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Zap, 
  Globe, 
  BrainCircuit,
  Loader2,
  Lock,
  Radio,
  Activity,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  Trash2,
  DollarSign
} from 'lucide-react';
import PriceChart from './charts/PriceChart';
import ForecastChart from './charts/ForecastChart';
import OrderflowTerminal from './widgets/OrderflowTerminal';
import { analyzeStock, analyzeSymbol } from '../services/geminiService';
import { ProbabilityEngine } from '../lib/services/probabilityEngine';
import { DepthService } from '../lib/services/depthService';
import { fetchMarketData } from '../services/brokerService';
import { scripMasterService } from '../lib/services/scripMasterService';
import { SymbolAnalysis, AssetClass } from '../types';

interface StockDetailViewProps {
  symbol: string;
  onClose: () => void;
}

const StockDetailView: React.FC<StockDetailViewProps> = ({ symbol, onClose }) => {
  const [analysis, setAnalysis] = useState<SymbolAnalysis | null>(null);
  const [liveQuote, setLiveQuote] = useState<any>(null);
  const [brief, setBrief] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [orderQty, setOrderQty] = useState(1);
  const [executing, setExecuting] = useState(false);
  
  const MOCK_CHART_DATA = Array.from({ length: 60 }, (_, i) => ({
    time: new Date(Date.now() - (60 - i) * 3600000).toISOString(),
    open: 2400 + Math.random() * 100,
    high: 2520, 
    low: 2380, 
    close: 2450 + (Math.random() - 0.5) * 50,
    volume: 1000 + Math.random() * 500
  }));

  useEffect(() => {
    const initScan = async () => {
      setIsLoading(true);
      
      // 1. Fetch Real Quote Data
      const instr = scripMasterService.getScripBySymbol(symbol);
      let price = 2450;
      if (instr) {
        try {
          const quoteData = await fetchMarketData('FULL', { [instr.exch_seg]: [instr.token] });
          if (quoteData && quoteData.fetched && quoteData.fetched.length > 0) {
            setLiveQuote(quoteData.fetched[0]);
            price = quoteData.fetched[0].ltp;
          }
        } catch (e) {
          console.warn("🦁 [StockDetail] Exchange quote fetch bypassed.");
        }
      }

      // 2. Technical/Fundamental Analysis (Explainable AI)
      const resAudit = await analyzeSymbol(symbol);
      const resBrief = await analyzeStock(symbol, price, liveQuote?.percentChange || 0, "Neural Deep-Scan");
      
      setBrief(resBrief);

      if (resAudit) {
        resAudit.forecast = ProbabilityEngine.forecast(MOCK_CHART_DATA as any);
        resAudit.marketDepth = DepthService.analyzeDepth(
          liveQuote?.depth?.buy || [], 
          liveQuote?.depth?.sell || []
        );
        resAudit.footprint = DepthService.generateFootprint(price);
        setAnalysis(resAudit);
      }
      setIsLoading(false);
    };
    initScan();
  }, [symbol]);

  const handlePlaceOrder = async (side: 'BUY' | 'SELL') => {
     setExecuting(true);
     await new Promise(r => setTimeout(r, 1500));
     alert(`Institutional ${side} Node Deployed for ${orderQty} units.`);
     setExecuting(false);
  };

  const ltp = liveQuote?.ltp || 2480.50;
  const pChange = liveQuote?.percentChange || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center justify-between">
        <button 
          onClick={onClose}
          className="group flex items-center gap-3 text-sher-muted hover:text-white transition-all bg-slate-900/50 px-4 py-2 rounded-2xl border border-white/5"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to Base</span>
        </button>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[9px] font-black text-sher-muted uppercase tracking-widest">Real-time Node Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5"><Globe size={160} className="text-sher-accent" /></div>
             <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-10">
                <div>
                   <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-2">{symbol}</h2>
                   <p className="text-xs text-sher-muted font-bold uppercase tracking-widest">Neural Asset Node | {liveQuote ? 'Institutional Feed' : 'Simulated Feed'}</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest mb-1">Last Traded Price</p>
                   <div className="flex items-baseline gap-4 justify-end">
                      <span className="text-4xl font-black text-white tabular-nums tracking-tighter">₹{ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className={`text-lg font-black ${pChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {pChange >= 0 ? '+' : ''}{pChange.toFixed(2)}%
                      </span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-12 border-t border-white/5">
                {[
                   { label: 'Neural Prob', val: `${(analysis?.probability || 0.74 * 100).toFixed(0)}%`, icon: Radio },
                   { label: 'Money Flow', val: analysis?.smartMoneyFlow || 'NEUTRAL', icon: Layers },
                   { label: 'Risk Rating', val: analysis?.trapRisk || 'LOW', icon: ShieldCheck },
                   { label: 'Alpha Node', val: 'V2.4 Active', icon: Zap },
                ].map(stat => (
                   <div key={stat.label}>
                      <p className="text-[8px] font-black text-sher-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                         <stat.icon size={10} className="text-sher-accent" /> {stat.label}
                      </p>
                      <p className="text-xs font-black text-white uppercase">{stat.val}</p>
                   </div>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-panel border border-border rounded-[40px] p-4 shadow-2xl overflow-hidden min-h-[400px]">
                <PriceChart data={MOCK_CHART_DATA} symbol={symbol} />
             </div>
             <div className="bg-panel border border-border rounded-[40px] p-8 shadow-2xl flex flex-col h-full">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6">Neural Forecast path</h3>
                <div className="flex-1 min-h-[250px]">
                   <ForecastChart data={analysis?.forecast || []} />
                </div>
                <div className="mt-6 p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                   <p className="text-[9px] text-sher-muted leading-relaxed font-bold uppercase italic text-center">
                     Probability distribution based on momentum decay and volume sharding.
                   </p>
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Orderflow & Execution */}
          <div className="flex-1 bg-panel border border-border rounded-[40px] p-8 shadow-2xl flex flex-col space-y-8">
             <div className="flex items-center gap-3">
                <BrainCircuit size={20} className="text-sher-accent" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Execution Node</h3>
             </div>

             <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <span className="text-[10px] font-black text-sher-muted uppercase">Quantity Units</span>
                   <span className="text-xs font-black text-white">{orderQty}</span>
                </div>
                <input 
                   type="range" min="1" max="100" value={orderQty} 
                   onChange={(e) => setOrderQty(parseInt(e.target.value))}
                   className="w-full accent-sher-accent h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer"
                />
                
                <div className="grid grid-cols-2 gap-3 pt-4">
                   <button 
                     onClick={() => handlePlaceOrder('BUY')}
                     disabled={executing}
                     className="py-5 bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10"
                   >
                     {executing ? <Loader2 size={16} className="animate-spin"/> : <ShoppingCart size={16}/>} Buy Shard
                   </button>
                   <button 
                     onClick={() => handlePlaceOrder('SELL')}
                     disabled={executing}
                     className="py-5 bg-rose-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-rose-600 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-500/10"
                   >
                     {executing ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>} Sell Shard
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-hidden">
                <OrderflowTerminal 
                   depth={analysis?.marketDepth || DepthService.getMockDepth(ltp)} 
                   footprint={analysis?.footprint || DepthService.generateFootprint(ltp)} 
                />
             </div>
          </div>

          <div className="bg-gradient-to-br from-sher-accent to-purple-600 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group shrink-0">
             <div className="absolute -top-12 -right-12 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700"><BrainCircuit size={200} /></div>
             <div className="relative z-10">
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                   <Zap size={20} fill="currentColor" /> Master Briefing
                </h3>
                <div className="space-y-4">
                   <p className="text-sm font-bold leading-relaxed italic opacity-90">"{brief || analysis?.explanation || 'Neural link calibrating...'}"</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailView;
