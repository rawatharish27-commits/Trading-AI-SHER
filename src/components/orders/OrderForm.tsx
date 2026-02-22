"use client";

import { useState } from "react";
import { ShoppingCart, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderFormData {
  symbol: string;
  exchange: string;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "SL" | "SL-M";
  quantity: number;
  price: number;
  triggerPrice: number;
  stopLoss: number;
  target: number;
  productType: "INTRADAY" | "DELIVERY";
}

const symbols = [
  "RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK",
  "SBIN", "TATAMOTORS", "AXISBANK", "WIPRO", "BHARTIARTL",
];

export function OrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    symbol: "",
    exchange: "NSE",
    side: "BUY",
    orderType: "MARKET",
    quantity: 1,
    price: 0,
    triggerPrice: 0,
    stopLoss: 0,
    target: 0,
    productType: "INTRADAY",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Order submitted:", formData);
    // TODO: Call API
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Place Order</h2>
          <p className="text-sm text-muted-foreground">Create a new order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Symbol & Exchange */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Symbol</label>
            <select
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Select Symbol</option>
              {symbols.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Exchange</label>
            <select
              value={formData.exchange}
              onChange={(e) => setFormData({ ...formData, exchange: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>
        </div>

        {/* Buy/Sell Toggle */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Side</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, side: "BUY" })}
              className={cn(
                "py-2 rounded-lg font-medium transition-colors",
                formData.side === "BUY"
                  ? "bg-green-500 text-white"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              BUY
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, side: "SELL" })}
              className={cn(
                "py-2 rounded-lg font-medium transition-colors",
                formData.side === "SELL"
                  ? "bg-red-500 text-white"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              SELL
            </button>
          </div>
        </div>

        {/* Order Type */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Order Type</label>
          <div className="grid grid-cols-4 gap-2">
            {["MARKET", "LIMIT", "SL", "SL-M"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, orderType: type as any })}
                className={cn(
                  "py-2 rounded-lg text-sm font-medium transition-colors",
                  formData.orderType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              min="1"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          {formData.orderType !== "MARKET" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.05"
                className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </div>

        {/* SL & Target */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Stop Loss (Optional)</label>
            <input
              type="number"
              value={formData.stopLoss}
              onChange={(e) => setFormData({ ...formData, stopLoss: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.05"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Target (Optional)</label>
            <input
              type="number"
              value={formData.target}
              onChange={(e) => setFormData({ ...formData, target: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.05"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Product Type */}
        <div>
          <label className="text-sm font-medium mb-1.5 block">Product Type</label>
          <div className="grid grid-cols-2 gap-2">
            {["INTRADAY", "DELIVERY"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, productType: type as any })}
                className={cn(
                  "py-2 rounded-lg text-sm font-medium transition-colors",
                  formData.productType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-500">
            Orders placed during market hours will be executed immediately. After-market orders will be placed in the next trading session.
          </p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className={cn(
              "flex-1 py-3 rounded-lg font-medium transition-colors",
              formData.side === "BUY"
                ? "bg-green-500 text-white hover:bg-green-600"
                : "bg-red-500 text-white hover:bg-red-600"
            )}
          >
            {formData.side === "BUY" ? "Buy" : "Sell"} {formData.symbol || "Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}
