"use client";

import { useEffect } from "react";
import { StatsCard } from "./StatsCard";
import { SignalCard } from "./SignalCard";
import { PortfolioTable } from "./PortfolioTable";
import { OrderBook } from "./OrderBook";
import { MarketOverview } from "./MarketOverview";
import { RecentActivity } from "./RecentActivity";
import { usePortfolioStore } from "@/store/usePortfolioStore";
import { useSignalStore } from "@/store/useSignalStore";
import { useMarketStore } from "@/store/useMarketStore";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardContent() {
  const { portfolio, stats, fetchPortfolio, fetchStats, isLoading: portfolioLoading } = usePortfolioStore();
  const { activeSignals, stats: signalStats, fetchActiveSignals, fetchStats: fetchSignalStats } = useSignalStore();
  const { marketStatus, fetchMarketStatus } = useMarketStore();

  useEffect(() => {
    // Fetch all dashboard data on mount
    fetchPortfolio();
    fetchStats();
    fetchActiveSignals();
    fetchSignalStats();
    fetchMarketStatus();
  }, [fetchPortfolio, fetchStats, fetchActiveSignals, fetchSignalStats, fetchMarketStatus]);

  const isMarketOpen = marketStatus?.is_open ?? false;
  const marketSession = marketStatus?.session ?? 'CLOSED';

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate stats from real data
  const portfolioValue = portfolio?.current_capital ?? 0;
  const todayPnL = stats?.daily_pnl ?? 0;
  const todayPnLPercent = portfolio?.initial_capital 
    ? ((todayPnL / portfolio.initial_capital) * 100).toFixed(2)
    : '0.00';
  
  const activeSignalsCount = activeSignals?.length ?? 0;
  const buySignals = activeSignals?.filter(s => s.action === 'BUY').length ?? 0;
  const sellSignals = activeSignals?.filter(s => s.action === 'SELL').length ?? 0;
  
  const winRate = signalStats?.win_rate ?? 0;
  const avgProbability = signalStats?.avg_probability ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your trading overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
            isMarketOpen 
              ? 'bg-green-500/10 text-green-500' 
              : 'bg-red-500/10 text-red-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isMarketOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {isMarketOpen ? `Market Open - ${marketSession}` : 'Market Closed'}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioLoading ? (
          <>
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </>
        ) : (
          <>
            <StatsCard
              title="Portfolio Value"
              value={formatCurrency(portfolioValue)}
              change={portfolio?.total_return_percent ? `${portfolio.total_return_percent >= 0 ? '+' : ''}${portfolio.total_return_percent.toFixed(2)}%` : undefined}
              changeType={portfolio?.total_return_percent && portfolio.total_return_percent >= 0 ? "positive" : "negative"}
              icon="portfolio"
            />
            <StatsCard
              title="Today's P&L"
              value={formatCurrency(Math.abs(todayPnL))}
              change={todayPnL >= 0 ? `+${todayPnLPercent}%` : `${todayPnLPercent}%`}
              changeType={todayPnL >= 0 ? "positive" : "negative"}
              icon="profit"
            />
            <StatsCard
              title="Active Signals"
              value={activeSignalsCount.toString()}
              subtitle={buySignals > 0 || sellSignals > 0 ? `${buySignals} Buy, ${sellSignals} Sell` : undefined}
              icon="signal"
            />
            <StatsCard
              title="Win Rate"
              value={`${winRate.toFixed(1)}%`}
              change={avgProbability ? `Avg: ${avgProbability.toFixed(0)}% prob` : undefined}
              changeType="neutral"
              icon="chart"
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Portfolio & Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Portfolio Table */}
          <PortfolioTable />

          {/* Order Book */}
          <OrderBook />
        </div>

        {/* Right Column - Signals & Market */}
        <div className="space-y-6">
          {/* Active Signals */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold mb-4">Active Signals</h2>
            <div className="space-y-3">
              {activeSignals && activeSignals.length > 0 ? (
                activeSignals.slice(0, 5).map((signal) => (
                  <SignalCard
                    key={signal.id}
                    symbol={signal.symbol}
                    action={signal.action}
                    probability={signal.probability}
                    entryPrice={signal.entry_price}
                    target={signal.target_1}
                    stopLoss={signal.stop_loss}
                    riskReward={signal.target_1 && signal.stop_loss 
                      ? Math.abs(signal.target_1 - signal.entry_price) / Math.abs(signal.entry_price - signal.stop_loss)
                      : 0
                    }
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active signals</p>
                  <p className="text-sm mt-1">Generate signals from the Signals page</p>
                </div>
              )}
            </div>
          </div>

          {/* Market Overview */}
          <MarketOverview />
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
}
