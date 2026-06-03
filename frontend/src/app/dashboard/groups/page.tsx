"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent, formatMiliar } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { Layers, TrendingUp, TrendingDown } from "lucide-react";

const groupCol = createColumnHelper<any>();
const groupColumns = [
  groupCol.accessor("group_name", { header: "Group", cell: (r) => (
    <span className="font-semibold text-sm">{r.getValue()}</span>
  )}),
  groupCol.accessor("rotation_signal", { header: "Rotation", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "ENTERING" ? "#22c55e" : v === "PEAKING" ? "#eab308" : v === "ROTATING_OUT" ? "#ef4444" : "inherit";
    return <span style={{ color: c }} className="text-xs font-semibold">{v ?? "—"}</span>;
  }}),
  groupCol.accessor("avg_composite_score", { header: "Avg Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  groupCol.accessor("score_change_5d", { header: "5D Change", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}</span>;
  }}),
  groupCol.accessor("foreign_net_5d_miliar", { header: "Foreign 5D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
  }}),
  groupCol.accessor("stock_count", { header: "Stocks", cell: (r) => (
    <span className="text-xs text-[var(--color-text-muted)]">{r.getValue()}</span>
  )}),
];

const sectorCol = createColumnHelper<any>();
const sectorColumns = [
  sectorCol.accessor("sector", { header: "Sector", cell: (r) => (
    <span className="font-semibold text-sm">{r.getValue()}</span>
  )}),
  sectorCol.accessor("rotation_signal", { header: "Rotation", cell: (r) => {
    const v = r.getValue() as string;
    const isInflow = v === "NEW_ROTATION_IN" || v === "CONSISTENT_INFLOW";
    const c = isInflow ? "#22c55e" : v === "ROTATING_OUT" ? "#ef4444" : "inherit";
    return <span style={{ color: c }} className="text-xs font-semibold">{v?.replace(/_/g, " ") ?? "—"}</span>;
  }}),
  sectorCol.accessor("foreign_5d", { header: "Foreign 5D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(0)}M</span>;
  }}),
  sectorCol.accessor("foreign_20d", { header: "Foreign 20D", cell: (r) => {
    const v = Number(r.getValue() ?? 0);
    return <span className={v >= 0 ? "text-green-400" : "text-red-400"}>{v >= 0 ? "+" : ""}{v.toFixed(0)}M</span>;
  }}),
  sectorCol.accessor("avg_composite_score", { header: "Avg Score", cell: (r) => (
    <span className="font-bold">{r.getValue()?.toFixed(0)}</span>
  )}),
  sectorCol.accessor("top_stock", { header: "Top Stock", cell: (r) => (
    <span className="text-blue-400 text-xs">{r.getValue()}</span>
  )}),
  sectorCol.accessor("leadership_status", { header: "Status", cell: (r) => {
    const v = r.getValue() as string;
    const c = v === "LEADER" ? "#22c55e" : v === "LAGGARD" ? "#ef4444" : "#eab308";
    return <span style={{ color: c }} className="text-xs font-semibold">{v}</span>;
  }}),
];

export default function GroupsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"groups" | "sectors">("groups");

  const groups = useQuery({
    queryKey: ["group-momentum"],
    queryFn: () => fetchApi("/api/group-momentum"),
  });

  const sectors = useQuery({
    queryKey: ["sector-rotation"],
    queryFn: () => fetchApi("/api/sector-rotation"),
  });

  const enteringCount = (groups.data as any[])?.filter((r: any) => r.rotation_signal === "ENTERING")?.length ?? 0;
  const rotatingOutCount = (groups.data as any[])?.filter((r: any) => r.rotation_signal === "ROTATING_OUT")?.length ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <PageHeader title="Group & Sector Analysis" subtitle="92 Konglomerat groups · 11 Sectors · multi-period rotation matrix" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Groups" value="92" sub="Konglomerat groups tracked" />
        <MetricCard label="Entering Rotation" value={enteringCount} trend="up" sub="Groups gaining momentum" />
        <MetricCard label="Rotating Out" value={rotatingOutCount} trend="down" sub="Groups losing steam" />
        <MetricCard label="Sectors" value="11" sub="IDX sector classification" />
      </div>

      <div className="flex gap-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-1 w-fit">
        {[
          { key: "groups", label: "Group Rotation" },
          { key: "sectors", label: "Sector Analysis" },
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

      {tab === "groups" && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Layers size={18} className="text-blue-400" />
            <h2 className="text-sm font-semibold">92-Group Rotation Matrix</h2>
            <span className="text-[10px] text-[var(--color-text-muted)]">ENTERING = money flowing in, PEAKING = score high but flattening, ROTATING_OUT = capital exiting</span>
          </div>
          {groups.data ? (
            <DataTable
              data={groups.data as any[]}
              columns={groupColumns}
              pageSize={50}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      )}

      {tab === "sectors" && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-green-400" />
            <h2 className="text-sm font-semibold">Sector Comparative Performance</h2>
            <span className="text-[10px] text-[var(--color-text-muted)]">LEADER vs LAGGARD vs market benchmark</span>
          </div>
          {sectors.data ? (
            <DataTable
              data={sectors.data as any[]}
              columns={sectorColumns}
              pageSize={20}
            />
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
          )}
        </div>
      )}
    </div>
  );
}
