
import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

const COLORS = {
  TRENDING: "#2F855A",
  CHOPPY: "#B7791F",
  PANIC: "#9B2C2C"
};

interface RegimeDistributionChartProps {
  data: any[];
}

export const RegimeDistributionChart: React.FC<RegimeDistributionChartProps> = ({ data }) => {
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="regime"
            innerRadius="60%"
            outerRadius="85%"
            paddingAngle={8}
            stroke="none"
            animationDuration={800}
          >
            {data.map((entry: any) => (
              <Cell 
                key={entry.regime} 
                fill={(COLORS as any)[entry.regime] || '#6B7280'} 
                opacity={0.8}
                className="hover:opacity-100 transition-opacity cursor-crosshair"
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid #ffffff10', borderRadius: '2px' }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle"
            formatter={(value) => <span className="text-[8px] font-black uppercase text-text-secondary tracking-widest">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
