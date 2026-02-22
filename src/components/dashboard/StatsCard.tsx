"use client";

import { TrendingUp, TrendingDown, Wallet, BarChart3, Signal } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  subtitle?: string;
  icon: "portfolio" | "profit" | "signal" | "chart";
}

const iconMap = {
  portfolio: Wallet,
  profit: TrendingUp,
  signal: Signal,
  chart: BarChart3,
};

const iconColorMap = {
  portfolio: "bg-primary/10 text-primary",
  profit: "bg-green-500/10 text-green-500",
  signal: "bg-blue-500/10 text-blue-500",
  chart: "bg-purple-500/10 text-purple-500",
};

export function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  subtitle,
  icon,
}: StatsCardProps) {
  const Icon = iconMap[icon];

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold">{value}</p>
          {(change || subtitle) && (
            <div className="flex items-center gap-2">
              {change && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium",
                    changeType === "positive" && "text-green-500",
                    changeType === "negative" && "text-red-500",
                    changeType === "neutral" && "text-muted-foreground"
                  )}
                >
                  {changeType === "positive" && <TrendingUp className="h-3 w-3" />}
                  {changeType === "negative" && <TrendingDown className="h-3 w-3" />}
                  {change}
                </span>
              )}
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-2 sm:p-3 rounded-lg", iconColorMap[icon])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}
