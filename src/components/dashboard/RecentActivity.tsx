"use client";

import { ArrowUpRight, ArrowDownRight, Clock, Signal, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "signal" | "order" | "position";
  title: string;
  description: string;
  time: string;
  status: "success" | "pending" | "failed";
}

const activities: Activity[] = [
  {
    id: "1",
    type: "signal",
    title: "New BUY Signal Generated",
    description: "RELIANCE - Probability: 85%, Entry: ₹2456.50",
    time: "2 min ago",
    status: "success",
  },
  {
    id: "2",
    type: "order",
    title: "Order Executed",
    description: "TCS - 25 shares @ ₹3542.00",
    time: "5 min ago",
    status: "success",
  },
  {
    id: "3",
    type: "position",
    title: "Target Hit - INFY",
    description: "Booked +3.2% profit (₹4,800)",
    time: "15 min ago",
    status: "success",
  },
  {
    id: "4",
    type: "signal",
    title: "SELL Signal Generated",
    description: "BAJFINANCE - Probability: 72%",
    time: "30 min ago",
    status: "success",
  },
  {
    id: "5",
    type: "order",
    title: "Order Cancelled",
    description: "SBIN - 200 shares - User cancelled",
    time: "1 hour ago",
    status: "failed",
  },
];

const iconMap = {
  signal: Signal,
  order: ShoppingCart,
  position: ArrowUpRight,
};

export function RecentActivity() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">Your latest trading activities</p>
      </div>

      <div className="divide-y divide-border">
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

      <div className="p-3 border-t border-border">
        <button className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium">
          View All Activity
        </button>
      </div>
    </div>
  );
}
