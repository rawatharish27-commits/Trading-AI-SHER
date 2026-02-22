"use client";

import { useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrderStore } from "@/store/useOrderStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { OrderStatus } from "@/lib/orders-api";

const statusConfig: Record<OrderStatus, { icon: typeof Clock; color: string }> = {
  PENDING: { icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
  SUBMITTED: { icon: Clock, color: "text-blue-500 bg-blue-500/10" },
  PARTIALLY_FILLED: { icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  FILLED: { icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  CANCELLED: { icon: XCircle, color: "text-gray-500 bg-gray-500/10" },
  REJECTED: { icon: AlertCircle, color: "text-red-500 bg-red-500/10" },
  EXPIRED: { icon: XCircle, color: "text-gray-500 bg-gray-500/10" },
};

export function OrderBook() {
  const { todayOrders, isLoading, fetchTodayOrders, cancelOrder } = useOrderStore();

  useEffect(() => {
    fetchTodayOrders();
  }, [fetchTodayOrders]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
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
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <p className="text-sm text-muted-foreground">Today&apos;s order history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchTodayOrders()}
            className="h-8 w-8"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </button>
        </div>
      </div>

      {todayOrders.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <p>No orders today</p>
          <p className="text-sm mt-1">Place orders from the Orders page</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {todayOrders.map((order) => {
            const status = statusConfig[order.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={order.id}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded",
                      order.side === "BUY" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}
                  >
                    {order.side}
                  </span>
                  <div>
                    <p className="font-medium">{order.symbol}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.quantity} @ ₹{order.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.order_time).toLocaleTimeString('en-IN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span
                    className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                      status.color
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {order.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
