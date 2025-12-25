
import React, { useState, useEffect } from 'react';
import { DailyReport } from '../types';
import { FileText, Download, Calendar, ShieldCheck, AlertCircle, TrendingUp, Filter, Search } from 'lucide-react';

const ReportView: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports/daily');
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Compliance & EOD Audit</h2>
          <p className="text-sm text-sher-muted">Regulatory-grade performance logs and risk audits.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg border border-gray-700">
              <Calendar size={14} /> Custom Range
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-sher-accent text-white text-xs font-bold rounded-lg shadow-lg">
              <Download size={14} /> Bulk Export (PDF)
           </button>
        </div>
      </div>

      <div className="bg-sher-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-sher-muted text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Report Date</th>
                <th className="px-6 py-4 text-center">Trades</th>
                <th className="px-6 py-4 text-right">Net PnL</th>
                <th className="px-6 py-4 text-right">Max Drawdown</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Best Strategy</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {reports.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                  <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                    <FileText size={14} className="text-sher-accent" /> {r.date}
                  </td>
                  <td className="px-6 py-4 text-center text-sher-muted font-bold">{r.totalTrades}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${r.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {r.netPnL >= 0 ? '+' : ''}₹{r.netPnL.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-rose-400 font-mono font-bold">-{r.maxDrawdown}%</td>
                  <td className="px-6 py-4 text-center">
                    {r.riskBreaches.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <ShieldCheck size={10} /> PASSED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle size={10} /> BREACHED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-bold text-sher-accent bg-sher-accent/10 px-2 py-1 rounded border border-sher-accent/20">
                      {r.bestStrategy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 text-sher-muted hover:text-white transition-colors">
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
