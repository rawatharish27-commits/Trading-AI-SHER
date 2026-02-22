"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  Briefcase,
  LineChart,
  Settings,
  HelpCircle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Signals",
    href: "/signals",
    icon: TrendingUp,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    icon: Briefcase,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: LineChart,
  },
];

const bottomNavItems = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50">
      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground/70 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-border">
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Today&apos;s P&L</span>
            <span className="text-green-500 font-medium">+₹12,450</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium">68.5%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active Signals</span>
            <span className="font-medium">5</span>
          </div>
        </div>
      </div>

      {/* Pro Badge */}
      <div className="p-4">
        <div className="p-3 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Pro Plan</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Unlimited signals & advanced analytics
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="p-4 border-t border-border space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground/70 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
