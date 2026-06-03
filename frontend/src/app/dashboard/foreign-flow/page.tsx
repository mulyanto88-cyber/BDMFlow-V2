"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { TierBadge } from "@/components/TierBadge";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent, formatMiliar } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { TIER_COLORS } from "@/lib/constants";
import { TrendingUp, TrendingDown, ArrowRightLeft, DollarSign, BarChart3 } from "lucide-react";

const WINDOWS = [
  { key: "1d", label: "1 Day" },
  { key: "5d", label: "5 Days" },
  { key: "20d", label: "20 Days" },
  { key: "60d", label: "60 Days" },
];

const flowCol = createColumnHelper<any>();
const flowColumns = [
  flowCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  flowCol.accessor("net_flow", { header: "Net Flow", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={`font-bold ${v >= 0 ? "text-green-400" : "text-red-400"}`}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  flowCol.accessor("composite_score", { header: "Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  flowCol.accessor("composite_tier", { header: "Signal", cell: (r) => <TierBadge tier={r.getValue()} /> }),
  flowCol.accessor("close", { header: "Close", cell: (r) => r.getValue()?.toLocaleString() }),
  flowCol.accessor("change_percent", { header: "Chg%", cell: (r) => (
    <span className={r.getValue() >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(r.getValue())}</span>
  )}),
  flowCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

const reversalCol = createColumnHelper<any>();
const reversalColumns = [
  reversalCol.accessor("stock_code", { header: "Stock", cell: (r) => (
    <span className="font-semibold text-blue-400">{r.getValue()}</span>
  )}),
  reversalCol.accessor("reversal_type", { header: "Type", cell: (r) => {
    const v = r.getValue() as string;
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${v === "REVERSAL_BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{v.replace("REVERSAL_", "")}</span>;
  }}),
  reversalCol.accessor("net_foreign_5d_miliar", { header: "Net 5D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  reversalCol.accessor("net_foreign_20d_miliar", { header: "Net 20D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  reversalCol.accessor("composite_score", { header: "Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  reversalCol.accessor("severity", { header: "Severity", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "HIGH" ? "#f97316" : v === "MEDIUM" ? "#eab308" : "inherit";
    return <span style={{ color: c }} className="text-xs font-semibold">{v}</span>;
  }}),
  reversalCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

export default function ForeignFlowPage() {
  const router = useRouter();
  const [window, setWindow] = useState("5d");

  const inflow = useQuery({
    queryKey: ["ff-inflow", window],
    queryFn: () => fetchApi("/api/foreign-flow/top-inflow", { window }),
  });

  const outflow = useQuery({
    queryKey: ["ff-outflow", window],
    queryFn: () => fetchApi("/api/foreign-flow/top-outflow", { window }),
  });

  const reversals = useQuery({
    queryKey: ["ff-reversals"],
    queryFn: () => fetchApi("/api/foreign-flow/reversals"),
  });

  const sectors = useQuery({
    queryKey: ["sector-rotation"],
    queryFn: () => fetchApi("/api/sector-rotation"),
  });

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader title="Foreign Flow Dashboard" subtitle="International capital movement across IDX — by stock, sector, and timeframe" />

      <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        {WINDOWS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWindow(w.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${window === w.key ? "bg-blue-600/20 text-blue-400" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Inflow */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-green-400" />
            <h2 className="text-sm font-semibold">Top Inflow ({window.toUpperCase()})</h2>
          </div>
          {inflow.data ? (
            <DataTable
              data={inflow.data as any[]}
              columns={flowColumns}
              pageSize={10}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>

        {/* Top Outflow */}
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={18} className="text-red-400" />
            <h2 className="text-sm font-semibold">Top Outflow ({window.toUpperCase()})</h2>
          </div>
          {outflow.data ? (
            <DataTable
              data={outflow.data as any[]}
              columns={flowColumns}
              pageSize={10}
              onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      </div>

      {/* Sector Rotation */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={18} className="text-blue-400" />
          <h2 className="text-sm font-semibold">Sector Rotation</h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">Where foreign money is rotating</span>
        </div>
        {sectors.data && (sectors.data as any[]).length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {(sectors.data as any[]).map((s: any) => {
              const flow5d = Number(s.foreign_5d ?? 0);
              const isInflow = s.rotation_signal === "NEW_ROTATION_IN" || flow5d > 0;
              return (
                <div
                  key={s.sector}
                  className="card flex-1 min-w-[140px] max-w-[200px] cursor-pointer hover:border-blue-500/30 transition-colors"
                  style={{ padding: "0.75rem" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold">{s.sector}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isInflow ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {s.rotation_signal?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--color-text-muted)]">5D Flow</span>
                      <span className={flow5d >= 0 ? "text-green-400" : "text-red-400"}>{flow5d >= 0 ? "+" : ""}{flow5d.toFixed(0)}M</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--color-text-muted)]">Avg Score</span>
                      <span>{s.avg_composite_score?.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[var(--color-text-muted)]">Leader</span>
                      <span className="text-blue-400">{s.top_stock}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-8">Loading...</div>
        )}
      </div>

      {/* Reversal Alerts */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <ArrowRightLeft size={18} className="text-amber-400" />
          <h2 className="text-sm font-semibold">Foreign Reversal Alerts</h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">Stocks where foreign direction is flipping</span>
        </div>
        {reversals.data ? (
          <DataTable
            data={reversals.data as any[]}
            columns={reversalColumns}
            pageSize={15}
            onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
          />
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        )}
      </div>
    </div>
  );
}
