"use client";

import { TrendingUp, TrendingDown, Target, MoreVertical, Eye, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceChart, Sparkline } from "@/components/ui/charts";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockPriceData = [
  { time: "09:15", price: 2420.50 },
  { time: "09:30", price: 2435.25 },
  { time: "09:45", price: 2428.75 },
  { time: "10:00", price: 2445.00 },
  { time: "10:15", price: 2452.50 },
  { time: "10:30", price: 2448.25 },
  { time: "10:45", price: 2456.75 },
  { time: "11:00", price: 2462.50 },
  { time: "11:15", price: 2458.00 },
  { time: "11:30", price: 2465.25 },
];

const sparklineData = [2420, 2435, 2428, 2445, 2452, 2448, 2456, 2462, 2458, 2465];

interface EnhancedSignalCardProps {
  symbol: string;
  action: "BUY" | "SELL";
  probability: number;
  entryPrice: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  status?: "active" | "hit_target" | "stopped_out";
  showChart?: boolean;
}

export function EnhancedSignalCard({
  symbol,
  action,
  probability,
  entryPrice,
  target,
  stopLoss,
  riskReward,
  status = "active",
  showChart = true,
}: EnhancedSignalCardProps) {
  const isBuy = action === "BUY";
  const statusColors = {
    active: "bg-green-500/10 text-green-500 border-green-500/30",
    hit_target: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    stopped_out: "bg-red-500/10 text-red-500 border-red-500/30",
  };

  return (
    <Card className={cn(
      "hover:shadow-lg transition-shadow",
      isBuy ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <Badge variant={isBuy ? "success" : "destructive"}>
              {action}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[status]}>
              {status.replace("_", " ")}
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Entry Price</p>
            <p className="text-lg font-semibold">₹{entryPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Probability</p>
            <p className={cn(
              "text-lg font-semibold",
              probability >= 80 ? "text-green-500" :
              probability >= 60 ? "text-yellow-500" : "text-orange-500"
            )}>
              {probability}%
            </p>
          </div>
        </div>

        {showChart && (
          <div className="mb-4">
            <PriceChart
              data={mockPriceData.map(d => ({ ...d, price: d.price * (1 + Math.random() * 0.01 - 0.005) }))}
              height={120}
            />
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" /> Target
            </p>
            <p className="font-medium text-green-500">₹{target}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Stop Loss</p>
            <p className="font-medium text-red-500">₹{stopLoss}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Risk:Reward</p>
            <p className="font-medium text-primary">1:{riskReward}</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button className="flex-1" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Dashboard Stats with Mini Chart
interface StatWithChartProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  chartData?: number[];
}

export function StatWithChart({
  title,
  value,
  change,
  changeType = "neutral",
  chartData,
}: StatWithChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {change && (
              <p className={cn(
                "text-sm font-medium mt-1",
                changeType === "positive" && "text-green-500",
                changeType === "negative" && "text-red-500",
              )}>
                {changeType === "positive" && <TrendingUp className="inline h-3 w-3 mr-1" />}
                {changeType === "negative" && <TrendingDown className="inline h-3 w-3 mr-1" />}
                {change}
              </p>
            )}
          </div>
          {chartData && (
            <Sparkline
              data={chartData}
              width={80}
              height={40}
              color={changeType === "positive" ? "#22c55e" : changeType === "negative" ? "#ef4444" : "hsl(var(--primary))"}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
