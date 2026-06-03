'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Building2, RefreshCw, TrendingUp, TrendingDown,
  Zap, RotateCcw, Target, ChevronDown, Star, Activity,
  DollarSign, BarChart3, Globe, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
  ComposedChart, Area, Line,
} from 'recharts'
import { formatRupiah } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GroupDaily {
  group_name: string
  total_stocks: number
  perf_1d: number
  perf_5d_avg: number
  perf_20d_avg: number
  perf_60d_avg: number
  value_1d_miliar: number
  avg_val_5d_miliar: number
  avg_val_20d_miliar: number
  foreign_net_1d_miliar: number
  foreign_net_5d_miliar: number
  foreign_net_20d_miliar: number
  foreign_net_60d_miliar: number
  whale_1d: number
  anomaly_1d: number
  momentum_state: string
  foreign_flow_trend: string
  rs_vs_market_1d: number
  composite_score: number
  market_phase: string
  group_action_signal: string
  ksei_conviction_score: number
  foreign_30d_miliar: number
  total_smart_miliar: number
  local_smart_miliar: number
  foreign_smart_miliar: number
  local_retail_miliar: number
  local_cp_miliar: number
  local_pf_miliar: number
  local_ib_miliar: number
  foreign_cp_miliar: number
  // foreign_pf_miliar REMOVED — kolom ini tidak ada di vw_group_phase_composite
  smart_money_trend: string
  divergence_signal: string
  konsisten_3_bulan: boolean
  institution_alignment: string
  broker_buy_pct: number
  broker_consensus: string
  broker_net_7d_miliar: number
  whale_count: number
  group_top_buyer: string
}

interface StockRow {
  stock_code: string
  sector: string
  close: number
  change_pct: number
  grp_avg_chg: number
  relative_perf: number
  whale_signal: boolean
  net_foreign_juta: number
  ksei_smart_miliar: number
  broker_net_7d_miliar: number
  stock_role: string
  catchup_conviction: string
  free_float: number
}

interface BrokerRow {
  broker_code: string
  broker_name: string
  net_7d_miliar: number
  net_30d_miliar: number
  stocks_7d: number
  rotation_signal: string
  buy_consensus_pct: number
  broker_consensus: string
}

interface KseiMonthly {
  bulan: string
  local_smart: number
  foreign_smart: number
  retail: number
}

interface GroupFlowDay {
  date: string
  net_foreign: number
  total_value: number
}

// ── API helper ────────────────────────────────────────────────────────────────

async function mdQuery(query: string, params?: any[]): Promise<any[]> {
  const res = await fetch('/api/motherduck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data || []
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const n = (v: any) => Number(v) || 0
const fmt = (v: number, d = 1) => `${v > 0 ? '+' : ''}${v.toFixed(d)}`
const fmtM = (v: number) => {
  const a = Math.abs(v)
  if (a >= 1000) return `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)} T`
  return `${v > 0 ? '+' : ''}${v.toFixed(0)} M`
}
const fmtT = (v: number) => `${v > 0 ? '+' : ''}${(v / 1000).toFixed(1)} T`

function numCls(v: number) {
  return v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'
}

function flowCls(v: number) {
  return v > 0 ? 'text-blue-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'
}

function phaseBadge(phase: string) {
  const map: Record<string, string> = {
    'MARKUP':       'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'EARLY MARKUP': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    'AKUMULASI':    'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    'SIDEWAYS':     'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'DISTRIBUSI':   'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'MARKDOWN':     'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return map[phase] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
}

function signalCls(signal: string) {
  if (signal?.includes('STRONG BUY')) return 'text-emerald-400'
  if (signal?.includes('BUY'))         return 'text-emerald-300'
  if (signal?.includes('WATCH'))       return 'text-amber-400'
  if (signal?.includes('AVOID'))       return 'text-orange-400'
  if (signal?.includes('EXIT'))        return 'text-red-400'
  return 'text-muted-foreground'
}

function ScoreDial({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-emerald-400 ring-emerald-400/40' :
    score >= 50 ? 'text-amber-400 ring-amber-400/40' :
    score >= 30 ? 'text-orange-400 ring-orange-400/40' :
                  'text-red-400 ring-red-400/40'
  return (
    <div className={`w-9 h-9 rounded-full ring-2 flex items-center justify-center font-black font-mono text-[11px] ${color}`}>
      {score}
    </div>
  )
}

function PhasePill({ phase }: { phase: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${phaseBadge(phase)}`}>
      {phase}
    </span>
  )
}

function Skeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="shimmer h-14 rounded-xl" />
      ))}
    </div>
  )
}

function FlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl p-3 text-xs border border-border/50 shadow-lg">
      <p className="font-bold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value > 0 ? '+' : ''}{Number(p.value).toFixed(0)} M
        </p>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 1: LEADERBOARD — daily market-first view
// ═══════════════════════════════════════════════════════════════════════════════

function TabLeaderboard({
  groups, onSelectGroup
}: {
  groups: GroupDaily[]
  onSelectGroup: (name: string) => void
}) {
  const [sort, setSort] = useState<keyof GroupDaily>('foreign_net_1d_miliar')

  const sorted = [...groups].sort((a, b) => n(b[sort]) - n(a[sort]))

  const inflow  = groups.filter(g => n(g.foreign_net_1d_miliar) > 0).length
  const outflow = groups.filter(g => n(g.foreign_net_1d_miliar) < 0).length
  const totalValue = groups.reduce((s, g) => s + n(g.value_1d_miliar), 0)

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Active Groups', value: groups.length, cls: '' },
          { label: 'Daily Value', value: `${(totalValue / 1000).toFixed(1)} T`, cls: 'text-blue-400' },
          { label: 'Inflow Today', value: `${inflow} grp`, cls: 'text-emerald-400' },
          { label: 'Outflow Today', value: `${outflow} grp`, cls: 'text-red-400' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="metric-card card-hover p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Sort pills */}
      <div className="panel flex flex-wrap gap-2 items-center">
        <span className="text-[10px] text-muted-foreground uppercase">Sort:</span>
        {([
          ['foreign_net_1d_miliar', 'Foreign 1D'],
          ['foreign_net_5d_miliar', 'Foreign 5D'],
          ['perf_1d', 'Perf 1D'],
          ['perf_20d_avg', 'Perf 1M'],
          ['value_1d_miliar', 'Value 1D'],
          ['composite_score', 'Score'],
        ] as [keyof GroupDaily, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setSort(k)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all border ${
              sort === k
                ? 'bg-gold-400/20 text-gold-400 border-gold-400/40'
                : 'text-muted-foreground border-border/30 hover:border-border'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/30 table-container">
        <table className="w-full text-xs cq-table">
          <thead>
            <tr className="border-b border-border/50 bg-card/30">
              {['Grup', 'Stk', 'Score', '1D%', 'Foreign 1D', 'Foreign 5D', 'Value 1D', 'Whale', 'Phase', 'Signal'].map(h => (
                <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap text-right first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g, i) => (
              <tr key={g.group_name}
                onClick={() => onSelectGroup(g.group_name)}
                className="tr-hover cursor-pointer">
                <td className="px-3 py-2.5 font-bold text-left" data-label="Grup">
                  <div className="flex items-center justify-end md:justify-start gap-2">
                    <div className={`w-1 h-6 rounded-full flex-shrink-0 ${flowCls(n(g.foreign_net_1d_miliar)).replace('text-', 'bg-')}`} />
                    <span className="truncate max-w-[160px]">{g.group_name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right text-muted-foreground" data-label="Stk">{g.total_stocks}</td>
                <td className="px-3 py-2.5 text-right" data-label="Score">
                  <div className="flex justify-end">
                    <ScoreDial score={n(g.composite_score)} />
                  </div>
                </td>
                <td className={`px-3 py-2.5 text-right font-mono font-bold ${numCls(n(g.perf_1d))}`} data-label="1D%">
                  {fmt(n(g.perf_1d))}%
                </td>
                <td className={`px-3 py-2.5 text-right font-mono font-bold ${flowCls(n(g.foreign_net_1d_miliar))}`} data-label="Foreign 1D">
                  {fmtM(n(g.foreign_net_1d_miliar))}
                </td>
                <td className={`px-3 py-2.5 text-right font-mono ${flowCls(n(g.foreign_net_5d_miliar))}`} data-label="Foreign 5D">
                  {fmtM(n(g.foreign_net_5d_miliar))}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-blue-300" data-label="Value 1D">
                  {n(g.value_1d_miliar).toFixed(0)} M
                </td>
                <td className={`px-3 py-2.5 text-right ${n(g.whale_1d) > 0 ? 'text-cyan-400' : 'text-muted-foreground'}`} data-label="Whale">
                  {n(g.whale_1d) > 0 ? `★ ${g.whale_1d}` : '—'}
                </td>
                <td className="px-3 py-2.5 text-right" data-label="Phase">
                  <PhasePill phase={g.market_phase} />
                </td>
                <td className={`px-3 py-2.5 text-right font-bold text-[10px] whitespace-nowrap ${signalCls(g.group_action_signal)}`} data-label="Signal">
                  {g.group_action_signal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Score = Momentum 35% · Foreign Flow 35% · Broker 15% · Whale 10% · KSEI 5% · Klik baris → Deep Dive
      </p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 2: FLOW MONITOR — daily foreign flow tracker per group
// ═══════════════════════════════════════════════════════════════════════════════

type FlowSortKey = 'foreign_net_1d_miliar' | 'foreign_net_5d_miliar' | 'value_1d_miliar' | 'perf_1d' | 'composite_score'

function SortTh({
  label, sortKey, current, onSort
}: {
  label: string
  sortKey: FlowSortKey
  current: { key: FlowSortKey; dir: 'asc' | 'desc' }
  onSort: (k: FlowSortKey) => void
}) {
  const active = current.key === sortKey
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-right whitespace-nowrap cursor-pointer select-none group"
    >
      <span className={`inline-flex items-center gap-1 transition-colors ${active ? 'text-gold-400' : 'text-muted-foreground group-hover:text-foreground'}`}>
        {label}
        <span className="font-mono text-[9px]">
          {active ? (current.dir === 'desc' ? '↓' : '↑') : '↕'}
        </span>
      </span>
    </th>
  )
}

function TabFlowMonitor({
  groups,
  onSelectGroup,
}: {
  groups: GroupDaily[]
  onSelectGroup: (name: string) => void
}) {
  const [sort, setSort] = useState<{ key: FlowSortKey; dir: 'asc' | 'desc' }>({
    key: 'foreign_net_1d_miliar',
    dir: 'desc',
  })
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [expandedStocks, setExpandedStocks] = useState<StockRow[]>([])
  const [expandLoading, setExpandLoading] = useState(false)

  // FIX: sort inflow descending (biggest inflow first), outflow ascending (most negative = biggest outflow first)
  const allByFlow = [...groups].sort((a, b) => n(b.foreign_net_1d_miliar) - n(a.foreign_net_1d_miliar))
  const topInflow = allByFlow.filter(g => n(g.foreign_net_1d_miliar) > 0).slice(0, 8)
  const topOutflow = [...groups]
    .filter(g => n(g.foreign_net_1d_miliar) < 0)
    .sort((a, b) => n(a.foreign_net_1d_miliar) - n(b.foreign_net_1d_miliar)) // ascending → most negative first
    .slice(0, 8)

  const maxFlow = Math.max(...allByFlow.map(g => Math.abs(n(g.foreign_net_1d_miliar))), 1)

  const chartData = allByFlow.slice(0, 20).map(g => ({
    name: g.group_name.replace('Group ', '').replace('BUMN / Danantara', 'BUMN'),
    foreign_1d: n(g.foreign_net_1d_miliar),
    foreign_5d: n(g.foreign_net_5d_miliar),
  }))

  // Sortable full table
  const toggleSort = (key: FlowSortKey) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' }
    )
  }
  const tableSorted = [...groups].sort((a, b) => {
    const mul = sort.dir === 'desc' ? -1 : 1
    return mul * (n(a[sort.key]) - n(b[sort.key]))
  })

  // Expand group → fetch stocks
  const handleRowClick = useCallback(async (groupName: string) => {
    if (expandedGroup === groupName) {
      setExpandedGroup(null)
      setExpandedStocks([])
      return
    }
    setExpandedGroup(groupName)
    setExpandedStocks([])
    setExpandLoading(true)
    try {
      const stocks = await mdQuery(
        'SELECT * FROM market.vw_group_leader_laggard WHERE group_name = $1 ORDER BY relative_perf DESC',
        [groupName]
      )
      setExpandedStocks(stocks)
    } catch (e) { console.error(e) }
    finally { setExpandLoading(false) }
  }, [expandedGroup])

  const roleColors: Record<string, string> = {
    LEADER: 'text-emerald-400',
    OUTPERFORMER: 'text-emerald-300',
    CATCH_UP_CANDIDATE: 'text-amber-400',
    INLINE: 'text-muted-foreground',
    LAGGARD: 'text-red-400',
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Top inflow / outflow bars ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Inflow */}
        <div className="glass rounded-xl p-4 border border-blue-500/15">
          <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Foreign Inflow Today
          </p>
          {topInflow.map(g => {
            const val = n(g.foreign_net_1d_miliar)
            const pct = (val / maxFlow) * 100
            return (
              <button
                key={g.group_name}
                onClick={() => handleRowClick(g.group_name)}
                className="w-full mb-2.5 text-left group/bar"
              >
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-foreground truncate max-w-[160px] group-hover/bar:text-blue-300 transition-colors">
                    {g.group_name}
                  </span>
                  <span className="font-mono font-bold text-blue-400">{fmtM(val)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </button>
            )
          })}
        </div>

        {/* Outflow */}
        <div className="glass rounded-xl p-4 border border-red-500/10">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingDown className="w-3.5 h-3.5" /> Foreign Outflow Today
          </p>
          {topOutflow.map(g => {
            const val = Math.abs(n(g.foreign_net_1d_miliar))
            const pct = (val / maxFlow) * 100
            return (
              <button
                key={g.group_name}
                onClick={() => handleRowClick(g.group_name)}
                className="w-full mb-2.5 text-left group/bar"
              >
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-foreground truncate max-w-[160px] group-hover/bar:text-red-300 transition-colors">
                    {g.group_name}
                  </span>
                   <span className="font-mono font-bold text-red-400">-{val.toFixed(1)} M</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 1D vs 5D chart ── */}
      <div className="glass rounded-xl p-4 border border-border/30">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Foreign Flow: 1D vs 5D</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)} M`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip content={<FlowTooltip />} />
              <ReferenceLine x={0} stroke="rgba(255,255,255,0.07)" />
              <Bar dataKey="foreign_1d" name="Foreign 1D" fill="#38bdf8" radius={[0,3,3,0]} barSize={7} />
              <Bar dataKey="foreign_5d" name="Foreign 5D" fill="#818cf8" radius={[0,3,3,0]} barSize={7} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-2">
          {[['Foreign 1D','#38bdf8'],['Foreign 5D','#818cf8']].map(([l,c]) => (
            <span key={l} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
            </span>
          ))}
        </div>
      </div>

      {/* ── Sortable full table ── */}
      <div className="glass rounded-xl border border-border/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-card/20 flex items-center justify-between">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            Semua Grup · Klik kolom untuk sort · Klik baris untuk detail saham
          </p>
          <span className="text-[9px] text-muted-foreground">{groups.length} grup</span>
        </div>
        <div className="overflow-x-auto table-container">
          <table className="w-full text-xs cq-table">
            <thead>
              <tr className="border-b border-border/40 bg-card/10">
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left whitespace-nowrap">
                  Grup
                </th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Stk</th>
                <SortTh label="Foreign 1D" sortKey="foreign_net_1d_miliar" current={sort} onSort={toggleSort} />
                <SortTh label="Foreign 5D" sortKey="foreign_net_5d_miliar" current={sort} onSort={toggleSort} />
                <SortTh label="Value 1D"   sortKey="value_1d_miliar"       current={sort} onSort={toggleSort} />
                <SortTh label="Perf 1D"    sortKey="perf_1d"               current={sort} onSort={toggleSort} />
                <SortTh label="Score"      sortKey="composite_score"        current={sort} onSort={toggleSort} />
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Phase</th>
                <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Signal</th>
              </tr>
            </thead>
            <tbody>
              {tableSorted.map((g, i) => {
                const isExpanded = expandedGroup === g.group_name
                return (
                  <>
                    {/* Group row */}
                    <tr
                      key={g.group_name}
                      onClick={() => handleRowClick(g.group_name)}
                      className={`border-b border-border/20 cursor-pointer transition-colors ${
                        isExpanded
                          ? 'bg-gold-400/[0.06] border-gold-400/20'
                          : i % 2 === 0
                            ? 'hover:bg-white/[0.03]'
                            : 'bg-white/[0.01] hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="px-3 py-2.5 font-bold text-left" data-label="Grup">
                        <div className="flex items-center justify-end md:justify-start gap-2">
                          <div className={`w-1 h-5 rounded-full flex-shrink-0 ${
                            flowCls(n(g.foreign_net_1d_miliar)).replace('text-', 'bg-')
                          }`} />
                          <span className="truncate max-w-[170px]">{g.group_name}</span>
                          <ChevronDown className={`w-3 h-3 text-muted-foreground/40 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right text-muted-foreground" data-label="Stk">{g.total_stocks}</td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${flowCls(n(g.foreign_net_1d_miliar))}`} data-label="Foreign 1D">
                        {fmtM(n(g.foreign_net_1d_miliar))}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono ${flowCls(n(g.foreign_net_5d_miliar))}`} data-label="Foreign 5D">
                        {fmtM(n(g.foreign_net_5d_miliar))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-blue-300" data-label="Value 1D">
                        {n(g.value_1d_miliar).toFixed(0)} M
                      </td>
                      <td className={`px-3 py-2.5 text-right font-mono font-bold ${numCls(n(g.perf_1d))}`} data-label="Perf 1D">
                        {fmt(n(g.perf_1d))}%
                      </td>
                      <td className="px-3 py-2.5 text-right" data-label="Score">
                        <div className="flex justify-end">
                          <ScoreDial score={n(g.composite_score)} />
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right" data-label="Phase">
                        <PhasePill phase={g.market_phase} />
                      </td>
                      <td className={`px-3 py-2.5 text-right font-bold text-[10px] whitespace-nowrap ${signalCls(g.group_action_signal)}`} data-label="Signal">
                        {g.group_action_signal}
                      </td>
                    </tr>

                    {/* Expanded stock rows */}
                    {isExpanded && (
                      <tr key={`${g.group_name}-expand`} className="border-b border-gold-400/10">
                        <td colSpan={9} className="p-0">
                          <div className="bg-gold-400/[0.03] border-t border-gold-400/10">
                            {expandLoading ? (
                              <div className="p-4"><Skeleton rows={3} /></div>
                            ) : expandedStocks.length === 0 ? (
                              <p className="text-center text-muted-foreground text-xs py-6">Tidak ada data saham</p>
                            ) : (
                              <>
                                {/* Stock sub-header */}
                                <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
                                  <p className="text-[10px] font-bold text-gold-400/80 uppercase tracking-widest">
                                    Stock Breakdown — {g.group_name}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <span className="text-[9px] text-muted-foreground">{expandedStocks.length} saham</span>
                                    <button
                                      onClick={e => { e.stopPropagation(); onSelectGroup(g.group_name) }}
                                      className="text-[9px] font-bold text-gold-400 hover:text-gold-400/80 transition-colors px-2 py-0.5 rounded-md border border-gold-400/30 hover:border-gold-400/60"
                                    >
                                      Deep Dive →
                                    </button>
                                  </div>
                                </div>
                                <div className="overflow-x-auto pb-3 table-container">
                                  <table className="w-full text-xs cq-table">
                                    <thead>
                                      <tr className="border-y border-border/20 bg-card/10">
                                        {['Saham','Sektor','Close','Chg%','Vs Grup','Foreign 1D','Whale','Broker 7D','Role'].map(h => (
                                          <th key={h} className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right first:text-left whitespace-nowrap">
                                            {h}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedStocks.map((s, si) => (
                                        <tr key={s.stock_code} className="tr-hover">
                                          <td className="px-3 py-1.5 font-black" data-label="Saham">
                                            <Link
                                              href={`/foreign-flow?action=stock_chart&code=${s.stock_code}`}
                                              prefetch={false}
                                              className="hover:text-gold-400 transition-colors"
                                              onClick={e => e.stopPropagation()}
                                            >
                                              {s.stock_code}
                                            </Link>
                                          </td>
                                          <td className="px-3 py-1.5 text-muted-foreground text-right max-w-[110px] truncate" data-label="Sektor">
                                            {s.sector}
                                          </td>
                                          <td className="px-3 py-1.5 text-right font-mono" data-label="Close">
                                            {n(s.close).toLocaleString()}
                                          </td>
                                          <td className={`px-3 py-1.5 text-right font-mono font-bold ${numCls(n(s.change_pct))}`} data-label="Chg%">
                                            {fmt(n(s.change_pct))}%
                                          </td>
                                          <td className={`px-3 py-1.5 text-right font-mono ${numCls(n(s.relative_perf))}`} data-label="Vs Grup">
                                            {fmt(n(s.relative_perf))}%
                                          </td>
                                          <td className={`px-3 py-1.5 text-right font-mono font-bold ${numCls(n(s.net_foreign_juta))}`} data-label="Foreign 1D">
                                            {fmt(n(s.net_foreign_juta), 2)}Jt
                                          </td>
                                          <td className={`px-3 py-1.5 text-right ${s.whale_signal ? 'text-cyan-400' : 'text-muted-foreground/40'}`} data-label="Whale">
                                            {s.whale_signal ? '★' : '—'}
                                          </td>
                                          <td className={`px-3 py-1.5 text-right font-mono ${numCls(n(s.broker_net_7d_miliar))}`} data-label="Broker 7D">
                                            {fmt(n(s.broker_net_7d_miliar), 2)} M
                                          </td>
                                          <td className={`px-3 py-1.5 text-right font-bold text-[9px] whitespace-nowrap ${roleColors[s.stock_role] ?? 'text-muted-foreground'}`} data-label="Role">
                                            {s.stock_role === 'CATCH_UP_CANDIDATE' ? '⚡ CATCH-UP' : s.stock_role}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  GROUP COMBOBOX — searchable group selector
// ═══════════════════════════════════════════════════════════════════════════════

function GroupCombobox({
  groups, value, onChange
}: {
  groups: GroupDaily[]
  value: string
  onChange: (name: string) => void
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return groups
    const q = query.toLowerCase()
    return groups.filter(g => g.group_name.toLowerCase().includes(q))
  }, [groups, query])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close on Escape
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'Enter' && filtered.length === 1) {
      onChange(filtered[0].group_name); setOpen(false); setQuery('')
    }
  }

  const selected = groups.find(g => g.group_name === value)

  return (
    <div ref={wrapperRef} className="relative min-w-[260px] max-w-[380px]">
      {/* Trigger / input */}
      <div
        className={`glass rounded-xl border flex items-center gap-2 px-3 py-2 cursor-text transition-colors ${
          open ? 'border-gold-400/50' : 'border-border/40 hover:border-border/70'
        }`}
        onClick={() => setOpen(true)}
      >
        {open ? (
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selected?.group_name ?? 'Ketik nama grup...'}
            className="bg-transparent flex-1 text-sm font-semibold outline-none text-foreground placeholder:text-muted-foreground/50 min-w-0"
          />
        ) : (
          <span className="text-sm font-semibold text-foreground flex-1 truncate">
            {selected
              ? <>{selected.group_name} <span className="text-muted-foreground font-normal">[{n(selected.composite_score)}]</span></>
              : <span className="text-muted-foreground">Pilih grup...</span>
            }
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180 text-gold-400' : ''}`} />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-full glass border border-border/50 rounded-xl shadow-2xl overflow-hidden">
          <div className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground text-center">
                Tidak ditemukan — coba kata lain
              </div>
            ) : filtered.map(g => {
              const isSelected = g.group_name === value
              const scoreCls = n(g.composite_score) >= 70 ? 'text-emerald-400' :
                               n(g.composite_score) >= 50 ? 'text-amber-400' : 'text-muted-foreground'
              return (
                <button
                  key={g.group_name}
                  onMouseDown={e => {
                    e.preventDefault() // prevent blur before selection
                    onChange(g.group_name)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 transition-colors tr-hover ${
                    isSelected ? 'bg-gold-400/[0.08]' : ''
                  }`}
                >
                  <span className={`text-sm truncate ${isSelected ? 'font-bold text-gold-400' : 'font-medium text-foreground'}`}>
                    {g.group_name}
                  </span>
                  <span className={`text-xs font-black flex-shrink-0 ${scoreCls}`}>
                    {n(g.composite_score)}
                  </span>
                </button>
              )
            })}
          </div>
          {filtered.length > 0 && (
            <div className="px-3 py-1.5 border-t border-border/30 text-[9px] text-muted-foreground/50">
              {filtered.length} grup · ESC untuk tutup
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 3: DEEP DIVE — daily-first detail per group
// ═══════════════════════════════════════════════════════════════════════════════

function TabDeepDive({
  groups, selectedGroup, onChangeGroup
}: {
  groups: GroupDaily[]
  selectedGroup: string
  onChangeGroup: (name: string) => void
}) {
  const [stocks, setStocks] = useState<StockRow[]>([])
  const [brokers, setBrokers] = useState<BrokerRow[]>([])
  const [ksei3m, setKsei3m] = useState<KseiMonthly[]>([])
  const [flowDaily, setFlowDaily] = useState<GroupFlowDay[]>([])
  const [loading, setLoading] = useState(false)
  const [showKsei, setShowKsei] = useState(false)

  const g = groups.find(x => x.group_name === selectedGroup) ?? groups[0]

  // FIX #3: Precompute cumulative data (tidak bisa pakai data prop override di Line child)
  const flowDailyWithCum = useMemo(() => {
    let cum = 0
    return flowDaily.map(d => {
      cum += n(d.net_foreign)
      return { ...d, cum }
    })
  }, [flowDaily])

  const fetchDetail = useCallback(async (name: string) => {
    setLoading(true)
    try {
      const [s, b, k, f] = await Promise.all([
        // stocks — vw_group_leader_laggard sudah unik per stock_code, tidak perlu DISTINCT
        mdQuery('SELECT * FROM market.vw_group_leader_laggard WHERE group_name = $1 ORDER BY relative_perf DESC', [name]),

        // FIX #2: Ganti DISTINCT ON (PostgreSQL-only) → ROW_NUMBER() yang DuckDB support
        mdQuery(`
          SELECT broker_code, broker_name, net_7d_miliar, net_30d_miliar,
                 stocks_7d, buy_consensus_pct, broker_consensus, rotation_signal
          FROM (
            SELECT *,
              ROW_NUMBER() OVER (PARTITION BY broker_code ORDER BY net_7d_miliar DESC) AS rn
            FROM market.vw_group_broker_stance
            WHERE group_name = $1
          ) t
          WHERE rn = 1
          ORDER BY net_7d_miliar DESC
        `, [name]),

        mdQuery(`
          SELECT TO_CHAR(Date,'Mon') AS bulan,
            ROUND((SUM(Local_CP_Chg_Val)+SUM(Local_PF_Chg_Val)+SUM(Local_IB_Chg_Val))/1e9,2) AS local_smart,
            ROUND((SUM(Foreign_CP_Chg_Val)+SUM(Foreign_PF_Chg_Val)+SUM(Foreign_IB_Chg_Val))/1e9,2) AS foreign_smart,
            ROUND(SUM(Local_ID_Chg_Val)/1e9,2) AS retail
          FROM ksei.monthly_snapshot ms
          JOIN market.company_profile cp ON ms.Code = cp.stock_code
          WHERE cp.group_name = $1
            AND ms.Date >= (SELECT MAX(Date) FROM ksei.monthly_snapshot) - INTERVAL '90 days'
          GROUP BY Date ORDER BY Date
        `, [name]),

        mdQuery(`
          WITH ld AS (SELECT MAX(trading_date) AS max_date FROM market.daily_transactions)
          SELECT
            CAST(dt.trading_date AS VARCHAR) AS date,
            SUM(dt.net_foreign_value)::BIGINT / 1e9 AS net_foreign,
            SUM(dt.value)::BIGINT / 1e9 AS total_value
          FROM market.daily_transactions dt
          JOIN market.company_profile cp ON dt.stock_code = cp.stock_code
          CROSS JOIN ld
          WHERE cp.group_name = $1
            AND dt.trading_date >= ld.max_date - INTERVAL '30 days'
          GROUP BY dt.trading_date
          ORDER BY dt.trading_date ASC
        `, [name]),
      ])
      setStocks(s)
      setBrokers(b)
      setKsei3m(k)
      setFlowDaily(f)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (selectedGroup) fetchDetail(selectedGroup)
  }, [selectedGroup, fetchDetail])

  if (!g) return null

  const roleColors: Record<string, string> = {
    LEADER: 'text-emerald-400',
    OUTPERFORMER: 'text-emerald-300',
    CATCH_UP_CANDIDATE: 'text-amber-400',
    INLINE: 'text-muted-foreground',
    LAGGARD: 'text-red-400',
  }

  const rotColors: Record<string, string> = {
    CONSISTENT_BUY: 'text-emerald-400',
    NEW_ENTRY: 'text-cyan-400',
    MIXED: 'text-muted-foreground',
    NEW_EXIT: 'text-amber-400',
    CONSISTENT_SELL: 'text-red-400',
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Group selector — searchable combobox */}
      <div className="flex flex-wrap gap-3 items-center">
        <GroupCombobox groups={groups} value={selectedGroup} onChange={onChangeGroup} />
        <PhasePill phase={g.market_phase} />
        {g.konsisten_3_bulan && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ★ 3 BLN KONSISTEN
          </span>
        )}
      </div>

      {/* Scorecard — daily metrics first */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Composite Score', value: `${n(g.composite_score)}/100`, sub: g.group_action_signal, cls: signalCls(g.group_action_signal) },
          { label: 'Foreign 1D', value: fmtM(n(g.foreign_net_1d_miliar)), sub: g.foreign_flow_trend, cls: flowCls(n(g.foreign_net_1d_miliar)) },
          { label: 'Foreign 5D', value: fmtM(n(g.foreign_net_5d_miliar)), sub: `Value 1D: ${n(g.value_1d_miliar).toFixed(0)} M`, cls: flowCls(n(g.foreign_net_5d_miliar)) },
          { label: 'Broker Consensus', value: `${n(g.broker_buy_pct).toFixed(0)}% BUY`, sub: `${g.whale_count} whale`, cls: numCls(n(g.broker_buy_pct) - 50) },
        ].map(({ label, value, sub, cls }) => (
          <div key={label} className="metric-card card-hover p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-xl font-black font-mono ${cls}`}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>
          </div>
        ))}
      </div>

      {/* Alert banners */}
      {g.divergence_signal === 'DIVERGEN_BULLISH' && (
        <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Star className="w-4 h-4 flex-shrink-0" />
          Institusi & retail DIVERGEN — smart money akumulasi sementara retail jual → classic accumulation setup
        </div>
      )}
      {g.divergence_signal === 'DIVERGEN_BEARISH' && (
        <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-2">
          <TrendingDown className="w-4 h-4 flex-shrink-0" />
          Distribusi Alert — institusi jual, retail beli → potensi penurunan lanjutan
        </div>
      )}

      {/* Primary: Daily Foreign Flow Chart */}
      <div className="glass rounded-xl p-4 border border-blue-500/15">
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Globe className="w-3.5 h-3.5" /> Daily Foreign Flow — {selectedGroup} (30 Hari)
        </p>
        {loading ? <Skeleton rows={3} /> :
          flowDailyWithCum.length > 0 ? (
            <>
              {/* Bar chart harian */}
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={flowDailyWithCum}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={d => d.slice(5)} />
                    <YAxis yAxisId="flow" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}
                      tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)} M`} width={55} />
                    <Tooltip content={<FlowTooltip />} />
                    <ReferenceLine yAxisId="flow" y={0} stroke="rgba(255,255,255,0.08)" />
                    <Bar yAxisId="flow" dataKey="net_foreign" name="Net Foreign" radius={[3,3,0,0]}
                      fill="#06b6d4" opacity={0.85} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* FIX #3: Kumulatif — gunakan flowDailyWithCum yang sudah ada field 'cum' */}
              <div className="mt-3">
                <p className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">Kumulatif 30 Hari</p>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={flowDailyWithCum}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(0)} M`} width={55} />
                      <Tooltip content={<FlowTooltip />} />
                      <Line type="monotone" name="Cumulative" stroke="#38bdf8" strokeWidth={2}
                        dot={false} dataKey="cum" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No flow data</p>
          )
        }
      </div>

      {/* Stock breakdown */}
      <div className="glass rounded-xl border border-border/30 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 bg-card/20 flex items-center justify-between">
          <p className="text-xs font-black text-gold-400 uppercase tracking-widest">Stock Breakdown — {selectedGroup}</p>
          <span className="text-[9px] text-muted-foreground">{stocks.length} stocks</span>
        </div>
        {loading ? <div className="p-4"><Skeleton rows={4} /></div> : (
          <div className="overflow-x-auto table-container">
            <table className="w-full text-xs cq-table">
              <thead>
                <tr className="border-b border-border/30 bg-card/10">
                  {['Saham','Sektor','Close','Change','Vs Grup','Foreign 1D','Whale','Broker 7D','Role'].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right first:text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((s, i) => (
                  <tr key={s.stock_code} className="tr-hover">
                    <td className="px-3 py-2 font-black" data-label="Saham">
                      <Link href={`/foreign-flow?action=stock_chart&code=${s.stock_code}`} prefetch={false} className="hover:text-gold-400 transition-colors">
                        {s.stock_code}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-right max-w-[120px] truncate" data-label="Sektor">{s.sector}</td>
                    <td className="px-3 py-2 text-right font-mono" data-label="Close">{n(s.close).toLocaleString()}</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${numCls(n(s.change_pct))}`} data-label="Change">{fmt(n(s.change_pct))}%</td>
                    <td className={`px-3 py-2 text-right font-mono ${numCls(n(s.relative_perf))}`} data-label="Vs Grup">{fmt(n(s.relative_perf))}%</td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${numCls(n(s.net_foreign_juta))}`} data-label="Foreign 1D">{fmt(n(s.net_foreign_juta),2)}Jt</td>
                    <td className={`px-3 py-2 text-right ${s.whale_signal ? 'text-cyan-400' : 'text-muted-foreground'}`} data-label="Whale">
                      {s.whale_signal ? '★' : '—'}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono ${numCls(n(s.broker_net_7d_miliar))}`} data-label="Broker 7D">
                      {fmt(n(s.broker_net_7d_miliar), 2)} M
                    </td>
                    <td className={`px-3 py-2 text-right font-bold text-[10px] ${roleColors[s.stock_role] ?? 'text-muted-foreground'}`} data-label="Role">
                      {s.stock_role === 'CATCH_UP_CANDIDATE' ? '⚡ CATCH-UP' : s.stock_role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broker stance */}
      {brokers.length > 0 && (
        <div className="glass rounded-xl border border-border/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/30 bg-card/20">
            <p className="text-xs font-black text-gold-400 uppercase tracking-widest">Broker Stance — {selectedGroup} (7D)</p>
          </div>
          <div className="overflow-x-auto table-container">
            <table className="w-full text-xs cq-table">
              <thead>
                <tr className="border-b border-border/30 bg-card/10">
                  {['Broker','Net 7D','Net 30D','Saham','Rotasi'].map(h => (
                    <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokers.slice(0, 12).map((b, i) => (
                  <tr key={b.broker_code} className="tr-hover">
                    <td className="px-3 py-2 font-bold" data-label="Broker">
                      <span>{b.broker_code}</span>
                      <span className="text-muted-foreground ml-2 font-normal text-[10px]">{b.broker_name}</span>
                    </td>
                    <td className={`px-3 py-2 text-right font-mono font-bold ${numCls(n(b.net_7d_miliar))}`} data-label="Net 7D">
                      {fmt(n(b.net_7d_miliar), 2)} M
                    </td>
                    <td className={`px-3 py-2 text-right font-mono ${numCls(n(b.net_30d_miliar))}`} data-label="Net 30D">
                      {fmt(n(b.net_30d_miliar), 2)} M
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground" data-label="Saham">{b.stocks_7d}</td>
                    <td className={`px-3 py-2 text-right font-bold text-[10px] ${rotColors[b.rotation_signal] ?? 'text-muted-foreground'}`} data-label="Rotasi">
                      {b.rotation_signal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KSEI Monthly (collapsible — secondary) */}
      <div className="glass rounded-xl border border-border/30 overflow-hidden">
        <button
          onClick={() => setShowKsei(!showKsei)}
          className="w-full px-4 py-3 flex items-center justify-between bg-card/20 hover:bg-card/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400/60" />
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">KSEI Ownership (Monthly)</p>
            <span className="text-[9px] text-muted-foreground/40">— data bulanan, secondary</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showKsei ? 'rotate-180' : ''}`} />
        </button>
        {showKsei && (
          <div className="p-4 space-y-4 border-t border-border/20">
            {/* KSEI chart */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Smart Money Trend (3 Bulan)</p>
              {ksei3m.length > 0 ? (
                <>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ksei3m} barGap={3}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="bulan" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                          tickFormatter={v => `${v > 0 ? '+' : ''}${v} M`} />
                        <Tooltip content={<FlowTooltip />} />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                        <Bar dataKey="local_smart"   name="Inst. Lokal" fill="#3b82f6" radius={[3,3,0,0]} />
                        <Bar dataKey="foreign_smart" name="Inst. Asing" fill="#06b6d4" radius={[3,3,0,0]} />
                        <Bar dataKey="retail"        name="Retail"      fill="#ef4444" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 mt-2">
                    {[['Inst. Lokal','#3b82f6'],['Inst. Asing','#06b6d4'],['Retail','#ef4444']].map(([l,c]) => (
                      <span key={l} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />{l}
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <Skeleton rows={3} />
              )}
            </div>

            {/* Investor type breakdown */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Investor Type Breakdown</p>
              {[
                ['Korporat Lokal (CP)', n(g.local_cp_miliar)],
                ['Pension Fund (PF)',   n(g.local_pf_miliar)],
                ['Inv. Bank (IB)',      n(g.local_ib_miliar)],
                ['Korporat Asing (CP)', n(g.foreign_cp_miliar)],
                ['Retail Lokal (ID)',   n(g.local_retail_miliar)],
              ].map(([label, val]) => {
                const v = val as number
                const w = Math.min(100, (Math.abs(v) / 1500) * 100)
                return (
                  <div key={label as string}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-muted-foreground truncate">{label as string}</span>
                      <span className={`font-mono font-bold ${numCls(v)}`}>{fmtM(v)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className={`h-full rounded-full ${v >= 0 ? 'bg-emerald-500/60' : 'bg-red-500/60'}`}
                        style={{ width: `${w}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  TAB 4: CATCH-UP RADAR — daily market divergence detection
// ═══════════════════════════════════════════════════════════════════════════════

function TabCatchup({ groups }: { groups: GroupDaily[] }) {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(1.5)

  const fetchCandidates = useCallback(async (gap: number) => {
    setLoading(true)
    setError(null)
    try {
      const data = await mdQuery(`
        WITH latest AS (
          SELECT MAX(trading_date) AS max_date FROM market.daily_transactions
        ),
        stock_daily AS (
          SELECT
            d.stock_code,
            d.close,
            d.change_percent,
            d.net_foreign_value,
            d.whale_signal,
            d.aov_ratio_ma20,
            cp.group_name,
            cp.sector,
            cp.free_float
          FROM market.daily_transactions d
          JOIN market.company_profile cp ON d.stock_code = cp.stock_code
          WHERE d.trading_date = (SELECT max_date FROM latest)
            AND cp.group_name != 'Others'
        ),
        group_avg AS (
          SELECT
            group_name,
            ROUND(AVG(change_percent), 2)  AS grp_avg_chg,
            ROUND(AVG(aov_ratio_ma20), 2)  AS grp_avg_aov,
            COUNT(*)                        AS grp_stocks
          FROM stock_daily
          GROUP BY group_name
        ),
        group_perf_20d AS (
          SELECT
            cp.group_name,
            ROUND(AVG(d.change_percent), 2) AS perf_20d
          FROM market.daily_transactions d
          JOIN market.company_profile cp ON d.stock_code = cp.stock_code
          WHERE d.trading_date >= (SELECT max_date FROM latest) - INTERVAL '30 days'
            AND cp.group_name != 'Others'
          GROUP BY cp.group_name
        ),
        ksei_sm AS (
          SELECT
            ms.Code,
            ROUND((ms.Local_CP_Chg_Val + ms.Local_PF_Chg_Val + ms.Local_IB_Chg_Val
                 + ms.Foreign_CP_Chg_Val + ms.Foreign_PF_Chg_Val + ms.Foreign_IB_Chg_Val)
                 / 1e9, 2) AS ksei_smart_miliar
          FROM ksei.monthly_snapshot ms
          WHERE ms.Date = (SELECT MAX(Date) FROM ksei.monthly_snapshot)
        ),
        broker_net AS (
          SELECT
            stock_code,
            ROUND(SUM(value) / 1e9, 2)
              AS broker_net_miliar
          FROM main.broker_activity
          WHERE date >= (SELECT max_date FROM latest) - INTERVAL '7 days'
          GROUP BY stock_code
        )
        SELECT
          s.stock_code,
          s.sector,
          s.close,
          ROUND(s.change_percent, 2)              AS change_pct,
          g.grp_avg_chg,
          ROUND(s.change_percent - g.grp_avg_chg, 2) AS relative_perf,
          s.whale_signal,
          ROUND(s.net_foreign_value / 1e6, 2)     AS net_foreign_juta,
          s.free_float,
          s.group_name,
          g.grp_stocks,
          COALESCE(p.perf_20d, 0)                 AS group_perf_20d,
          COALESCE(k.ksei_smart_miliar, 0)        AS ksei_smart_miliar,
          COALESCE(b.broker_net_miliar, 0)        AS broker_net_miliar,
          CASE
            WHEN (COALESCE(k.ksei_smart_miliar, 0) > 0 AND COALESCE(b.broker_net_miliar, 0) > 0)
              THEN 'HIGH'
            WHEN (COALESCE(k.ksei_smart_miliar, 0) > 0 OR s.whale_signal
                  OR COALESCE(b.broker_net_miliar, 0) > 0)
              THEN 'MEDIUM'
            ELSE 'LOW'
          END AS catchup_conviction
        FROM stock_daily s
        JOIN group_avg        g ON s.group_name = g.group_name
        JOIN group_perf_20d   p ON s.group_name = p.group_name
        LEFT JOIN ksei_sm     k ON s.stock_code  = k.Code
        LEFT JOIN broker_net  b ON s.stock_code  = b.stock_code
        WHERE
          (s.change_percent - g.grp_avg_chg) <= -$1
          AND COALESCE(p.perf_20d, 0) > 0
          AND (
            COALESCE(k.ksei_smart_miliar, 0) > 0
            OR s.whale_signal
            OR COALESCE(b.broker_net_miliar, 0) > 0
          )
        ORDER BY
          CASE WHEN (COALESCE(k.ksei_smart_miliar,0) > 0 AND COALESCE(b.broker_net_miliar,0) > 0)
               THEN 0 ELSE 1 END,
          (s.change_percent - g.grp_avg_chg) ASC
        LIMIT 25
      `, [gap])
      setCandidates(data)
    } catch (err: any) {
      setError(err.message ?? 'Query gagal')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCandidates(threshold) }, [fetchCandidates, threshold])

  const high   = candidates.filter(c => c.catchup_conviction === 'HIGH')
  const medium = candidates.filter(c => c.catchup_conviction === 'MEDIUM')

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-4 flex-wrap mb-2">
        <p className="text-xs text-muted-foreground">
          Gap threshold:
        </p>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {[0.5, 1, 1.5, 2, 3].map(v => (
            <button key={v} onClick={() => setThreshold(v)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                threshold === v
                  ? 'bg-amber-400/20 text-amber-400'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {v}%
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground/40">{candidates.length} kandidat</span>
      </div>

      {loading ? <Skeleton rows={4} /> : (
        <>
          {high.length > 0 && (
            <>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">High Conviction — {high.length} kandidat</p>
              {high.map(c => (
                <div key={c.stock_code}
                  className="glass rounded-xl p-4 border border-amber-400/20 bg-amber-400/[0.02] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link href={`/foreign-flow?action=stock_chart&code=${c.stock_code}`}
                        className="text-lg font-black text-amber-400 hover:text-amber-300 transition-colors font-mono">
                        {c.stock_code}
                      </Link>
                      <span className="text-xs text-muted-foreground">{c.group_name}</span>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <p>
                        <span className="text-muted-foreground">Stock: </span>
                        <span className={`font-mono font-bold ${numCls(n(c.change_pct))}`}>{fmt(n(c.change_pct))}%</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span className="text-muted-foreground">Group: </span>
                        <span className={`font-mono font-bold ${numCls(n(c.grp_avg_chg))}`}>{fmt(n(c.grp_avg_chg))}%</span>
                        <span className="text-muted-foreground mx-1">·</span>
                        <span className="text-muted-foreground">Gap: </span>
                        <span className="font-mono font-bold text-amber-400">{fmt(n(c.relative_perf))}%</span>
                      </p>
                      <p className="text-muted-foreground">
                        Foreign 1D <span className={`font-bold ${numCls(n(c.net_foreign_juta))}`}>{fmt(n(c.net_foreign_juta),2)}Jt</span>
                        <span className="mx-1">·</span>
                        Broker 7D <span className={`font-bold ${numCls(n(c.broker_net_miliar))}`}>{fmt(n(c.broker_net_miliar),2)} M</span>
                        {c.whale_signal && <span className="ml-1 text-cyan-400">· ★ Whale</span>}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground bg-white/[0.02] rounded-lg px-3 py-2">
                    <strong className="text-foreground">{c.stock_code}</strong> tertinggal{' '}
                    <strong className="text-amber-400">{Math.abs(n(c.relative_perf)).toFixed(1)}%</strong> dari grup{' '}
                    <strong className="text-foreground">{c.group_name}</strong> →
                    <strong className="text-amber-400"> HIGH conviction catch-up</strong>
                  </p>
                </div>
              ))}
            </>
          )}

          {medium.length > 0 && (
            <>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Medium Conviction — {medium.length} kandidat</p>
              <div className="glass rounded-xl border border-border/30 overflow-hidden table-container">
                <table className="w-full text-xs cq-table">
                  <thead>
                    <tr className="border-b border-border/30 bg-card/20">
                      {['Saham','Grup','Gap%','Foreign 1D','Broker 7D','Whale','Conviction'].map(h => (
                        <th key={h} className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right first:text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {medium.map((c, i) => (
                      <tr key={c.stock_code} className="tr-hover">
                        <td className="px-3 py-2 font-black" data-label="Saham">
                          <Link href={`/foreign-flow?action=stock_chart&code=${c.stock_code}`} className="hover:text-amber-400 transition-colors">{c.stock_code}</Link>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground text-right truncate max-w-[120px]" data-label="Grup">{c.group_name}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-amber-400" data-label="Gap%">{fmt(n(c.relative_perf))}%</td>
                        <td className={`px-3 py-2 text-right font-mono ${numCls(n(c.net_foreign_juta))}`} data-label="Foreign 1D">{fmt(n(c.net_foreign_juta),2)}Jt</td>
                        <td className={`px-3 py-2 text-right font-mono ${numCls(n(c.broker_net_miliar))}`} data-label="Broker 7D">{fmt(n(c.broker_net_miliar),2)} M</td>
                        <td className={`px-3 py-2 text-right ${c.whale_signal ? 'text-cyan-400' : 'text-muted-foreground'}`} data-label="Whale">{c.whale_signal ? '★' : '—'}</td>
                        <td className={`px-3 py-2 text-right font-bold text-[10px] ${c.catchup_conviction === 'HIGH' ? 'text-amber-400' : 'text-muted-foreground'}`} data-label="Conviction">{c.catchup_conviction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {candidates.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Tidak ada catch-up kandidat — semua saham inline dengan grupnya
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const TABS = [
  { id: 'leaderboard', label: '🏆 Leaderboard',   icon: TrendingUp },
  { id: 'flow',        label: '📊 Flow Monitor',  icon: BarChart3 },
  { id: 'deepdive',    label: '🔬 Deep Dive',     icon: Activity },
  { id: 'catchup',     label: '⚡ Catch-Up',       icon: Zap },
]

export default function GroupsPage() {
  const [groups, setGroups]               = useState<GroupDaily[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState('leaderboard')
  const [selectedGroup, setSelectedGroup] = useState('')

  // FIX: hilangkan selectedGroup dari deps agar tidak re-fetch setiap klik baris
  const fetchGroups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // FIX #1: Hapus foreign_pf_miliar — kolom ini tidak ada di vw_group_phase_composite
      // Query yang menyertakannya menyebabkan error dan groups selalu kosong
      const data = await mdQuery(`
        SELECT
          mp.group_name,
          COALESCE(pc.total_stocks, 0)              AS total_stocks,
          mp.perf_1d,
          mp.perf_5d_avg,
          mp.perf_20d_avg,
          mp.perf_60d_avg,
          mp.value_1d_miliar,
          mp.avg_val_5d_miliar,
          mp.avg_val_20d_miliar,
          mp.foreign_net_1d_miliar,
          mp.foreign_net_5d_miliar,
          mp.foreign_net_20d_miliar,
          mp.foreign_net_60d_miliar,
          mp.whale_1d,
          mp.anomaly_1d,
          mp.momentum_state,
          mp.foreign_flow_trend,
          mp.rs_vs_market_1d,
          COALESCE(pc.composite_score, 0)            AS composite_score,
          COALESCE(pc.market_phase, 'SIDEWAYS')      AS market_phase,
          COALESCE(pc.group_action_signal, 'WATCH')  AS group_action_signal,
          COALESCE(pc.ksei_conviction_score, 0)      AS ksei_conviction_score,
          COALESCE(pc.foreign_30d_miliar, 0)         AS foreign_30d_miliar,
          COALESCE(pc.total_smart_miliar, 0)         AS total_smart_miliar,
          COALESCE(pc.local_smart_miliar, 0)         AS local_smart_miliar,
          COALESCE(pc.foreign_smart_miliar, 0)       AS foreign_smart_miliar,
          COALESCE(pc.local_retail_miliar, 0)        AS local_retail_miliar,
          COALESCE(pc.local_cp_miliar, 0)            AS local_cp_miliar,
          COALESCE(pc.local_pf_miliar, 0)            AS local_pf_miliar,
          COALESCE(pc.local_ib_miliar, 0)            AS local_ib_miliar,
          COALESCE(pc.foreign_cp_miliar, 0)          AS foreign_cp_miliar,
          COALESCE(pc.smart_money_trend, '')         AS smart_money_trend,
          COALESCE(pc.divergence_signal, '')         AS divergence_signal,
          COALESCE(pc.konsisten_3_bulan, FALSE)      AS konsisten_3_bulan,
          COALESCE(pc.institution_alignment, '')     AS institution_alignment,
          COALESCE(pc.broker_buy_pct, 0)             AS broker_buy_pct,
          COALESCE(pc.broker_consensus, '')          AS broker_consensus,
          COALESCE(pc.broker_net_7d_miliar, 0)       AS broker_net_7d_miliar,
          COALESCE(pc.whale_count, 0)                AS whale_count,
          COALESCE(pc.group_top_buyer, '')           AS group_top_buyer
        FROM market.vw_group_multi_period_perf mp
        LEFT JOIN market.vw_group_phase_composite pc ON mp.group_name = pc.group_name
        ORDER BY mp.foreign_net_1d_miliar DESC
      `)
      setGroups(data)
      if (data.length > 0) {
        setSelectedGroup(prev => prev || data[0].group_name)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Gagal memuat data grup')
    }
    finally { setLoading(false) }
  }, []) // deps kosong — tidak bergantung pada state lain

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const handleSelectGroup = (name: string) => {
    setSelectedGroup(name)
    setActiveTab('deepdive')
  }

  return (
    <div className="sidebar-offset space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}
          >
            <Building2 className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-gold">Group Intelligence</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Daily Market-Driven · {groups.length} grup aktif · Foreign Flow + Broker + KSEI
            </p>
          </div>
        </div>
        <button onClick={fetchGroups} disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass card-hover text-xs font-semibold disabled:opacity-50 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Gagal memuat data grup</p>
            <p className="font-mono opacity-80">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-border/50 overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-5 py-3 text-sm font-bold transition-all relative whitespace-nowrap flex-shrink-0 ${
              activeTab === id ? 'text-gold-400' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {label}
            {activeTab === id && (
              <span className="absolute bottom-[-1px] left-0 w-full h-0.5 bg-gold-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <Skeleton rows={8} />
      ) : (
        <>
          {activeTab === 'leaderboard' && (
            <TabLeaderboard groups={groups} onSelectGroup={handleSelectGroup} />
          )}
          {activeTab === 'flow' && (
            <TabFlowMonitor groups={groups} onSelectGroup={handleSelectGroup} />
          )}
          {activeTab === 'deepdive' && (
            <TabDeepDive
              groups={groups}
              selectedGroup={selectedGroup}
              onChangeGroup={setSelectedGroup}
            />
          )}
          {activeTab === 'catchup' && (
            <TabCatchup groups={groups} />
          )}
        </>
      )}
    </div>
  )
}
