"use client";

import { useState } from "react";
import { Filter, RefreshCw, Plus } from "lucide-react";
import { SignalCard } from "@/components/dashboard/SignalCard";
import { cn } from "@/lib/utils";

interface Signal {
  id: string;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  probability: number;
  entryPrice: number;
  target1: number;
  target2: number;
  stopLoss: number;
  riskReward: number;
  status: "PENDING" | "ACTIVE" | "HIT_TARGET" | "STOPPED_OUT" | "EXPIRED";
  strategy: string;
  createdAt: string;
}

const mockSignals: Signal[] = [
  {
    id: "1",
    symbol: "RELIANCE",
    action: "BUY",
    probability: 85,
    entryPrice: 2456.50,
    target1: 2550,
    target2: 2620,
    stopLoss: 2410,
    riskReward: 2.1,
    status: "ACTIVE",
    strategy: "VWAP + RSI",
    createdAt: "2024-01-15 10:30",
  },
  {
    id: "2",
    symbol: "TCS",
    action: "BUY",
    probability: 78,
    entryPrice: 3542.00,
    target1: 3680,
    target2: 3750,
    stopLoss: 3480,
    riskReward: 2.2,
    status: "ACTIVE",
    strategy: "Momentum",
    createdAt: "2024-01-15 11:00",
  },
  {
    id: "3",
    symbol: "INFY",
    action: "SELL",
    probability: 72,
    entryPrice: 1485.25,
    target1: 1420,
    target2: 1380,
    stopLoss: 1520,
    riskReward: 1.9,
    status: "PENDING",
    strategy: "Mean Reversion",
    createdAt: "2024-01-15 11:30",
  },
  {
    id: "4",
    symbol: "HDFCBANK",
    action: "BUY",
    probability: 82,
    entryPrice: 1650.00,
    target1: 1715,
    target2: 1760,
    stopLoss: 1610,
    riskReward: 2.0,
    status: "HIT_TARGET",
    strategy: "Breakout",
    createdAt: "2024-01-14 14:00",
  },
  {
    id: "5",
    symbol: "ICICIBANK",
    action: "BUY",
    probability: 68,
    entryPrice: 1085.00,
    target1: 1120,
    target2: 1150,
    stopLoss: 1060,
    riskReward: 1.6,
    status: "STOPPED_OUT",
    strategy: "VWAP",
    createdAt: "2024-01-14 10:00",
  },
];

const statusColors = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  ACTIVE: "bg-green-500/10 text-green-500 border-green-500/30",
  HIT_TARGET: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  STOPPED_OUT: "bg-red-500/10 text-red-500 border-red-500/30",
  EXPIRED: "bg-gray-500/10 text-gray-500 border-gray-500/30",
};

export function SignalList() {
  const [filter, setFilter] = useState<string>("all");
  const [signals] = useState<Signal[]>(mockSignals);

  const filteredSignals = filter === "all"
    ? signals
    : signals.filter((s) => s.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Trading Signals</h1>
          <p className="text-muted-foreground mt-1">
            AI-generated signals with probability scores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            New Signal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {["all", "ACTIVE", "PENDING", "HIT_TARGET", "STOPPED_OUT"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === status
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            )}
          >
            {status === "all" ? "All" : status.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Signal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSignals.map((signal) => (
          <div
            key={signal.id}
            className={cn(
              "rounded-xl border bg-card p-4 hover:shadow-lg transition-shadow",
              signal.action === "BUY" ? "border-l-4 border-l-green-500" : "border-l-4 border-l-red-500"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{signal.symbol}</span>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      signal.action === "BUY"
                        ? "bg-green-500/20 text-green-500"
                        : "bg-red-500/20 text-red-500"
                    )}
                  >
                    {signal.action}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{signal.strategy}</p>
              </div>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-1 rounded border",
                  statusColors[signal.status]
                )}
              >
                {signal.status.replace("_", " ")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Entry Price</p>
                <p className="font-semibold">₹{signal.entryPrice.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Probability</p>
                <p className={cn(
                  "font-semibold",
                  signal.probability >= 80 ? "text-green-500" :
                  signal.probability >= 60 ? "text-yellow-500" : "text-orange-500"
                )}>
                  {signal.probability}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Target 1</p>
                <p className="font-medium text-green-500">₹{signal.target1}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Target 2</p>
                <p className="font-medium text-green-500">₹{signal.target2}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Stop Loss</p>
                <p className="font-medium text-red-500">₹{signal.stopLoss}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Risk:Reward</span>
                <span className="text-sm font-medium text-primary">1:{signal.riskReward}</span>
              </div>
              <span className="text-xs text-muted-foreground">{signal.createdAt}</span>
            </div>
          </div>
        ))}
      </div>

      {filteredSignals.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No signals found for the selected filter.</p>
        </div>
      )}
    </div>
  );
}
