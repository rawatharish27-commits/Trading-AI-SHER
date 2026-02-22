"use client";

import { useEffect } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarketStore } from "@/store/useMarketStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export function MarketOverview() {
  const { 
    indices, 
    gainers, 
    losers, 
    isLoading, 
    fetchIndices, 
    fetchMovers 
  } = useMarketStore();

  useEffect(() => {
    fetchIndices();
    fetchMovers();
  }, [fetchIndices, fetchMovers]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3 mb-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full mt-1" />
            <Skeleton className="h-6 w-full mt-1" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full mt-1" />
            <Skeleton className="h-6 w-full mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Market Overview</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            fetchIndices();
            fetchMovers();
          }}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Indices */}
      <div className="space-y-3 mb-4">
        {indices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">No index data available</p>
        ) : (
          indices.map((index) => (
            <div key={index.name} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{index.name}</span>
              <div className="text-right">
                <p className="font-medium">{index.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
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
                  {index.change >= 0 ? "+" : ""}{index.change.toFixed(2)} ({index.change_percent >= 0 ? "+" : ""}{index.change_percent.toFixed(2)}%)
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Gainers & Losers */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top Gainers</p>
          <div className="space-y-1">
            {gainers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              gainers.slice(0, 3).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stock.symbol}</span>
                  <span className="text-green-500">+{stock.change_percent.toFixed(2)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top Losers</p>
          <div className="space-y-1">
            {losers.length === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              losers.slice(0, 3).map((stock) => (
                <div key={stock.symbol} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stock.symbol}</span>
                  <span className="text-red-500">{stock.change_percent.toFixed(2)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
