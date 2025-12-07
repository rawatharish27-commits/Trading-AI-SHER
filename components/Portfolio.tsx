import React, { useState } from 'react';
import { PortfolioItem } from '../types';
import { Bot, Loader2, X } from 'lucide-react';
import { analyzePortfolio } from '../services/geminiService';

const MOCK_HOLDINGS: PortfolioItem[] = [
  { id: '1', symbol: 'RELIANCE', quantity: 25, avgPrice: 2450.00, currentPrice: 2480.50, pnl: 762.50, pnlPercent: 1.24 },
  { id: '2', symbol: 'TATASTEEL', quantity: 100, avgPrice: 142.50, currentPrice: 145.20, pnl: 270.00, pnlPercent: 1.89 },
  { id: '3', symbol: 'INFY', quantity: 40, avgPrice: 1520.00, currentPrice: 1495.00, pnl: -1000.00, pnlPercent: -1.64 },
  { id: '4', symbol: 'HDFCBANK', quantity: 30, avgPrice: 1600.00, currentPrice: 1612.00, pnl: 360.00, pnlPercent: 0.75 },
];

const Portfolio: React.FC = () => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAudit = async () => {
    setIsAnalyzing(true);
    const result = await analyzePortfolio(MOCK_HOLDINGS);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="bg-sher-card border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Current Holdings</h2>
        <div className="flex gap-2">
             {analysis && (
                <div className="hidden md:flex items-center bg-purple-900/30 border border-purple-500/30 rounded-lg px-3 py-1 text-xs text-purple-200 animate-in fade-in max-w-md">
                    <Bot size={14} className="mr-2 shrink-0" />
                    {analysis}
                    <button onClick={() => setAnalysis(null)} className="ml-2 hover:text-white"><X size={12}/></button>
                </div>
             )}
             <button 
                onClick={handleAudit}
                disabled={isAnalyzing}
                className="flex items-center gap-2 bg-sher-accent/10 hover:bg-sher-accent/20 text-sher-accent text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border border-sher-accent/20"
             >
                {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Bot size={14} />}
                {isAnalyzing ? 'Auditing...' : 'AI Audit'}
             </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900/50 text-sher-muted text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4 text-right">Qty</th>
              <th className="px-6 py-4 text-right">Avg Price</th>
              <th className="px-6 py-4 text-right">LTP</th>
              <th className="px-6 py-4 text-right">Value</th>
              <th className="px-6 py-4 text-right">P&L</th>
              <th className="px-6 py-4 text-right">% Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {MOCK_HOLDINGS.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 font-bold text-white">{item.symbol}</td>
                <td className="px-6 py-4 text-right text-sher-muted">{item.quantity}</td>
                <td className="px-6 py-4 text-right text-sher-muted">₹{item.avgPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-white">₹{item.currentPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-right text-white">₹{(item.quantity * item.currentPrice).toFixed(2)}</td>
                <td className={`px-6 py-4 text-right font-medium ${item.pnl >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
                  {item.pnl >= 0 ? '+' : ''}₹{item.pnl.toFixed(2)}
                </td>
                <td className={`px-6 py-4 text-right font-medium ${item.pnlPercent >= 0 ? 'text-sher-success' : 'text-sher-danger'}`}>
                  {item.pnlPercent >= 0 ? '+' : ''}{item.pnlPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Portfolio;