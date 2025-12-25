
import React from 'react';
import { ChevronRight, Fingerprint, BrainCircuit, Activity, ShieldCheck } from 'lucide-react';

interface ExplainPanelProps {
  reasons: string[];
  regime: string;
  indicators: string[];
  trapRisk: string;
}

const ExplainPanel: React.FC<ExplainPanelProps> = ({ reasons, regime, indicators, trapRisk }) => {
  return (
    <div className="bg-slate-900/40 border border-gray-800 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 pb-4">
        <BrainCircuit size={20} className="text-sher-accent" />
        <h3 className="text-sm font-black text-white uppercase tracking-widest">Decision Explainer</h3>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* Why Matrix */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-purple-400" /> Causal Reasoning
          </p>
          {reasons.map((reason, idx) => (
            <div key={idx} className="flex gap-3 items-start group">
              <ChevronRight size={12} className="text-sher-accent shrink-0 mt-1 transition-transform group-hover:translate-x-1" />
              <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                {reason}
              </p>
            </div>
          ))}
        </div>

        {/* Technical Context */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[9px] font-black text-sher-muted uppercase mb-1">Market Regime</p>
            <p className="text-xs font-bold text-sher-accent">{regime}</p>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-gray-800">
            <p className="text-[9px] font-black text-sher-muted uppercase mb-1">Trap Detection</p>
            <p className={`text-xs font-bold ${trapRisk === 'LOW' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trapRisk} RISK
            </p>
          </div>
        </div>

        {/* Indicator Flags */}
        <div>
          <p className="text-[10px] font-black text-sher-muted uppercase tracking-widest mb-3">Indicators Verified</p>
          <div className="flex flex-wrap gap-2">
            {indicators.map((ind, idx) => (
              <span key={idx} className="text-[9px] font-bold px-2 py-1 rounded bg-slate-800 border border-gray-700 text-gray-400">
                {ind}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-800 flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-500" />
        <p className="text-[10px] text-sher-muted font-medium italic">Logic verified against Institutional Ethics Guardrails.</p>
      </div>
    </div>
  );
};

export default ExplainPanel;
