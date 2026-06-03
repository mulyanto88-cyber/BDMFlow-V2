"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { TierBadge } from "@/components/TierBadge";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent, formatMiliar, daysAgo } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { Shield, Users, TrendingUp, AlertTriangle } from "lucide-react";

const feedCol = createColumnHelper<any>();
const feedColumns = [
  feedCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  feedCol.accessor("insider_name", { header: "Insider", cell: (r) => (
    <span className="text-xs">{r.getValue()}</span>
  )}),
  feedCol.accessor("role_label", { header: "Role", cell: (r) => {
    const v = r.getValue() as string;
    const isPengendali = v?.includes("Pengendali");
    return <span className={`text-[10px] font-semibold ${isPengendali ? "text-amber-400" : "text-[var(--color-text-muted)]"}`}>{v}</span>;
  }}),
  feedCol.accessor("action_type", { header: "Action", cell: (r) => {
    const v = r.getValue() as string;
    return <span className={`text-xs font-bold ${v === "BUY" ? "text-green-400" : "text-red-400"}`}>{v}</span>;
  }}),
  feedCol.accessor("pct_change", { header: "Chg%", cell: (r) => (
    <span className="text-xs">{r.getValue()?.toFixed(2)}%</span>
  )}),
  feedCol.accessor("est_value_idr", { header: "Value", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className="text-xs">{(v / 1e9).toFixed(1)}B</span>;
  }}),
  feedCol.accessor("conviction_tier", { header: "Conviction", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "HIGH" ? "#22c55e" : v === "MEDIUM" ? "#eab308" : "var(--color-text-muted)";
    return <span style={{ color: c }} className="text-xs font-semibold">{v}</span>;
  }}),
  feedCol.accessor("days_ago", { header: "Days Ago", cell: (r) => (
    <span className="text-[var(--color-text-muted)]">{r.getValue()}d</span>
  )}),
  feedCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-[10px] text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

const clusterCol = createColumnHelper<any>();
const clusterColumns = [
  clusterCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  clusterCol.accessor("cluster_type", { header: "Cluster", cell: (r) => {
    const v = r.getValue() as string;
    const isBuy = v === "CLUSTER_BUY";
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBuy ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{v?.replace("CLUSTER_", "")}</span>;
  }}),
  clusterCol.accessor("buyer_count", { header: "Buyers", cell: (r) => (
    <span className="text-green-400 font-bold">{r.getValue()}</span>
  )}),
  clusterCol.accessor("unique_roles", { header: "Roles", cell: (r) => (
    <span className="text-xs">{r.getValue()}</span>
  )}),
  clusterCol.accessor("est_total_value_miliar", { header: "Total Value", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className="text-xs">{(v / 1e3).toFixed(1)}B</span>;
  }}),
  clusterCol.accessor("cluster_start_date", { header: "From", cell: (r) => (
    <span className="text-[10px] text-[var(--color-text-muted)]">{r.getValue()?.slice(0, 10)}</span>
  )}),
];

const leaderCol = createColumnHelper<any>();
const leaderColumns = [
  leaderCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  leaderCol.accessor("conviction_tier", { header: "Conviction", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "HIGH" ? "#22c55e" : "#eab308";
    return <span style={{ color: c }} className="text-xs font-bold">{v}</span>;
  }}),
  leaderCol.accessor("pengendali_buy_30d", { header: "Pengendali Buy", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return v > 0 ? <span className="text-amber-400 font-bold text-xs">YES ({v})</span> : <span className="text-[var(--color-text-muted)]">—</span>;
  }}),
  leaderCol.accessor("is_cluster_buy", { header: "Cluster", cell: (r) => (
    r.getValue() ? <Users size={14} className="text-green-400" /> : <span className="text-[var(--color-text-muted)]">—</span>
  )}),
  leaderCol.accessor("buy_count_30d", { header: "Buy Count", cell: (r) => (
    <span className="text-green-400 font-bold">{r.getValue()}</span>
  )}),
  leaderCol.accessor("buy_value_7d_miliar", { header: "Value 7D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className="text-xs">{(v / 1e3).toFixed(1)}B</span>;
  }}),
  leaderCol.accessor("last_tx_date", { header: "Last Tx", cell: (r) => (
    <span className="text-[10px] text-[var(--color-text-muted)]">{daysAgo(r.getValue())}d ago</span>
  )}),
  leaderCol.accessor("composite_score", { header: "Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  leaderCol.accessor("composite_tier", { header: "Signal", cell: (r) => <TierBadge tier={r.getValue()} /> }),
  leaderCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-[10px] text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

export default function InsiderPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"feed" | "clusters" | "leaderboard">("feed");

  const feed = useQuery({
    queryKey: ["insider-feed"],
    queryFn: () => fetchApi("/api/insider/feed"),
    refetchInterval: 300000,
  });

  const clusters = useQuery({
    queryKey: ["insider-clusters"],
    queryFn: () => fetchApi("/api/insider/clusters"),
  });

  const leaderboard = useQuery({
    queryKey: ["insider-leaderboard"],
    queryFn: () => fetchApi("/api/insider/leaderboard"),
  });

  const buyCount = (feed.data as any[])?.filter((r: any) => r.action_type === "BUY")?.length ?? 0;
  const sellCount = (feed.data as any[])?.filter((r: any) => r.action_type === "SELL")?.length ?? 0;
  const pengendaliCount = (leaderboard.data as any[])?.filter((r: any) => (r.pengendali_buy_30d ?? 0) > 0)?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader title="Insider Intelligence" subtitle="Director, Commissioner & Controlling Shareholder transactions — the ultimate conviction signal" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Transactions (30D)" value={(feed.data as any[])?.length ?? "..."} sub={`${buyCount} buy / ${sellCount} sell`} />
        <MetricCard label="Pengendali Buying" value={pengendaliCount} sub="Controlling shareholders" trend="up" />
        <MetricCard label="Cluster Buys (60D)" value={(clusters.data as any[])?.filter((r: any) => r.cluster_type === "CLUSTER_BUY")?.length ?? "..."} sub="≥2 insiders same stock" />
        <MetricCard label="Highest Conviction" value={(leaderboard.data as any[])?.filter((r: any) => r.conviction_tier === "HIGH")?.length ?? "..."} sub="HIGH tier signals" />
      </div>

      <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        {[
          { key: "feed", label: "Live Feed" },
          { key: "clusters", label: "Cluster Detection" },
          { key: "leaderboard", label: "Conviction Leaderboard" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === t.key ? "bg-blue-600/20 text-blue-400" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "feed" && (
        <div className="card">
          <h2 className="text-sm font-semibold mb-3">Live Insider Feed (Last 30 Days)</h2>
          {feed.data ? (
            <DataTable
              data={feed.data as any[]}
              columns={feedColumns}
              pageSize={25}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      )}

      {tab === "clusters" && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-green-400" />
            <h2 className="text-sm font-semibold">Insider Cluster Detection</h2>
            <span className="text-[10px] text-[var(--color-text-muted)]">≥2 insiders buying same stock within 14 days = powerful confirmation</span>
          </div>
          {clusters.data ? (
            <DataTable
              data={clusters.data as any[]}
              columns={clusterColumns}
              pageSize={20}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      )}

      {tab === "leaderboard" && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-amber-400" />
            <h2 className="text-sm font-semibold">Conviction Score Leaderboard</h2>
            <span className="text-[10px] text-[var(--color-text-muted)]">Ranked by insider conviction — Pengendali buys carry highest weight</span>
          </div>
          {leaderboard.data ? (
            <DataTable
              data={leaderboard.data as any[]}
              columns={leaderColumns}
              pageSize={20}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      )}
    </div>
  );
}
