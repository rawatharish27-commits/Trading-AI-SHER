"use client";

import { TrendingUp, TrendingDown, MoreHorizontal, Eye, X, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Position {
  symbol: string;
  exchange: string;
  side: "LONG" | "SHORT";
  quantity: number;
  openQuantity: number;
  entryPrice: number;
  ltp: number;
  pnl: number;
  pnlPercent: number;
  stopLoss?: number;
  target?: number;
  value: number;
  sector: string;
}

const mockPositions: Position[] = [
  { symbol: "RELIANCE", exchange: "NSE", side: "LONG", quantity: 50, openQuantity: 50, entryPrice: 2420.50, ltp: 2456.75, pnl: 1812.50, pnlPercent: 1.5, stopLoss: 2380, target: 2520, value: 122837.50, sector: "Energy" },
  { symbol: "TCS", exchange: "NSE", side: "LONG", quantity: 25, openQuantity: 25, entryPrice: 3500.00, ltp: 3542.00, pnl: 1050.00, pnlPercent: 1.2, stopLoss: 3450, target: 3650, value: 88550. sector: "IT" },
  { symbol: "INFY", exchange: "NSE", side: "LONG", quantity: 100, openQuantity: 100, entryPrice: 1485.25, ltp: 1472.50, pnl: -1275.00, pnlPercent: -0.86, stopLoss: 1450, value: 147250, sector: "IT" },
  { symbol: "HDFCBANK", exchange: "NSE", side: "LONG", quantity: 75, openQuantity: 75, entryPrice: 1650.00, ltp: 1682.50, pnl: 2437.50, pnlPercent: 1.97, target: 1750, value: 126187.50, sector: "Banking" },
  { symbol: "ICICIBANK", exchange: "NSE", side: "LONG", quantity: 100, openQuantity: 100, entryPrice: 1085.00, ltp: 1092.25, pnl: 725.00, pnlPercent: 0.67, value: 109225, sector: "Banking" },
];

export function PositionsTable() {
  const totalInvested = mockPositions.reduce((acc, p) => acc + p.entryPrice * p.quantity, 0);
  const totalValue = mockPositions.reduce((acc, p) => acc + p.value, 0);
  const totalPnl = mockPositions.reduce((acc, p) => acc + p.pnl, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground mt-1">
            Manage your positions and holdings
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Invested</p>
          <p className="text-2xl font-bold mt-1">₹{totalInvested.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Current Value</p>
          <p className="text-2xl font-bold mt-1">₹{totalValue.toLocaleString()}</p>
        </div>
        <div className={cn(
          "rounded-xl border border-border bg-card p-4",
          totalPnl >= 0 ? "border-green-500/30" : "border-red-500/30"
        )}>
          <p className="text-sm text-muted-foreground">Total P&L</p>
          <p className={cn(
            "text-2xl font-bold mt-1",
            totalPnl >= 0 ? "text-green-500" : "text-red-500"
          )}>
            {totalPnl >= 0 ? "+" : ""}₹{totalPnl.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Open Positions</h2>
          <p className="text-sm text-muted-foreground">{mockPositions.length} active positions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Symbol</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Side</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Entry</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">LTP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">P&L</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">%</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {mockPositions.map((position) => (
                <tr
                  key={position.symbol}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{position.symbol}</span>
                      <span className="block text-xs text-muted-foreground">{position.sector}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        position.side === "LONG" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {position.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{position.openQuantity}</td>
                  <td className="px-4 py-3 text-right">₹{position.entryPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{position.ltp.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">₹{position.value.toLocaleString()}</td>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button className="p-1.5 rounded hover:bg-muted" title="View">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                      {position.stopLoss && (
                        <button className="p-1.5 rounded hover:bg-muted" title="Stop Loss">
                          <Target className="h-4 w-4 text-red-500" />
                        </button>
                      )}
                      <button className="p-1.5 rounded hover:bg-muted" title="Exit">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
