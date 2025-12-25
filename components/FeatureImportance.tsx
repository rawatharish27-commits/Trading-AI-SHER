
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BrainCircuit, Info, Target, ShieldCheck } from 'lucide-react';
import { explainabilityService } from '../lib/services/explainabilityService';

const FeatureImportance: React.FC<{ strategy: string }> = ({ strategy }) => {
  const data = useMemo(() => explainabilityService.getImpacts(strategy), [strategy]);

  return (
    <div className="bg-panel border border-border rounded-[40px] p-10 shadow-2xl space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
             <BrainCircuit size={24} className="text-sher-accent" /> Alpha Explainability
          </h3>
          <p className="text-[10px] text-sher-muted font-bold uppercase tracking-widest">Attribution Node: {strategy}</p>
        </div>
        <div className="p-4 bg-sher-accent/10 rounded-2xl text-sher-accent border border-sher-accent/20 shadow-inner">
           <Target size={24} />
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ffffff05" />
            <XAxis type="number" hide domain={[-1, 1]} />
            <YAxis 
              dataKey="feature" 
              type="category" 
              fontSize={10} 
              axisLine={false} 
              tickLine={false} 
              stroke="#94a3b8" 
              width={80}
              tick={{fontWeight: '900'}}
            />
            <Tooltip 
              cursor={{fill: '#ffffff05'}}
              contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '12px' }}
            />
            <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.impact > 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-start gap-4 group">
            <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-1" />
            <div>
               <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Primary Driver</p>
               <p className="text-xs text-sher-muted font-medium italic">"Trend alignment remains the most consistent factor in this regime."</p>
            </div>
         </div>
         <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex items-start gap-4 group">
            <Info size={20} className="text-sher-accent shrink-0 mt-1" />
            <div>
               <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Feature Drift</p>
               <p className="text-xs text-sher-muted font-medium italic">"Orderflow impact has decayed by 14% over last 5 sessions."</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FeatureImportance;
