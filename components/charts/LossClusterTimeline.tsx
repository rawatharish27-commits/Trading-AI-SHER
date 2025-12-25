import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

interface LossClusterTimelineProps {
  data: any[];
}

export const LossClusterTimeline: React.FC<LossClusterTimelineProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
          <XAxis dataKey="date" hide />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} stroke="#6B7280" fontSize={8} />
          <Tooltip 
            cursor={{fill: 'rgba(239, 68, 68, 0.05)'}}
            contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '2px' }}
            itemStyle={{ fontSize: '10px', fontWeight: 'black', color: '#EF4444', textTransform: 'uppercase' }}
            labelStyle={{ display: 'none' }}
          />
          <Bar dataKey="lossClusters" name="Stress Event" fill="#9B2C2C" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.lossClusters > 0 ? '#9B2C2C' : 'transparent'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};