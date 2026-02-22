"use client";

import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
  time: string;
}

const orders: Order[] = [
  { id: "ORD001", symbol: "RELIANCE", side: "BUY", qty: 50, price: 2456.50, status: "FILLED", time: "10:30 AM" },
  { id: "ORD002", symbol: "TCS", side: "BUY", qty: 25, price: 3542.00, status: "PENDING", time: "10:45 AM" },
  { id: "ORD003", symbol: "INFY", side: "SELL", qty: 100, price: 1485.25, status: "FILLED", time: "11:00 AM" },
  { id: "ORD004", symbol: "SBIN", side: "BUY", qty: 200, price: 625.00, status: "CANCELLED", time: "11:15 AM" },
  { id: "ORD005", symbol: "HDFCBANK", side: "BUY", qty: 75, price: 1682.50, status: "FILLED", time: "11:30 AM" },
];

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
  FILLED: { icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  CANCELLED: { icon: XCircle, color: "text-gray-500 bg-gray-500/10" },
  REJECTED: { icon: AlertCircle, color: "text-red-500 bg-red-500/10" },
};

export function OrderBook() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent Orders</h2>
          <p className="text-sm text-muted-foreground">Today&apos;s order history</p>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          View All
        </button>
      </div>

      <div className="divide-y divide-border">
        {orders.map((order) => {
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
                    {order.qty} @ ₹{order.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{order.time}</span>
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
    </div>
  );
}
