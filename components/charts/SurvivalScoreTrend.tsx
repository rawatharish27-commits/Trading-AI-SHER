import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";

interface SurvivalScoreTrendProps {
  data: any[];
}

export const SurvivalScoreTrend: React.FC<SurvivalScoreTrendProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="survivalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2F855A" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2F855A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis dataKey="date" hide />
          <YAxis 
            domain={[0, 100]} 
            fontSize={8} 
            axisLine={false} 
            tickLine={false} 
            stroke="#6B7280"
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '2px' }}
            itemStyle={{ fontSize: '10px', fontWeight: 'black', color: '#2F855A', textTransform: 'uppercase' }}
            labelStyle={{ display: 'none' }}
          />
          <Area
            type="monotone"
            dataKey="survivalScore"
            name="Survival index"
            stroke="#2F855A"
            strokeWidth={2}
            fill="url(#survivalGrad)"
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};