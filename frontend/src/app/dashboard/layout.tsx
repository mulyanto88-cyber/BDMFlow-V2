"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Building2,
  UserCheck,
  Activity,
  Filter,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Market", icon: LayoutDashboard },
  { href: "/dashboard/bandarmologi", label: "Bandarmologi", icon: BarChart3 },
  { href: "/dashboard/screener", label: "Screener", icon: Filter },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
];

const SUB_ITEMS = [
  { href: "/stock/BBRI", label: "Stock Analyzer", icon: TrendingUp },
  { href: "/dashboard/foreign-flow", label: "Foreign Flow", icon: TrendingUp },
  { href: "/dashboard/ksei", label: "KSEI Tracker", icon: Building2 },
  { href: "/dashboard/insider", label: "Insider Intel", icon: UserCheck },
  { href: "/dashboard/groups", label: "Groups & Sectors", icon: Activity },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 300000, refetchInterval: 300000 } },
  }));

  return (
    <QueryClientProvider client={client}>
      <div className="flex h-screen overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
          <div className="p-4 border-b border-[var(--color-border)]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight">
                BDM<span className="text-blue-400">Flow</span>
              </span>
            </Link>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">v0.2.0</p>
          </div>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                  {active && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              );
            })}

            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                Modules
              </p>
            </div>

            {SUB_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    pathname === item.href
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-[var(--color-border)]">
            <div className="text-[10px] text-[var(--color-text-muted)]">IDX Market Data</div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </QueryClientProvider>
  );
}
