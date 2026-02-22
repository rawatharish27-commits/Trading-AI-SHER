"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Index {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

const indices: Index[] = [
  { name: "NIFTY 50", value: 22456.50, change: 125.30, changePercent: 0.56 },
  { name: "BANKNIFTY", value: 48250.00, change: -180.50, changePercent: -0.37 },
  { name: "FINNIFTY", value: 20150.25, change: 45.75, changePercent: 0.23 },
];

const topGainers = [
  { symbol: "TATASTEEL", change: 4.5 },
  { symbol: "ADANIENT", change: 3.8 },
  { symbol: "SBIN", change: 2.9 },
];

const topLosers = [
  { symbol: "BAJFINANCE", change: -2.3 },
  { symbol: "HCLTECH", change: -1.8 },
  { symbol: "WIPRO", change: -1.5 },
];

export function MarketOverview() {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-lg font-semibold mb-4">Market Overview</h2>

      {/* Indices */}
      <div className="space-y-3 mb-4">
        {indices.map((index) => (
          <div key={index.name} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{index.name}</span>
            <div className="text-right">
              <p className="font-medium">{index.value.toLocaleString()}</p>
              <p
                className={cn(
                  "text-xs flex items-center gap-1 justify-end",
                  index.change >= 0 ? "text-green-500" : "text-red-500"
                )}
              >
                {index.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {index.change >= 0 ? "+" : ""}{index.change.toFixed(2)} ({index.changePercent >= 0 ? "+" : ""}{index.changePercent.toFixed(2)}%)
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Gainers & Losers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top Gainers</p>
          <div className="space-y-1">
            {topGainers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between text-sm">
                <span className="font-medium">{stock.symbol}</span>
                <span className="text-green-500">+{stock.change}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top Losers</p>
          <div className="space-y-1">
            {topLosers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between text-sm">
                <span className="font-medium">{stock.symbol}</span>
                <span className="text-red-500">{stock.change}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
