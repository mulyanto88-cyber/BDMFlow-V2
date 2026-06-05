'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Radar, Search, RefreshCw, Filter,
  Zap, Shield, ChevronDown, ChevronUp, ExternalLink,
  AlertTriangle, Activity, Globe, Building2,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface RadarRow {
  stock_code: string
  sector: string
  group_name: string
  close: number
  change_percent: number
  radar_score: number
  composite_signal: string
  market_signal: string
  foreign_broker_net_7d: number
  local_inst_net_7d: number
  retail_net_7d: number
  prime_broker_net_7d: number
  foreign_net_7d_miliar: number
  ksei_net_smart_miliar: number
  insider_conviction_score: number
  insider_signal: string | null
  whale_signal: boolean
  big_player_anomaly: boolean
  aov_ratio_ma20: number
  fresh_insider_buy: boolean
  daily_value?: number
}

interface SignalStat {
  composite_signal: string
  count: number
  avg_score: number
  avg_chg: number
}

type SortKey = 'radar_score' | 'change_percent' | 'foreign_broker_net_7d' |
               'local_inst_net_7d' | 'ksei_net_smart_miliar' | 'aov_ratio_ma20'

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function apiFetch(params: Record<string, string | number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  const res = await fetch(`/api/radar?${qs}`)
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data ?? []
}

function scoreColor(s: number) {
  if (s >= 70) return 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30'
  if (s >= 55) return 'text-sky-400 bg-sky-500/15 border-sky-500/30'
  if (s >= 40) return 'text-amber-400 bg-amber-500/15 border-amber-500/30'
  return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
}

function scoreBg(s: number) {
  if (s >= 70) return 'bg-emerald-500'
  if (s >= 55) return 'bg-sky-500'
  if (s >= 40) return 'bg-amber-500'
  return 'bg-slate-600'
}

function scoreGlow(s: number): string | undefined {
  if (s >= 70) return '0 0 6px rgba(34,197,94,0.55)'
  if (s >= 55) return '0 0 6px rgba(56,189,248,0.45)'
  return undefined
}

function netColor(v: number) {
  if (v > 5)  return 'text-emerald-400'
  if (v > 0)  return 'text-emerald-300/70'
  if (v < -5) return 'text-red-400'
  if (v < 0)  return 'text-red-300/70'
  return 'text-slate-400'
}

const fmtM = (v: number | null | undefined) => {
  const val = Number(v) || 0
  const abs = Math.abs(val)
  const sign = val > 0 ? '+' : ''
  if (abs >= 1000) return `${sign}${(val / 1000).toFixed(1)} T`
  return `${sign}${val.toFixed(1)} M`
}

function signalBadge(sig: string) {
  if (sig.includes('TRIPLE'))   return 'bg-gold-400/20 text-gold-400 border-gold-400/30'
  if (sig.includes('PRIME'))    return 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  if (sig.includes('WHALE'))    return 'bg-teal-500/20 text-teal-300 border-teal-500/30'
  if (sig.includes('KSEI'))     return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (sig.includes('INSIDER'))  return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  if (sig.includes('INST BUY')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  if (sig.includes('SELL'))     return 'bg-red-500/20 text-red-300 border-red-500/30'
  if (sig.includes('SINGLE'))   return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

const SIGNAL_PRESETS = [
  { label: '⚡ Triple',        value: 'TRIPLE' },
  { label: '🌏 Prime Foreign', value: 'PRIME' },
  { label: '🐋 Whale',         value: 'WHALE' },
  { label: '🏛 KSEI+Inst',     value: 'KSEI' },
  { label: '🔑 Insider',       value: 'INSIDER' },
  { label: '🔄 Divergence',    value: 'INST BUY' },
]

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RadarPage() {
  const [rows, setRows]               = useState<RadarRow[]>([])
  const [signals, setSignals]         = useState<SignalStat[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [filterSector, setFilterSector] = useState('ALL')
  const [filterSignal, setFilterSignal] = useState('ALL')
  const [minScore, setMinScore]       = useState(0)
  const [minClose, setMinClose]       = useState(100)
  const [sortKey, setSortKey]         = useState<SortKey>('radar_score')
  const [sortDir, setSortDir]         = useState<'asc' | 'desc'>('desc')
  const [page, setPage]               = useState(1)
  const pageSize = 25

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [listData, sigData] = await Promise.all([
        apiFetch({ action: 'list', min_score: minScore, min_close: minClose, min_value: 5000000000, limit: 300 }),
        apiFetch({ action: 'signals' }),
      ])
      setRows(listData)
      setSignals(sigData)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [minScore, minClose])

  useEffect(() => { fetchData() }, [fetchData])

  const sectors = useMemo(() =>
    ['ALL', ...Array.from(new Set(rows.map(r => r.sector).filter(Boolean))).sort()],
    [rows])

  const filtered = useMemo(() => {
    let d = [...rows]
    if (search)              d = d.filter(r => r.stock_code.includes(search.toUpperCase()) || r.sector?.includes(search) || r.group_name?.includes(search))
    if (filterSector !== 'ALL') d = d.filter(r => r.sector === filterSector)
    if (filterSignal !== 'ALL') d = d.filter(r => r.composite_signal?.includes(filterSignal))
    d.sort((a, b) => {
      const av = Number(a[sortKey as keyof RadarRow]) || 0
      const bv = Number(b[sortKey as keyof RadarRow]) || 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return d
  }, [rows, search, filterSector, filterSignal, sortKey, sortDir])

  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronDown size={11} className="opacity-25" />
    return sortDir === 'desc' ? <ChevronDown size={11} /> : <ChevronUp size={11} />
  }

  // KPIs
  const highConviction = rows.filter(r => r.radar_score >= 60).length
  const tripleConfl    = rows.filter(r => r.composite_signal?.includes('TRIPLE')).length
  const primeFor       = rows.filter(r => r.composite_signal?.includes('PRIME')).length
  const avgScore       = rows.length ? Math.round(rows.reduce((s, r) => s + r.radar_score, 0) / rows.length) : 0

  // Signal distribution for stacked bar
  const signalTotal = signals.reduce((s, x) => s + x.count, 0)

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}
            >
              <Radar size={20} className="text-gold-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight gradient-gold">Watchlist Radar</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-layer confluence scoring · {rows.length} saham dianalisis
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass card-hover text-xs font-semibold disabled:opacity-50 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
          {([
            { label: 'High Conviction (≥60)', value: highConviction, icon: Shield   as React.ElementType, color: 'text-emerald-400', accentColor: 'rgba(34,197,94,0.12)'  },
            { label: 'Triple Confluence',      value: tripleConfl,    icon: Zap      as React.ElementType, color: 'text-gold-400',    accentColor: 'rgba(231,183,51,0.12)'  },
            { label: 'Prime Foreign Buy',      value: primeFor,       icon: Globe    as React.ElementType, color: 'text-sky-400',     accentColor: 'rgba(56,189,248,0.12)' },
            { label: 'Avg Radar Score',        value: avgScore,       icon: Activity as React.ElementType, color: 'text-amber-400',  accentColor: 'rgba(245,158,11,0.12)' },
          ]).map(k => {
            const Icon = k.icon
            return (
              <div key={k.label} className="glass metric-card card-hover" style={{ borderColor: k.accentColor }}>
                <div className="metric-label flex items-center gap-1.5">
                  <Icon size={12} className={`${k.color} opacity-80`} />
                  {k.label}
                </div>
                <div className={`metric-value text-3xl mt-1 counter ${k.color}`}>{k.value}</div>
              </div>
            )
          })}
        </div>

        {/* ── Signal Distribution Bar ─────────────────────────────────── */}
        {signals.length > 0 && signalTotal > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="section-heading">Distribusi Sinyal</span>
              <span className="text-[10px] text-muted-foreground/60">{signalTotal} sinyal aktif</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden gap-px">
              {signals
                .filter(s => s.composite_signal !== '⚪ NEUTRAL' && s.count > 0)
                .map(s => {
                  const pct = (s.count / signalTotal) * 100
                  const preset = SIGNAL_PRESETS.find(p => s.composite_signal.includes(p.value))
                  const colorMap: Record<string, string> = {
                    TRIPLE: '#a855f7', PRIME: '#38bdf8', WHALE: '#2dd4bf',
                    KSEI: '#22c55e', INSIDER: '#fb923c', 'INST BUY': '#06b6d4',
                  }
                  const bg = colorMap[preset?.value ?? ''] ?? '#64748b'
                  return (
                    <div
                      key={s.composite_signal}
                      title={`${s.composite_signal}: ${s.count} (avg score ${s.avg_score})`}
                      style={{ width: `${pct}%`, background: bg }}
                    />
                  )
                })}
            </div>
          </div>
        )}

        {/* ── Signal Preset Pills ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setFilterSignal('ALL'); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filterSignal === 'ALL'
                ? 'bg-gold-400/20 text-gold-400 border-gold-400/40'
                : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
            }`}
          >
            Semua ({rows.length})
          </button>
          {SIGNAL_PRESETS.map(p => {
            const count = rows.filter(r => r.composite_signal?.includes(p.value)).length
            if (!count) return null
            return (
              <button
                key={p.value}
                onClick={() => { setFilterSignal(p.value); setPage(1) }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterSignal === p.value
                    ? signalBadge(p.value)
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {p.label} ({count})
              </button>
            )
          })}
        </div>

        {/* ── Filters ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-5 p-3 panel rounded-xl">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kode / sektor / grup..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-background/80 border border-border text-sm focus:outline-none focus:border-gold-400/50 transition-colors"
            />
          </div>
          <select
            value={filterSector}
            onChange={e => { setFilterSector(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-lg bg-background/80 border border-border text-sm focus:outline-none"
          >
            {sectors.map(s => <option key={s} value={s}>{s === 'ALL' ? 'Semua Sektor' : s}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground whitespace-nowrap text-xs">Min score:</span>
            <select
              value={minScore}
              onChange={e => { setMinScore(+e.target.value); setPage(1) }}
              className="px-2 py-2 rounded-lg bg-background/80 border border-border text-sm focus:outline-none"
            >
              {[0, 20, 30, 40, 50, 60, 70].map(v => <option key={v} value={v}>{v}+</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={12} />
            <span className="font-semibold text-foreground">{filtered.length}</span> saham
          </div>
        </div>

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm mb-4">
            <AlertTriangle size={15} />
            {error}
          </div>
        )}

        {/* ── Table ───────────────────────────────────────────────────── */}
        <div className="panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto table-container">
            <table className="w-full text-sm cq-table">
              <thead>
                <tr className="border-b border-border/50 text-[11px] text-muted-foreground">
                  <th className="text-left px-4 py-3 font-semibold tracking-wide">Saham</th>
                  <th className="text-left px-3 py-3 font-semibold tracking-wide hidden md:table-cell">Sektor / Grup</th>
                  <th className="text-right px-3 py-3 font-semibold tracking-wide">Harga</th>
                  <th
                    className="text-center px-3 py-3 font-semibold tracking-wide cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort('radar_score')}
                  >
                    <span className="inline-flex items-center gap-1">Score <SortIcon k="radar_score" /></span>
                  </th>
                  <th className="text-left px-3 py-3 font-semibold tracking-wide hidden lg:table-cell">Signal</th>
                  <th
                    className="text-right px-3 py-3 font-semibold tracking-wide cursor-pointer hover:text-foreground transition-colors hidden xl:table-cell"
                    onClick={() => toggleSort('foreign_broker_net_7d')}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      <Globe size={10} /> Asing 7d <SortIcon k="foreign_broker_net_7d" />
                    </span>
                  </th>
                  <th
                    className="text-right px-3 py-3 font-semibold tracking-wide cursor-pointer hover:text-foreground transition-colors hidden xl:table-cell"
                    onClick={() => toggleSort('local_inst_net_7d')}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      <Building2 size={10} /> Inst 7d <SortIcon k="local_inst_net_7d" />
                    </span>
                  </th>
                  <th
                    className="text-right px-3 py-3 font-semibold tracking-wide cursor-pointer hover:text-foreground transition-colors hidden xl:table-cell"
                    onClick={() => toggleSort('ksei_net_smart_miliar')}
                  >
                    <span className="inline-flex items-center justify-end gap-1">
                      KSEI <SortIcon k="ksei_net_smart_miliar" />
                    </span>
                  </th>
                  <th className="text-center px-3 py-3 font-semibold tracking-wide hidden md:table-cell">Sinyal</th>
                  <th className="px-3 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="px-4 py-3"><div className="shimmer h-4 rounded-lg w-16" /></td>
                      <td className="px-3 py-3 hidden md:table-cell"><div className="shimmer h-4 rounded-lg w-32" /></td>
                      <td className="px-3 py-3"><div className="shimmer h-4 rounded-lg w-16 ml-auto" /></td>
                      <td className="px-3 py-3"><div className="shimmer h-6 rounded-lg w-10 mx-auto" /></td>
                      <td className="px-3 py-3 hidden lg:table-cell"><div className="shimmer h-5 rounded-lg w-36" /></td>
                      <td className="px-3 py-3 hidden xl:table-cell"><div className="shimmer h-4 rounded-lg w-12 ml-auto" /></td>
                      <td className="px-3 py-3 hidden xl:table-cell"><div className="shimmer h-4 rounded-lg w-12 ml-auto" /></td>
                      <td className="px-3 py-3 hidden xl:table-cell"><div className="shimmer h-4 rounded-lg w-12 ml-auto" /></td>
                      <td className="px-3 py-3 hidden md:table-cell"><div className="shimmer h-4 rounded-lg w-16 mx-auto" /></td>
                      <td className="px-3 py-3" />
                    </tr>
                  ))
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      Tidak ada saham yang memenuhi filter saat ini
                    </td>
                  </tr>
                ) : paged.map((r) => (
                  <tr key={r.stock_code} className="border-b border-border/30 tr-hover">

                    {/* Stock code + badges */}
                    <td className="px-4 py-3" data-label="Saham">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/stock/${r.stock_code}`}
                          prefetch={false}
                          className="font-mono font-bold text-sm text-foreground hover:text-gold-400 transition-colors"
                        >
                          {r.stock_code}
                        </Link>
                        {r.whale_signal && <span title="Whale Signal" className="text-xs">🐋</span>}
                        {r.fresh_insider_buy && <span title="Fresh Insider Buy" className="text-xs">🔑</span>}
                      </div>
                    </td>

                    {/* Sector / Group */}
                    <td className="px-3 py-3 hidden md:table-cell" data-label="Sektor / Grup">
                      <div className="text-xs text-muted-foreground leading-tight">
                        <div>{r.sector || '—'}</div>
                        {r.group_name && r.group_name !== 'Others' && (
                          <div className="text-gold-400/70 truncate max-w-[160px]">{r.group_name}</div>
                        )}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="px-3 py-3 text-right" data-label="Harga">
                      <div className="font-semibold counter text-sm">{r.close.toLocaleString('id-ID')}</div>
                      <div className={`text-xs font-medium ${r.change_percent > 0 ? 'text-emerald-400' : r.change_percent < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {r.change_percent > 0 ? '+' : ''}{r.change_percent?.toFixed(2)}%
                      </div>
                    </td>

                    {/* Radar Score */}
                    <td className="px-3 py-3" data-label="Score">
                      <div className="flex flex-col items-end md:items-center gap-1">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md border counter ${scoreColor(r.radar_score)}`}
                          style={{ boxShadow: scoreGlow(r.radar_score) }}
                        >
                          {r.radar_score}
                        </span>
                        <div className="w-10 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${scoreBg(r.radar_score)}`}
                            style={{
                              width: `${r.radar_score}%`,
                              boxShadow: scoreGlow(r.radar_score),
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Signal */}
                    <td className="px-3 py-3 hidden lg:table-cell" data-label="Signal">
                      <span className={`text-xs px-2 py-1 rounded-md border font-medium ${signalBadge(r.composite_signal || '')}`}>
                        {r.composite_signal || '⚪ NEUTRAL'}
                      </span>
                    </td>

                    {/* Foreign Broker 7d */}
                    <td className={`px-3 py-3 text-right text-xs font-semibold counter hidden xl:table-cell ${netColor(r.foreign_broker_net_7d)}`} data-label="Asing 7d">
                      {fmtM(r.foreign_broker_net_7d)}
                    </td>

                    {/* Local Inst 7d */}
                    <td className={`px-3 py-3 text-right text-xs font-semibold counter hidden xl:table-cell ${netColor(r.local_inst_net_7d)}`} data-label="Inst 7d">
                      {fmtM(r.local_inst_net_7d)}
                    </td>

                    {/* KSEI */}
                    <td className={`px-3 py-3 text-right text-xs font-semibold counter hidden xl:table-cell ${netColor(r.ksei_net_smart_miliar)}`} data-label="KSEI 7d">
                      {fmtM(r.ksei_net_smart_miliar)}
                    </td>

                    {/* Market signal */}
                    <td className="px-3 py-3 hidden md:table-cell text-center" data-label="Sinyal">
                      <span className="text-xs text-muted-foreground">{r.market_signal || '—'}</span>
                    </td>

                    {/* Link */}
                    <td className="px-3 py-3" data-label="Aksi">
                      <Link
                        href={`/stock/${r.stock_code}`}
                        prefetch={false}
                        className="text-muted-foreground hover:text-gold-400 transition-colors flex justify-end md:justify-center"
                      >
                        <ExternalLink size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <span className="text-xs text-muted-foreground">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  ← Prev
                </button>
                <span className="px-3 py-1.5 text-xs text-muted-foreground">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent disabled:opacity-40 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Signal Distribution Cards ────────────────────────────────── */}
        {signals.length > 0 && (
          <div className="mt-6">
            <h2 className="section-heading mb-3">Breakdown Per Sinyal</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger">
              {signals.filter(s => s.composite_signal !== '⚪ NEUTRAL').map(s => (
                <button
                  key={s.composite_signal}
                  onClick={() => {
                    const preset = SIGNAL_PRESETS.find(p => s.composite_signal.includes(p.value))
                    if (preset) { setFilterSignal(preset.value); setPage(1) }
                  }}
                  className="p-3 glass card-hover rounded-xl text-left cursor-pointer transition-all"
                >
                  <div className={`text-xs font-bold mb-2 px-2 py-0.5 rounded border inline-block ${signalBadge(s.composite_signal)}`}>
                    {s.composite_signal}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xl font-black counter text-foreground">{s.count}</div>
                      <div className="text-[10px] text-muted-foreground">saham</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold counter text-foreground">{s.avg_score}</div>
                      <div className="text-[10px] text-muted-foreground">avg score</div>
                    </div>
                  </div>
                  {/* Mini score bar */}
                  <div className="mt-2 h-1 w-full bg-background/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.avg_score >= 70 ? 'bg-emerald-500' : s.avg_score >= 55 ? 'bg-sky-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${s.avg_score}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Legend ──────────────────────────────────────────────────── */}
        <div className="mt-6 p-4 panel rounded-xl text-xs text-muted-foreground">
          <div className="font-semibold text-foreground mb-2 section-heading">Cara baca Radar Score (0–100)</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {[
              { color: 'bg-emerald-500', label: '70–100: High conviction' },
              { color: 'bg-sky-500',     label: '55–69: Strong signal' },
              { color: 'bg-amber-500',   label: '40–54: Watch list' },
              { color: 'bg-slate-600',   label: '0–39: Weak / neutral' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${l.color}`} />
                <span>{l.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-1 border-t border-border/30 pt-2">
            <div><Globe size={10} className="inline mr-1" /><strong>Asing:</strong> net broker foreign (JP Morgan, UBS, CLSA)</div>
            <div><Building2 size={10} className="inline mr-1" /><strong>Inst:</strong> net broker lokal institusi (BCA, Mandiri, BNI)</div>
            <div><strong>KSEI:</strong> perubahan CP+PF+IB dari monthly snapshot</div>
          </div>
        </div>

      </div>
    </div>
  )
}
