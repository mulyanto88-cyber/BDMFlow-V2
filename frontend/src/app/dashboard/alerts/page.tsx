"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { TierBadge } from "@/components/TierBadge";
import { SEVERITY_COLORS } from "@/lib/constants";
import { formatPercent, daysAgo } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { Bell, TrendingUp, Eye, TrendingDown, AlertTriangle, Shield } from "lucide-react";
import type { AlertSummary } from "@/types";

const ALERT_ICONS: Record<string, React.ReactNode> = {
  WHALE: <TrendingUp size={14} />,
  STEALTH: <Eye size={14} />,
  INSIDER: <Shield size={14} />,
  DISTRIBUTION: <AlertTriangle size={14} />,
  REVERSAL: <TrendingDown size={14} />,
  PRIME_LEAD: <TrendingUp size={14} />,
  VOLUME_SPIKE: <TrendingUp size={14} />,
  KSEI_ENTRY: <Shield size={14} />,
  SCORE_BREAKOUT: <Bell size={14} />,
};

export default function AlertsPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<AlertSummary[]>({
    queryKey: ["alerts-summary"],
    queryFn: () => fetchApi<AlertSummary[]>("/api/alerts/summary"),
    refetchInterval: 300000,
  });

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      <PageHeader title="Alert Center" subtitle="Active signals requiring attention" />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="lg:col-span-2 xl:col-span-3 text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        ) : data && data.length > 0 ? (
          data.map((alert) => {
            const alerts = alert.active_alerts?.split(",").map((a: string) => a.trim()) ?? [];
            return (
              <div
                key={alert.stock_code}
                className="card cursor-pointer hover:border-blue-500/30 transition-colors"
                onClick={() => router.push(`/stock/${alert.stock_code}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400">{alert.stock_code}</span>
                    <TierBadge tier={alert.composite_tier} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[var(--color-text-muted)]">{formatPercent(alert.change_percent)}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{alert.close?.toLocaleString()}</span>
                  </div>
                </div>

                {/* Alert tags */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {alerts.map((a: string) => (
                    <span
                      key={a}
                      className="badge flex items-center gap-1"
                      style={{
                        backgroundColor: (SEVERITY_COLORS[alert.highest_severity] ?? "#6b7280") + "18",
                        color: SEVERITY_COLORS[alert.highest_severity] ?? "#6b7280",
                      }}
                    >
                      {ALERT_ICONS[a] ?? null}
                      {a}
                    </span>
                  ))}
                </div>

                <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-2">
                  {alert.top_notification}
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alert.badge_color }} />
                    <span className="text-[10px] text-[var(--color-text-muted)]">
                      {alert.highest_severity} · {alert.alert_count} alerts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--color-text-muted)]">{alert.sector}</span>
                    <span className="text-sm font-bold">{alert.composite_score?.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="lg:col-span-2 xl:col-span-3 text-center text-[var(--color-text-muted)] py-12">
            <Bell size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No active alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
