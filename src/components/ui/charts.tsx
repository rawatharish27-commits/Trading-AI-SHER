"use client";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

// Colors for charts
const COLORS = {
  primary: "hsl(var(--primary))",
  profit: "#22c55e",
  loss: "#ef4444",
  warning: "#eab308",
  info: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.profit,
  COLORS.info,
  COLORS.purple,
  COLORS.warning,
  COLORS.pink,
];

// Price Chart Component
interface PriceChartProps {
  data: Array<{
    time: string;
    price: number;
    volume?: number;
  }>;
  height?: number;
  showVolume?: boolean;
  className?: string;
}

export function PriceChart({
  data,
  height = 300,
  showVolume = false,
  className,
}: PriceChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`₹${value.toFixed(2)}`, "Price"]}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={COLORS.primary}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {showVolume && (
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="volume" fill={COLORS.info} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// P&L Chart Component
interface PnLChartProps {
  data: Array<{
    date: string;
    pnl: number;
    cumulative?: number;
  }>;
  height?: number;
  className?: string;
}

export function PnLChart({ data, height = 300, className }: PnLChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.profit} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS.profit} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [
              `₹${value.toFixed(2)}`,
              value >= 0 ? "Profit" : "Loss",
            ]}
          />
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={COLORS.profit}
            fillOpacity={1}
            fill="url(#colorPnL)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Win/Loss Pie Chart
interface WinLossChartProps {
  wins: number;
  losses: number;
  height?: number;
  className?: string;
}

export function WinLossChart({ wins, losses, height = 200, className }: WinLossChartProps) {
  const data = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
  ];

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            <Cell fill={COLORS.profit} />
            <Cell fill={COLORS.loss} />
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// Signal Performance Bar Chart
interface SignalPerformanceChartProps {
  data: Array<{
    symbol: string;
    signals: number;
    winRate: number;
  }>;
  height?: number;
  className?: string;
}

export function SignalPerformanceChart({
  data,
  height = 300,
  className,
}: SignalPerformanceChartProps) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="symbol" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Bar dataKey="signals" fill={COLORS.primary} name="Total Signals" radius={[4, 4, 0, 0]} />
          <Bar dataKey="winRate" fill={COLORS.profit} name="Win Rate %" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini Sparkline for inline charts
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = COLORS.primary,
  className,
}: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={cn("inline-block", className)}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { COLORS, CHART_COLORS };
