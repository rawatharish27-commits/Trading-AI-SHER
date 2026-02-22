"use client";

import { useState } from "react";
import { Filter, Clock, CheckCircle, XCircle, AlertCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  price: number;
  avgPrice: number;
  status: "PENDING" | "FILLED" | "CANCELLED" | "REJECTED";
  productType: "INTRADAY" | "DELIVERY";
  time: string;
}

const mockOrders: Order[] = [
  { id: "ORD001", symbol: "RELIANCE", exchange: "NSE", side: "BUY", orderType: "MARKET", quantity: 50, price: 2456.50, avgPrice: 2456.75, status: "FILLED", productType: "INTRADAY", time: "10:30 AM" },
  { id: "ORD002", symbol: "TCS", exchange: "NSE", side: "BUY", orderType: "LIMIT", quantity: 25, price: 3542.00, avgPrice: 0, status: "PENDING", productType: "INTRADAY", time: "10:45 AM" },
  { id: "ORD003", symbol: "INFY", exchange: "NSE", side: "SELL", orderType: "MARKET", quantity: 100, price: 1485.25, avgPrice: 1485.00, status: "FILLED", productType: "INTRADAY", time: "11:00 AM" },
  { id: "ORD004", symbol: "SBIN", exchange: "NSE", side: "BUY", orderType: "MARKET", quantity: 200, price: 625.00, avgPrice: 0, status: "CANCELLED", productType: "INTRADAY", time: "11:15 AM" },
  { id: "ORD005", symbol: "HDFCBANK", exchange: "NSE", side: "BUY", orderType: "LIMIT", quantity: 75, price: 1682.50, avgPrice: 1682.50, status: "FILLED", productType: "DELIVERY", time: "11:30 AM" },
  { id: "ORD006", symbol: "ICICIBANK", exchange: "NSE", side: "SELL", orderType: "MARKET", quantity: 100, price: 1092.25, avgPrice: 0, status: "REJECTED", productType: "INTRADAY", time: "12:00 PM" },
];

const statusConfig = {
  PENDING: { icon: Clock, color: "text-yellow-500 bg-yellow-500/10" },
  FILLED: { icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  CANCELLED: { icon: XCircle, color: "text-gray-500 bg-gray-500/10" },
  REJECTED: { icon: AlertCircle, color: "text-red-500 bg-red-500/10" },
};

export function OrderList() {
  const [filter, setFilter] = useState<string>("all");

  const filteredOrders = filter === "all"
    ? mockOrders
    : mockOrders.filter((o) => o.status === filter);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Order History</h2>
            <p className="text-sm text-muted-foreground">Your recent orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {["all", "PENDING", "FILLED", "CANCELLED", "REJECTED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-2 py-1 rounded text-xs font-medium transition-colors",
                  filter === status
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Order ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Symbol</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Side</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Avg Price</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status];
              const StatusIcon = status.icon;

              return (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-sm">{order.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{order.symbol}</span>
                    <span className="text-xs text-muted-foreground ml-1">{order.exchange}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded",
                        order.side === "BUY" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                      )}
                    >
                      {order.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{order.orderType}</td>
                  <td className="px-4 py-3 text-right font-medium">{order.quantity}</td>
                  <td className="px-4 py-3 text-right">₹{order.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    {order.avgPrice > 0 ? `₹${order.avgPrice.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium",
                        status.color
                      )}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">{order.time}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-1 rounded hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      )}
    </div>
  );
}
