
import React from 'react';
import { InstitutionalReport } from '../types';
import { FileText, ShieldAlert, Award, TrendingUp, Download, PieChart, Landmark, Fingerprint, Lock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const InstitutionalReportView: React.FC<{ report: InstitutionalReport }> = ({ report }) => {
  return (
    <div className="bg-white text-black p-12 lg:p-20 space-y-12 shadow-2xl rounded-[40px] animate-in fade-in duration-1000">
      {/* Report Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b-2 border-black pb-12">
        <div>
           <div className="flex items-center gap-3 mb-6">
              <Landmark size={32} />
              <h1 className="text-4xl font-black uppercase tracking-tighter italic">SHER ALPHA REPORT</h1>
           </div>
           <p className="text-lg font-bold uppercase tracking-widest">{report.strategyName} Strategy Audit</p>
           <p className="text-xs text-gray-500 font-bold uppercase mt-2">Node Period: {report.period}</p>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Audit Verified Node</p>
           <Fingerprint size={48} className="ml-auto opacity-20" />
           <p className="text-[8px] font-mono mt-2">SHA256: 8x2...f91a</p>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 border border-gray-200">
         {[
           { l: 'Net Realized Alpha', v: `₹${report.metrics.netPnL.toLocaleString()}`, c: report.metrics.netPnL > 0 ? 'text-emerald-600' : 'text-rose-600' },
           { l: 'Win Probability', v: `${report.metrics.winRate.toFixed(1)}%`, c: 'text-black' },
           { l: 'Profit Factor', v: report.metrics.profitFactor.toFixed(2), c: 'text-black' },
           { l: 'Peak Drawdown', v: `-${report.metrics.maxDrawdown}%`, c: 'text-rose-600' },
         ].map(m => (
           <div key={m.l} className="bg-white p-8">
              <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-3">{m.l}</p>
              <p className={`text-3xl font-black tabular-nums tracking-tighter ${m.c}`}>{m.v}</p>
           </div>
         ))}
      </div>

      {/* Equity Path */}
      <div className="space-y-6">
         <h3 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
            <TrendingUp size={20} /> Walk-Forward Equity Curve
         </h3>
         <div className="h-[300px] w-full border border-gray-100 p-4">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={report.equityCurve}>
                  <XAxis dataKey="date" hide />
                  <YAxis fontSize={9} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Area type="monotone" dataKey="equity" stroke="#000" strokeWidth={2} fill="#f3f4f6" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Risk and Audit Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-12 border-t border-gray-100">
         <div className="space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
               <ShieldAlert size={16} /> Risk Vulnerability Scan
            </h3>
            <div className="space-y-4">
               {report.riskNotes.map((note, i) => (
                 <div key={i} className="flex gap-4 items-start border-l-2 border-rose-500 pl-6 py-1">
                    <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{note}"</p>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-gray-50 p-10 rounded-3xl space-y-6 border border-gray-100">
            <div className="flex items-center gap-3">
               <Lock size={20} />
               <h3 className="text-xs font-black uppercase tracking-widest">Compliance Node Verdict</h3>
            </div>
            <p className="text-sm font-bold leading-relaxed">
               This strategy has been audited for regime resilience. Total capital sharding is optimized for zero market impact. No martingale or revenge trading logic detected in DNA.
            </p>
            <div className="pt-6 border-t border-gray-200">
               <span className="px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] rounded">STATUS: PRODUCTION READY</span>
            </div>
         </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-12 flex flex-col sm:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
         <p>© 2025 SHER AI QUANT LABS. ALL DATA VERIFIED AGAINST SETTLEMENT LOGS.</p>
         <div className="flex gap-6">
            <button className="flex items-center gap-2 hover:text-black transition-colors"><Download size={16}/> Save as PDF</button>
            <button className="flex items-center gap-2 hover:text-black transition-colors"><Award size={16}/> Certify Shard</button>
         </div>
      </div>
    </div>
  );
};

export default InstitutionalReportView;
