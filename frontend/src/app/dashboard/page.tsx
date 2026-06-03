"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { ScoreGauge } from "@/components/ScoreGauge";
import { DataTable } from "@/components/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { formatMiliar, formatPercent } from "@/lib/utils";
import { TIER_COLORS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import type { CompositeStock, MarketPulse, AlertSummary } from "@/types";

const colHelper = createColumnHelper<CompositeStock>();

const compositeColumns = [
  colHelper.accessor("rank_overall", { header: "#", size: 40, cell: (r) => r.getValue() }),
  colHelper.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  colHelper.accessor("composite_score", {
    header: "Score",
    cell: (r) => {
      const s = r.getValue();
      const color = s >= 80 ? TIER_COLORS.STRONG_BUY : s >= 65 ? TIER_COLORS.BUY : s >= 50 ? TIER_COLORS.ACCUMULATE : "inherit";
      return <span className="font-bold" style={{ color }}>{s.toFixed(0)}</span>;
    },
  }),
  colHelper.accessor("composite_tier", {
    header: "Signal",
    cell: (r) => {
      const t = r.getValue();
      const color = TIER_COLORS[t] ?? "#6b7280";
      return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "20", color }}>{t.replace(/_/g, " ")}</span>;
    },
  }),
  colHelper.accessor("close", { header: "Close", cell: (r) => r.getValue().toLocaleString() }),
  colHelper.accessor("change_percent", {
    header: "Chg%",
    cell: (r) => {
      const v = r.getValue();
      return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(v)}</span>;
    },
  }),
  colHelper.accessor("return_5d", {
    header: "5D",
    cell: (r) => {
      const v = r.getValue();
      return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(v)}</span>;
    },
  }),
  colHelper.accessor("sector", { header: "Sector", cell: (r) => r.getValue() }),
  colHelper.accessor("foreign_score", { header: "Foreign", cell: (r) => r.getValue() }),
  colHelper.accessor("broker_score", { header: "Broker", cell: (r) => r.getValue() }),
  colHelper.accessor("whale_score", { header: "Whale", cell: (r) => r.getValue() }),
];

export default function DashboardPage() {
  const router = useRouter();

  const composite = useQuery({
    queryKey: ["composite"],
    queryFn: () => fetchApi<{ data: CompositeStock[] }>("/api/composite", { pageSize: 50 }),
  });

  const pulse = useQuery<MarketPulse>({
    queryKey: ["market-pulse"],
    queryFn: () => fetchApi<MarketPulse>("/api/market-pulse"),
  });

  const alerts = useQuery<AlertSummary[]>({
    queryKey: ["alerts-summary"],
    queryFn: () => fetchApi<AlertSummary[]>("/api/alerts/summary"),
  });

  const mp = pulse.data;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader
        title="Market Command Center"
        subtitle={mp ? `${mp.latest_trading_date} — ${mp.market_regime?.replace(/_/g, " ")}` : "Loading..."}
      />

      {/* Market header cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Market Phase"
          value={mp?.market_regime?.replace(/_/g, " ") ?? "..."}
          sub={mp?.market_timing_signal}
          trend={mp?.market_regime?.includes("BULL") ? "up" : mp?.market_regime?.includes("BEAR") ? "down" : "neutral"}
        />
        <MetricCard
          label="Foreign Flow"
          value={mp ? `${(mp.net_foreign_today_miliar ?? 0) > 0 ? "+" : ""}${(mp.net_foreign_today_miliar ?? 0).toFixed(0)}M` : "..."}
          trend={mp && (mp.net_foreign_today_miliar ?? 0) > 0 ? "up" : "down"}
        />
        <MetricCard
          label="Breadth"
          value={mp?.breadth_score ?? "..."}
          sub={mp ? `${mp.buy_count ?? 0}B / ${mp.avoid_count ?? 0}A` : ""}
        />
        <MetricCard
          label="Whale Events"
          value={mp?.whale_events_today ?? "..."}
        />
        <MetricCard
          label="Foreign Stance"
          value={mp?.foreign_stance?.replace(/_/g, " ") ?? "..."}
        />
        <MetricCard
          label="Timing Signal"
          value={mp?.market_timing_signal ?? "..."}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main composite table */}
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-semibold mb-3">Composite Leaderboard</h2>
          {composite.data ? (
            <DataTable
              data={composite.data.data ?? []}
              columns={compositeColumns}
              pageSize={25}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>

        {/* Right side: alerts + top signals */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold mb-3">Active Alerts</h2>
            {alerts.data && alerts.data.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {alerts.data.slice(0, 10).map((a) => (
                  <div
                    key={a.stock_code}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] cursor-pointer"
                    onClick={() => router.push(`/stock/${a.stock_code}`)}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.badge_color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400">{a.stock_code}</span>
                        <span className="text-[10px] text-[var(--color-text-muted)]">{a.active_alerts}</span>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-muted)] truncate">{a.top_notification}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold">{a.composite_score?.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-[var(--color-text-muted)] py-8 text-xs">No active alerts</div>
            )}
          </div>

          {/* Top 3 stocks gauge */}
          {composite.data?.data?.slice(0, 3).map((s: CompositeStock) => (
            <div key={s.stock_code} className="card flex items-center gap-4 cursor-pointer" onClick={() => router.push(`/stock/${s.stock_code}`)}>
              <ScoreGauge score={s.composite_score} size="sm" />
              <div>
                <span className="text-sm font-bold text-blue-400">{s.stock_code}</span>
                <p className="text-xs text-[var(--color-text-muted)]">{s.sector}</p>
                <p className="text-xs">{formatPercent(s.change_percent)} | 5D: {formatPercent(s.return_5d)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
