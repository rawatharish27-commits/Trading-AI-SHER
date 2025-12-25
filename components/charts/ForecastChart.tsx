
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ForecastPoint } from '../../types';

interface ForecastChartProps {
  data: ForecastPoint[];
}

const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4 px-2">
        <span className="text-[10px] font-black text-white uppercase tracking-widest">Neural Forecast Path</span>
        <div className="flex gap-4">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-emerald-500" /><span className="text-[8px] font-black text-sher-muted uppercase">UP</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-rose-500" /><span className="text-[8px] font-black text-sher-muted uppercase">DOWN</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-slate-600" /><span className="text-[8px] font-black text-sher-muted uppercase">RANGE</span></div>
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1F2937" />
            <XAxis 
              dataKey="candle" 
              fontSize={9} 
              axisLine={false} 
              tickLine={false} 
              stroke="#4B5563"
              tickFormatter={(v) => `+${v} Tick`}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #1F2937', borderRadius: '12px' }}
              labelStyle={{ color: '#9CA3AF', fontSize: '10px', fontWeight: 'bold' }}
            />
            <Bar dataKey="up" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
            <Bar dataKey="range" stackId="a" fill="#475569" />
            <Bar dataKey="down" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ForecastChart;
