"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { TierBadge } from "@/components/TierBadge";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent, formatMiliar } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { TIER_COLORS } from "@/lib/constants";
import { TrendingUp, Users, Shield, Star, ArrowUpRight } from "lucide-react";

const leaderCol = createColumnHelper<any>();
const leaderColumns = [
  leaderCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400 cursor-pointer hover:underline">{r.getValue()}</span>
  )}),
  leaderCol.accessor("broker_score", { header: "Bandar Score", cell: (r) => (
    <span className="font-bold text-amber-400">{r.getValue()}</span>
  )}),
  leaderCol.accessor("composite_score", { header: "Composite", cell: (r) => {
    const s = r.getValue();
    const c = s >= 80 ? TIER_COLORS.STRONG_BUY : s >= 65 ? TIER_COLORS.BUY : s >= 50 ? TIER_COLORS.ACCUMULATE : "inherit";
    return <span style={{ color: c }} className="font-bold">{s?.toFixed(0)}</span>;
  }}),
  leaderCol.accessor("composite_tier", { header: "Signal", cell: (r) => <TierBadge tier={r.getValue()} /> }),
  leaderCol.accessor("prime_net_5d", { header: "Prime Net 5D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  leaderCol.accessor("convergence_level", { header: "Convergence", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "STRONG" ? "#22c55e" : v === "MODERATE" ? "#eab308" : "var(--color-text-muted)";
    return <span style={{ color: c }} className="text-xs font-semibold">{v ?? "—"}</span>;
  }}),
  leaderCol.accessor("close", { header: "Close", cell: (r) => r.getValue()?.toLocaleString() }),
  leaderCol.accessor("change_percent", { header: "Chg%", cell: (r) => (
    <span className={r.getValue() >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(r.getValue())}</span>
  )}),
  leaderCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

const primeCol = createColumnHelper<any>();
const primeColumns = [
  primeCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400 cursor-pointer hover:underline">{r.getValue()}</span>
  )}),
  primeCol.accessor("prime_buyers_5d", { header: "Prime Buyers", cell: (r) => (
    <div className="flex items-center gap-1">
      <Users size={14} className="text-blue-400" />
      <span className="font-bold">{r.getValue()}</span>
    </div>
  )}),
  primeCol.accessor("prime_net_5d", { header: "Prime Net 5D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  primeCol.accessor("prime_lead_signal", { header: "Lead Signal", cell: (r) => {
    const v = r.getValue() as string;
    const isLeading = v === "PRIME_LEADING";
    return (
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isLeading ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}>
        {v?.replace(/_/g, " ") ?? "—"}
      </span>
    );
  }}),
  primeCol.accessor("prime_conviction", { header: "Conviction", cell: (r) => {
    const v = r.getValue() as string;
    return <span className={`text-xs font-semibold ${v === "HIGH" ? "text-green-400" : "text-[var(--color-text-muted)]"}`}>{v ?? "—"}</span>;
  }}),
  primeCol.accessor("composite_score", { header: "Score", cell: (r) => {
    const s = r.getValue();
    const c = s >= 80 ? TIER_COLORS.STRONG_BUY : s >= 65 ? TIER_COLORS.BUY : "inherit";
    return <span style={{ color: c }} className="font-bold">{s?.toFixed(0)}</span>;
  }}),
  primeCol.accessor("close", { header: "Close", cell: (r) => r.getValue()?.toLocaleString() }),
  primeCol.accessor("return_5d", { header: "5D%", cell: (r) => (
    <span className={r.getValue() >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(r.getValue())}</span>
  )}),
];

const convCol = createColumnHelper<any>();
const convColumns = [
  convCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400 cursor-pointer hover:underline">{r.getValue()}</span>
  )}),
  convCol.accessor("foreign_buyers_count", { header: "Foreign Buyers", cell: (r) => (
    <span className="font-bold text-green-400">{r.getValue()}</span>
  )}),
  convCol.accessor("inst_buyers_count", { header: "Inst Buyers", cell: (r) => (
    <span className="text-blue-400">{r.getValue()}</span>
  )}),
  convCol.accessor("convergence_level", { header: "Level", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "STRONG" ? "#22c55e" : "#eab308";
    return <span style={{ color: c }} className="font-bold text-xs">{v}</span>;
  }}),
  convCol.accessor("foreign_net_5d", { header: "Foreign Net 5D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  convCol.accessor("composite_score", { header: "Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  convCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

export default function BandarmologiPage() {
  const router = useRouter();

  const leaderboard = useQuery({
    queryKey: ["bandar-leaderboard"],
    queryFn: () => fetchApi("/api/bandarmologi/leaderboard"),
  });

  const primeBrokers = useQuery({
    queryKey: ["bandar-prime"],
    queryFn: () => fetchApi("/api/bandarmologi/prime-brokers"),
  });

  const convergence = useQuery({
    queryKey: ["bandar-convergence"],
    queryFn: () => fetchApi("/api/bandarmologi/convergence"),
  });

  const primeCount = (primeBrokers.data as any[])?.filter((r: any) => r.prime_lead_signal === "PRIME_LEADING")?.length ?? 0;
  const strongConv = (convergence.data as any[])?.filter((r: any) => r.convergence_level === "STRONG")?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader title="Bandarmologi Panel" subtitle="Prime broker tracker · broker convergence · bandar score leaderboard" />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Prime Leading" value={primeCount} sub="Stocks with prime broker front-running" trend="up" />
        <MetricCard label="Strong Convergence" value={strongConv} sub="≥3 foreign brokers buying" trend="up" />
        <MetricCard label="Bandar Signals" value={leaderboard.data ? (leaderboard.data as any[]).length : "..."} sub="Top 30 by broker score" />
        <MetricCard label="Active Prime Brokers" value="8" sub="RX KZ BB BK GW AK ZP DP" />
      </div>

      {/* Prime Broker Tracker */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Star size={18} className="text-amber-400" />
          <h2 className="text-sm font-semibold">Prime Broker Tracker</h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">What RX, KZ, BB, BK, GW, AK, ZP, DP are buying this week</span>
        </div>
        {primeBrokers.data ? (
          <DataTable
            data={primeBrokers.data as any[]}
            columns={primeColumns}
            pageSize={15}
            onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
          />
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broker Convergence Map */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-blue-400" />
            <h2 className="text-sm font-semibold">Broker Convergence Map</h2>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mb-3">
            Multiple brokers clustering on same stock = higher conviction signal. STRONG = ≥3 foreign brokers buying simultaneously.
          </p>
          {convergence.data ? (
            <DataTable
              data={convergence.data as any[]}
              columns={convColumns}
              pageSize={15}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>

        {/* Bandar Score Leaderboard */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-amber-400" />
            <h2 className="text-sm font-semibold">Bandar Score Leaderboard</h2>
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] mb-3">
            Ranked by broker score — measure institutional positioning quality across all sources.
          </p>
          {leaderboard.data ? (
            <DataTable
              data={leaderboard.data as any[]}
              columns={leaderColumns}
              pageSize={10}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
}
