"use client";

import { StatsCard } from "./StatsCard";
import { SignalCard } from "./SignalCard";
import { PortfolioTable } from "./PortfolioTable";
import { OrderBook } from "./OrderBook";
import { MarketOverview } from "./MarketOverview";
import { RecentActivity } from "./RecentActivity";

export function DashboardContent() {
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
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Market Open
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Portfolio Value"
          value="₹5,24,500"
          change="+2.5%"
          changeType="positive"
          icon="portfolio"
        />
        <StatsCard
          title="Today's P&L"
          value="₹12,450"
          change="+1.8%"
          changeType="positive"
          icon="profit"
        />
        <StatsCard
          title="Active Signals"
          value="5"
          subtitle="3 Buy, 2 Sell"
          icon="signal"
        />
        <StatsCard
          title="Win Rate"
          value="68.5%"
          change="+3.2%"
          changeType="positive"
          icon="chart"
        />
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
              <SignalCard
                symbol="RELIANCE"
                action="BUY"
                probability={85}
                entryPrice={2456.50}
                target={2550}
                stopLoss={2410}
                riskReward={2.1}
              />
              <SignalCard
                symbol="TCS"
                action="BUY"
                probability={78}
                entryPrice={3542.00}
                target={3680}
                stopLoss={3480}
                riskReward={2.2}
              />
              <SignalCard
                symbol="INFY"
                action="SELL"
                probability={72}
                entryPrice={1485.25}
                target={1420}
                stopLoss={1520}
                riskReward={1.9}
              />
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
