"use client";

import { Bell, Menu, Search, User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/providers/ThemeProvider";

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">SHER</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search symbols, signals..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-muted transition-colors relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg border border-border bg-card shadow-lg animate-slide-up">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <NotificationItem
                    title="New Signal Generated"
                    message="RELIANCE - BUY signal with 85% probability"
                    time="2 min ago"
                    type="signal"
                  />
                  <NotificationItem
                    title="Order Filled"
                    message="Your order for TCS has been executed"
                    time="15 min ago"
                    type="order"
                  />
                  <NotificationItem
                    title="Target Hit"
                    message="INFY hit target 1 - Booked +3.2% profit"
                    time="1 hour ago"
                    type="profit"
                  />
                </div>
                <div className="p-2 border-t border-border">
                  <button className="w-full py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline-block text-sm font-medium">Trader</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg animate-slide-up">
                <div className="p-3 border-b border-border">
                  <p className="font-medium">John Trader</p>
                  <p className="text-sm text-muted-foreground">trader@sher.com</p>
                </div>
                <div className="p-1">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Settings</span>
                  </Link>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors w-full text-left text-destructive">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function NotificationItem({
  title,
  message,
  time,
  type,
}: {
  title: string;
  message: string;
  time: string;
  type: "signal" | "order" | "profit" | "loss";
}) {
  const colors = {
    signal: "bg-blue-500/10 border-l-blue-500",
    order: "bg-purple-500/10 border-l-purple-500",
    profit: "bg-green-500/10 border-l-green-500",
    loss: "bg-red-500/10 border-l-red-500",
  };

  return (
    <div className={`p-3 border-l-2 ${colors[type]} hover:bg-muted/50 cursor-pointer transition-colors`}>
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">{time}</p>
    </div>
  );
}
