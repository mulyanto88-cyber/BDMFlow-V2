"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { TierBadge } from "@/components/TierBadge";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent, formatMiliar } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { TIER_COLORS } from "@/lib/constants";
import { Building2, TrendingUp, ArrowRightLeft, ShieldAlert } from "lucide-react";

const accumCol = createColumnHelper<any>();
const accumColumns = [
  accumCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  accumCol.accessor("sm_entry_type", { header: "Entry Type", cell: (r) => {
    const v = r.getValue() as string;
    const c = v?.includes("3M") ? "#22c55e" : v?.includes("2M") ? "#84cc16" : "#eab308";
    return <span style={{ color: c }} className="text-xs font-semibold">{v?.replace(/_/g, " ") ?? "—"}</span>;
  }}),
  accumCol.accessor("signal_quality", { header: "Quality", cell: (r) => {
    const v = r.getValue() as string;
    return <span className={`text-xs font-semibold ${v === "PREMIUM" ? "text-amber-400" : "text-[var(--color-text-muted)]"}`}>{v ?? "—"}</span>;
  }}),
  accumCol.accessor("smart_money_miliar", { header: "Smart Money", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className="text-green-400">{v >= 0 ? "+" : ""}{v.toFixed(0)}M</span>;
  }}),
  accumCol.accessor("sm_3m_cumulative_miliar", { header: "3M Cumul", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(0)}M</span>;
  }}),
  accumCol.accessor("ksei_score", { header: "KSEI Score", cell: (r) => (
    <span className="font-bold text-blue-400">{r.getValue()}</span>
  )}),
  accumCol.accessor("composite_score", { header: "Composite", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  accumCol.accessor("composite_tier", { header: "Signal", cell: (r) => <TierBadge tier={r.getValue()} /> }),
  accumCol.accessor("close", { header: "Close", cell: (r) => r.getValue()?.toLocaleString() }),
  accumCol.accessor("return_20d", { header: "20D%", cell: (r) => (
    <span className={r.getValue() >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(r.getValue())}</span>
  )}),
  accumCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

const divCol = createColumnHelper<any>();
const divColumns = [
  divCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  divCol.accessor("smart_money_miliar", { header: "Smart Money", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v > 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(0)}M</span>;
  }}),
  divCol.accessor("retail_chg_miliar", { header: "Retail Chg", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v > 0 ? "text-red-400" : "text-green-400"}>{v >= 0 ? "+" : ""}{v.toFixed(0)}M</span>;
  }}),
  divCol.accessor("smart_retail_divergence", { header: "Divergence", cell: (r) => (
    <span className="text-xs font-semibold text-green-400">SMART ↑ / RETAIL ↓</span>
  )}),
  divCol.accessor("ksei_score", { header: "KSEI Score", cell: (r) => (
    <span className="font-bold text-blue-400">{r.getValue()}</span>
  )}),
  divCol.accessor("composite_score", { header: "Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  divCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

export default function KseiPage() {
  const router = useRouter();

  const accumulation = useQuery({
    queryKey: ["ksei-accum"],
    queryFn: () => fetchApi("/api/ksei/top-accumulation"),
  });

  const divergence = useQuery({
    queryKey: ["ksei-divergence"],
    queryFn: () => fetchApi("/api/ksei/divergence"),
  });

  const accCount = (accumulation.data as any[])?.length ?? 0;
  const divCount = (divergence.data as any[])?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader title="KSEI Institutional Tracker" subtitle="Monthly ownership changes across 18 investor types — smart money positioning ground truth" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Stocks Accumulating" value={accCount} sub="Smart money consistently positive" trend="up" />
        <MetricCard label="Smart/Retail Diverge" value={divCount} sub="Contrarian bullish signal" trend="up" />
        <MetricCard label="Investor Types" value="18" sub="9 Local + 9 Foreign categories" />
        <MetricCard label="History" value="44 months" sub="Sep 2022 – present" />
      </div>

      {/* Top Accumulation */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Building2 size={18} className="text-blue-400" />
          <h2 className="text-sm font-semibold">Top Institutional Accumulation</h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">Consistent smart money inflow — highest conviction KSEI signal</span>
        </div>
        {accumulation.data ? (
          <DataTable
            data={accumulation.data as any[]}
            columns={accumColumns}
            pageSize={20}
            onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
          />
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        )}
      </div>

      {/* Smart vs Retail Divergence */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft size={18} className="text-green-400" />
          <h2 className="text-sm font-semibold">Smart Money vs Retail Divergence</h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Most powerful contrarian signal — institutions accumulating while public distributing
          </span>
        </div>
        {divergence.data ? (
          <DataTable
            data={divergence.data as any[]}
            columns={divColumns}
            pageSize={15}
            onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
          />
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        )}
      </div>

      {/* Corp Action Warning */}
      <div className="card border-amber-500/30 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <ShieldAlert size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-amber-400">Corporate Action Filter Active</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Stocks flagged with off-market transactions (SUPA Apr 2026, TPIA Jan-Feb 2026, etc.) have their KSEI contribution nullified. 
              Composite scoring redistributes KSEI weight to daily components for affected months. 
              Tiered threshold: Large cap &gt;5T (15% mktcap), Mid cap 1-5T (12%), Small cap &lt;1T (7% &gt;5B absolute).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
