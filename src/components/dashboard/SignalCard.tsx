"use client";

import { TrendingUp, TrendingDown, Target, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalCardProps {
  symbol: string;
  action: "BUY" | "SELL";
  probability: number;
  entryPrice: number;
  target: number;
  stopLoss: number;
  riskReward: number;
}

export function SignalCard({
  symbol,
  action,
  probability,
  entryPrice,
  target,
  stopLoss,
  riskReward,
}: SignalCardProps) {
  const isBuy = action === "BUY";

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
        isBuy ? "buy-signal border-l-4" : "sell-signal border-l-4"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold">{symbol}</span>
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded",
              isBuy ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
            )}
          >
            {action}
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            probability >= 80 ? "text-green-500" : probability >= 60 ? "text-yellow-500" : "text-orange-500"
          )}
        >
          {probability}% prob
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Entry</span>
          <p className="font-medium">₹{entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" /> Target
          </span>
          <p className="font-medium text-green-500">₹{target.toFixed(2)}</p>
        </div>
        <div>
          <span className="text-muted-foreground flex items-center gap-1">
            <Shield className="h-3 w-3" /> SL
          </span>
          <p className="font-medium text-red-500">₹{stopLoss.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Risk:Reward</span>
        <span className="font-medium text-primary">1:{riskReward.toFixed(1)}</span>
      </div>
    </div>
  );
}
