"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent } from "@/lib/utils";
import { TIER_COLORS } from "@/lib/constants";
import { fetchApi } from "@/lib/api";
import type { ScreenerStock } from "@/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily Trigger" },
  { key: "ksei", label: "KSEI Confirmed" },
  { key: "conviction", label: "Conviction" },
  { key: "stealth", label: "Stealth" },
];

const colHelper = createColumnHelper<ScreenerStock>();

const columns = [
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
      return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "20", color }}>{t?.replace(/_/g, " ")}</span>;
    },
  }),
  colHelper.accessor("close", { header: "Close", cell: (r) => r.getValue()?.toLocaleString() }),
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
  colHelper.accessor("return_20d", {
    header: "20D",
    cell: (r) => {
      const v = r.getValue();
      return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{formatPercent(v)}</span>;
    },
  }),
  colHelper.accessor("sector", { header: "Sector", cell: (r) => r.getValue() }),
  colHelper.accessor("foreign_score", { header: "Foreign", cell: (r) => r.getValue() }),
  colHelper.accessor("broker_score", { header: "Broker", cell: (r) => r.getValue() }),
  colHelper.accessor("ksei_score", { header: "KSEI", cell: (r) => r.getValue() }),
  colHelper.accessor("whale_score", { header: "Whale", cell: (r) => r.getValue() }),
  colHelper.accessor("stealth_quality", {
    header: "Stealth",
    cell: (r) => {
      const v = r.getValue();
      if (!v) return <span className="text-[var(--color-text-muted)]">—</span>;
      const color = v === "CONFIRMED_TRIPLE" ? "#22c55e" : v === "HIGH" ? "#84cc16" : "#eab308";
      return <span style={{ color }} className="text-[11px]">{v}</span>;
    },
  }),
];

export default function ScreenerPage() {
  const router = useRouter();
  const [tab, setTab] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["screener", tab],
    queryFn: () => fetchApi<{ data: ScreenerStock[] }>("/api/screener", { type: tab, pageSize: 100 }),
  });

  return (
    <div className="p-6 space-y-4 max-w-[1600px]">
      <PageHeader title="Screener" subtitle="Multi-source filtered stock discovery" />

      <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${tab === t.key ? "bg-blue-600/20 text-blue-400" : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading ? (
          <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        ) : (
          <DataTable
            data={data?.data ?? []}
            columns={columns}
            pageSize={50}
            onRowClick={(row) => router.push(`/stock/${row.stock_code}`)}
          />
        )}
      </div>
    </div>
  );
}
