"use client";

import { useEffect } from "react";
import { TrendingUp, TrendingDown, MoreHorizontal, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function PortfolioTable() {
  const { positions, isLoading, fetchPositions, closePosition } = usePortfolioStore();

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  // Filter only open positions
  const openPositions = positions.filter(p => p.status === 'OPEN' || p.status === 'PARTIALLY_CLOSED');

  const totalPnl = openPositions.reduce((acc, p) => acc + p.unrealized_pnl, 0);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Open Positions</h2>
          <p className="text-sm text-muted-foreground">{openPositions.length} active positions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(
            "px-3 py-1 rounded-lg text-sm font-medium",
            totalPnl >= 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          )}>
            {totalPnl >= 0 ? "+" : ""}₹{Math.abs(totalPnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchPositions()}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {openPositions.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No open positions</p>
          <p className="text-sm mt-1">Your portfolio is currently empty</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Symbol</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Side</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Avg Price</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">LTP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">P&L</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">%</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {openPositions.map((position) => (
                <tr
                  key={position.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium">{position.symbol}</span>
                      <span className="text-xs text-muted-foreground ml-1">({position.exchange})</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      position.side === 'LONG' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {position.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{position.open_quantity}</td>
                  <td className="px-4 py-3 text-right">₹{position.entry_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{position.current_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "font-medium flex items-center justify-end gap-1",
                      position.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {position.unrealized_pnl >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {position.unrealized_pnl >= 0 ? "+" : ""}₹{Math.abs(position.unrealized_pnl).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      "font-medium",
                      position.pnl_percent >= 0 ? "text-green-500" : "text-red-500"
                    )}>
                      {position.pnl_percent >= 0 ? "+" : ""}{position.pnl_percent.toFixed(2)}%
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
      )}
    </div>
  );
}
