"use client";

import { useEffect, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Clock, Signal, ShoppingCart, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignalStore } from "@/store/useSignalStore";
import { useOrderStore } from "@/store/useOrderStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  type: "signal" | "order";
  title: string;
  description: string;
  time: string;
  timestamp: Date;
  status: "success" | "pending" | "failed";
}

const iconMap = {
  signal: Signal,
  order: ShoppingCart,
};

export function RecentActivity() {
  const { signals, fetchSignals, isLoading: signalsLoading } = useSignalStore();
  const { todayOrders, fetchTodayOrders, isLoading: ordersLoading } = useOrderStore();

  useEffect(() => {
    fetchSignals({ page: 1, page_size: 10 });
    fetchTodayOrders();
  }, [fetchSignals, fetchTodayOrders]);

  // Combine signals and orders into activities
  const activities: Activity[] = useMemo(() => {
    const items: Activity[] = [];

    // Add recent signals
    signals.slice(0, 5).forEach((signal) => {
      const statusMap: Record<string, "success" | "pending" | "failed"> = {
        PENDING: "pending",
        ACTIVE: "success",
        HIT_TARGET: "success",
        STOPPED_OUT: "failed",
        EXPIRED: "failed",
        CANCELLED: "failed",
      };

      items.push({
        id: `signal-${signal.id}`,
        type: "signal",
        title: `${signal.action} Signal ${signal.status === 'ACTIVE' ? 'Generated' : signal.status.toLowerCase().replace('_', ' ')}`,
        description: `${signal.symbol} - Probability: ${signal.probability}%, Entry: ₹${signal.entry_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        time: formatTimeAgo(new Date(signal.signal_time)),
        timestamp: new Date(signal.signal_time),
        status: statusMap[signal.status] || "pending",
      });
    });

    // Add recent orders
    todayOrders.slice(0, 5).forEach((order) => {
      const statusMap: Record<string, "success" | "pending" | "failed"> = {
        PENDING: "pending",
        SUBMITTED: "pending",
        PARTIALLY_FILLED: "success",
        FILLED: "success",
        CANCELLED: "failed",
        REJECTED: "failed",
        EXPIRED: "failed",
      };

      items.push({
        id: `order-${order.id}`,
        type: "order",
        title: `Order ${order.status === 'FILLED' ? 'Executed' : order.status.toLowerCase().replace('_', ' ')}`,
        description: `${order.symbol} - ${order.quantity} shares @ ₹${order.price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
        time: formatTimeAgo(new Date(order.order_time)),
        timestamp: new Date(order.order_time),
        status: statusMap[order.status] || "pending",
      });
    });

    // Sort by timestamp descending
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
  }, [signals, todayOrders]);

  const isLoading = signalsLoading || ordersLoading;

  // Format time ago helper
  function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  }

  const handleRefresh = () => {
    fetchSignals({ page: 1, page_size: 10 });
    fetchTodayOrders();
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Your latest trading activities</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="h-8 w-8"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {activities.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No recent activity</p>
          <p className="text-sm mt-1">Your trading activities will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type];

            return (
              <div
                key={activity.id}
                className="p-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
              >
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    activity.status === "success"
                      ? "bg-green-500/10"
                      : activity.status === "pending"
                      ? "bg-yellow-500/10"
                      : "bg-red-500/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      activity.status === "success"
                        ? "text-green-500"
                        : activity.status === "pending"
                        ? "text-yellow-500"
                        : "text-red-500"
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {activity.time}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-3 border-t border-border">
        <button className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium">
          View All Activity
        </button>
      </div>
    </div>
  );
}
