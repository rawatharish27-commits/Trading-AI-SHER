
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart
} from "recharts";

interface NoTradeTrendChartProps {
  data: any[];
}

export const NoTradeTrendChart: React.FC<NoTradeTrendChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="noTradeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2B6CB0" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#2B6CB0" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis 
            dataKey="date" 
            fontSize={8} 
            axisLine={false} 
            tickLine={false} 
            stroke="#6B7280"
            minTickGap={20}
          />
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
            itemStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#2B6CB0', textTransform: 'uppercase' }}
            labelStyle={{ display: 'none' }}
          />
          <Area
            type="monotone"
            dataKey="noTradeRate"
            name="Veto Probability"
            stroke="#2B6CB0"
            strokeWidth={2}
            fill="url(#noTradeGrad)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
