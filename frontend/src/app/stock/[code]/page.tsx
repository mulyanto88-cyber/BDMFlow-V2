"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ScoreGauge } from "@/components/ScoreGauge";
import { MetricCard } from "@/components/MetricCard";
import { DataTable } from "@/components/DataTable";
import { StockChart } from "@/components/StockChart";
import { createColumnHelper } from "@tanstack/react-table";
import { formatPercent } from "@/lib/utils";
import { fetchApi } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import {
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, Legend,
} from "recharts";
import type { DeepDivePrice, DeepDiveSummary } from "@/types";

export default function StockAnalyzerPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const summary = useQuery<DeepDiveSummary | null>({
    queryKey: ["deepdive-summary", code],
    queryFn: () => fetchApi<DeepDiveSummary | null>("/api/deepdive/summary", { stock_code: code }),
    enabled: !!code,
  });

  const priceHistory = useQuery<DeepDivePrice[]>({
    queryKey: ["deepdive-price", code],
    queryFn: () => fetchApi<DeepDivePrice[]>("/api/deepdive/price", { stock_code: code, days: 90 }),
    enabled: !!code,
  });

  const brokerData = useQuery({
    queryKey: ["deepdive-broker", code],
    queryFn: () => fetchApi("/api/deepdive/broker", { stock_code: code }),
    enabled: !!code,
  });

  const kseiData = useQuery({
    queryKey: ["deepdive-ksei", code],
    queryFn: () => fetchApi("/api/deepdive/ksei", { stock_code: code }),
    enabled: !!code,
  });

  const insiderData = useQuery({
    queryKey: ["deepdive-insider", code],
    queryFn: () => fetchApi("/api/deepdive/insider", { stock_code: code }),
    enabled: !!code,
  });

  const s = summary.data;
  const prices = priceHistory.data ?? [];

  const chartData = prices.map((p) => ({
    time: p.trading_date?.slice(0, 10) ?? "",
    open: Number(p.open ?? 0),
    high: Number(p.high ?? 0),
    low: Number(p.low ?? 0),
    close: Number(p.close ?? 0),
    volume: Number(p.volume ?? 0),
    foreign: p.net_foreign_1d != null ? Number(p.net_foreign_1d) / 1e9 : 0,
    vwma: 0,
    compositeScore: Number(p.composite_score ?? 0),
  }));

  const chartDataSorted = chartData.filter((d) => d.time).sort((a, b) => b.time.localeCompare(a.time));

  const brokerCols = createColumnHelper<any>();
  const brokerColumns = [
    brokerCols.accessor("broker_name", { header: "Broker", cell: (r) => (
      <span className="text-xs">{r.getValue()}</span>
    )}),
    brokerCols.accessor("category", { header: "Type", cell: (r) => (
      <span className="text-[10px] text-[var(--color-text-muted)]">{r.getValue()}</span>
    )}),
    brokerCols.accessor("net_5d_miliar", {
      header: "Net 5D",
      cell: (r) => {
        const v = Number(r.getValue() ?? 0);
        return <span className={v >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
      },
    }),
    brokerCols.accessor("net_20d_miliar", {
      header: "Net 20D",
      cell: (r) => {
        const v = Number(r.getValue() ?? 0);
        return <span className={v >= 0 ? "text-green-400 text-xs" : "text-red-400 text-xs"}>{v >= 0 ? "+" : ""}{v.toFixed(1)}M</span>;
      },
    }),
    brokerCols.accessor("action", {
      header: "Action",
      cell: (r) => {
        const v = r.getValue() as string;
        const isBuy = v === "NET_BUY";
        return <span className={`text-[10px] font-semibold ${isBuy ? "text-green-400" : "text-red-400"}`}>{v}</span>;
      },
    }),
  ];

  if (summary.isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-[var(--color-text-muted)] py-20">Loading {code}...</div>
      </div>
    );
  }

  if (!s) {
    return (
      <div className="p-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-blue-400 mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="text-center text-[var(--color-text-muted)] py-20">Stock {code} not found</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px]">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-blue-400">
        <ArrowLeft size={16} /> Back
      </button>

      <PageHeader title={code}>
        <ScoreGauge score={s.composite_score} size="lg" label={s.composite_tier?.replace(/_/g, " ")} />
      </PageHeader>

      <p className="text-sm text-[var(--color-text-muted)]">{s.sector} / {s.group_name}</p>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard label="Price" value={s.close?.toLocaleString()} sub={formatPercent(s.change_percent)} trend={s.change_percent >= 0 ? "up" : "down"} />
        <MetricCard label="Return 5D" value={formatPercent(s.return_5d)} trend={s.return_5d >= 0 ? "up" : "down"} />
        <MetricCard label="Return 20D" value={formatPercent(s.return_20d)} trend={s.return_20d >= 0 ? "up" : "down"} />
        <MetricCard label="Return 60D" value={formatPercent(s.return_60d)} trend={s.return_60d >= 0 ? "up" : "down"} />
        <MetricCard label="Foreign Score" value={s.foreign_score} />
        <MetricCard label="Broker Score" value={s.broker_score} />
      </div>

      {/* Score breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-2">Score Breakdown</h3>
        <div className="flex gap-4 text-xs text-[var(--color-text-muted)]">
          {[
            { label: "Foreign", score: s.foreign_score, max: 25 },
            { label: "Broker", score: s.broker_score, max: 30 },
            { label: "Whale", score: s.whale_score, max: 15 },
            { label: "Price", score: s.price_score ?? 0, max: 5 },
            { label: "KSEI", score: s.ksei_score, max: 25 },
            { label: "Insider", score: s.insider_score, max: 15 },
          ].map((item) => (
            <div key={item.label} className="flex-1 space-y-1">
              <span>{item.label}</span>
              <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${((item.score ?? 0) / item.max) * 100}%` }} />
              </div>
              <span className="font-mono text-[11px]">{item.score ?? 0}/{item.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price + Foreign Flow Chart */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">Price & Foreign Flow</h3>
        <StockChart data={chartDataSorted} height={500} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KSEI Ownership Trend */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">KSEI Ownership</h3>
          {kseiData.data && kseiData.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={[...(kseiData.data ?? [])].reverse().slice(-24).map((r: any) => ({
                month: r.Date?.slice(0, 7),
                smart: Number(r.smart_money_pct ?? 0),
                retail: Number(r.retail_pct ?? 0),
                foreign: Number(r.foreign_total_pct ?? 0),
                smChg: Number(r.sm_chg_miliar ?? 0) / 1e3,
              }))}>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--color-text-muted)" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="smart" stackId="1" stroke="#3b82f6" fill="#3b82f640" name="Smart Money %" />
                <Area type="monotone" dataKey="retail" stackId="1" stroke="#ef4444" fill="#ef444440" name="Retail %" />
                <Area type="monotone" dataKey="foreign" stackId="1" stroke="#22c55e" fill="#22c55e40" name="Foreign %" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12 text-xs">No KSEI data</div>
          )}
        </div>

        {/* Insider Timeline */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-3">Insider Activity</h3>
          {insiderData.data && insiderData.data.length > 0 ? (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {insiderData.data.slice(0, 15).map((ev: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg text-xs border border-[var(--color-border)]">
                  <span className={`w-2 h-2 rounded-full ${ev.action_type === "BUY" ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex-1">
                    <p className="font-medium">{ev.insider_name}</p>
                    <p className="text-[var(--color-text-muted)]">{ev.role_label} · {ev.transaction_date?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className={ev.action_type === "BUY" ? "text-green-400" : "text-red-400"}>{ev.action_type} {ev.pct_change?.toFixed(2)}%</p>
                    <p className="text-[10px] text-[var(--color-text-muted)]">{ev.conviction_tier}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[var(--color-text-muted)] py-12 text-xs">No insider activity</div>
          )}
        </div>
      </div>

      {/* Broker Breakdown Table */}
      <div className="card">
        <h3 className="text-sm font-semibold mb-3">Broker Flow</h3>
        {brokerData.data ? (
          <DataTable data={brokerData.data} columns={brokerColumns} pageSize={15} />
        ) : (
          <div className="text-center text-[var(--color-text-muted)] py-12">Loading...</div>
        )}
      </div>
    </div>
  );
}
