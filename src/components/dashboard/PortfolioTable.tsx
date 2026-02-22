"use client";

import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Position {
  symbol: string;
  qty: number;
  avgPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
}

const positions: Position[] = [
  { symbol: "RELIANCE", qty: 50, avgPrice: 2420.50, ltp: 2456.75, pnl: 1812.50, pnlPercent: 1.5 },
  { symbol: "TCS", qty: 25, avgPrice: 3500.00, ltp: 3542.00, pnl: 1050.00, pnlPercent: 1.2 },
  { symbol: "INFY", qty: 100, avgPrice: 1485.25, ltp: 1472.50, pnl: -1275.00, pnlPercent: -0.86 },
  { symbol: "HDFCBANK", qty: 75, avgPrice: 1650.00, ltp: 1682.50, pnl: 2437.50, pnlPercent: 1.97 },
  { symbol: "ICICIBANK", qty: 100, avgPrice: 1085.00, ltp: 1092.25, pnl: 725.00, pnlPercent: 0.67 },
];

export function PortfolioTable() {
  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Open Positions</h2>
          <p className="text-sm text-muted-foreground">{positions.length} active positions</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-lg text-sm font-medium",
          totalPnl >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString()}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Symbol</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Avg Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">LTP</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">P&L</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">%</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr
                key={position.symbol}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-medium">{position.symbol}</span>
                </td>
                <td className="px-4 py-3 text-right">{position.qty}</td>
                <td className="px-4 py-3 text-right">₹{position.avgPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">₹{position.ltp.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    "font-medium flex items-center justify-end gap-1",
                    position.pnl >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {position.pnl >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {position.pnl >= 0 ? "+" : ""}₹{position.pnl.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    "font-medium",
                    position.pnlPercent >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {position.pnlPercent >= 0 ? "+" : ""}{position.pnlPercent.toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 rounded hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
