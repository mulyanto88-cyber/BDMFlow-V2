'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, TrendingUp, TrendingDown, Activity, Loader2, Search,
  AlertCircle, RefreshCw, ArrowUpRight, ArrowDownRight, Zap,
  ChevronUp, ChevronDown, Eye, Brain, X, Star, Filter,
  Shield, Crown, Building2, Clock, BarChart2, Target, Flame,
  ArrowRight, Info, ExternalLink,
} from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, ScatterChart, Scatter, ZAxis,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Summary {
  total_tx: number
  total_buy: number
  total_sell: number
  unique_stocks: number
  unique_insiders: number
  total_buy_value: number
  total_sell_value: number
  internal_tx: number
  pengendali_tx: number
  direksi_tx: number
  komisaris_tx: number
}

interface ClusterRow {
  insider_name: string
  derived_type: string
  stock_count: number
  tx_count: number
  buy_count: number
  sell_count: number
  stocks: string
  groups: string
  sectors: string
  total_pct_buy: number
  total_pct_sell: number
  last_tx: string
  first_tx: string
  span_days: number
  cluster_signal: string
}

interface FeedRow {
  transaction_date: string
  stock_code: string
  insider_name: string
  insider_type: string
  action_type: 'BUY' | 'SELL'
  shares_change: number
  pct_change: number
  pct_previous: number
  pct_current: number
  price_formatted: number
  broker_code: string
  broker_group: string
  source_type: string
  badges: string
  is_pengendali: boolean
  is_komisaris: boolean
  is_direksi: boolean
  est_value_miliar: number
  days_ago: number
  recency_label: string
}

interface ScreenerRow {
  stock_code: string
  company_name: string | null
  sector: string | null
  conviction_score: number
  insider_signal: string | null
  last_insider_date: string
  insider_tx_count: number
  internal_buy: number
  internal_sell: number
  fresh_internal_buy: number
  fresh_internal_sell: number
  overall_direction: string
  direction_30d: string
  buy_pressure_pct: number
  net_pct_alltime: number
  net_pct_30d: number
  unique_insiders: number
  tx_last30d: number
  tx_last7d: number
  current_price: number
  price_change_pct: number
  whale_signal: boolean
  market_signal: string | null
  composite_signal: string | null
  free_float: number
  group_name: string | null
  buy_count_30d: number
  sell_count_30d: number
}

interface ConvictionRow {
  stock_code: string
  company_name: string | null
  sector: string | null
  latest_tx: string
  days_since_tx: number
  recency_tag: 'FRESH' | 'RECENT' | 'AGING' | 'STALE'
  total_tx: number
  internal_buy: number
  internal_sell: number
  score_alltime: number
  score_30d: number
  conviction_score: number
  insider_signal: string | null
  fresh_internal_buy: number
  fresh_internal_sell: number
  current_price: number
  price_change_pct: number
}

interface AlertRow {
  transaction_date: string
  stock_code: string
  insider_name: string
  insider_type: string
  action_type: 'BUY' | 'SELL'
  shares_change: number
  pct_change: number
  pct_previous: number
  pct_current: number
  price_formatted: number
  broker_code: string
  broker_group: string
  alert_level: string
  est_value_miliar: number
  days_ago: number
  current_price: number
  sector: string | null
  market_signal: string | null
  group_name: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number | null | undefined, dec = 2) =>
  n == null || isNaN(n) ? '–' : n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec })

const fmtShares = (n: number) => {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(2)} M` // miliar
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1)}Jt`
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}Rb`
  return n.toLocaleString('id-ID')
}

const signalColor = (s: string | null) => {
  if (!s) return 'text-muted-foreground/50'
  const u = s.toUpperCase()
  if (u.includes('STRONG_BUY') || u.includes('BULLISH') || u === 'ACCUMULATING') return 'text-emerald-400'
  if (u.includes('BUY'))   return 'text-emerald-400/80'
  if (u.includes('STRONG_SELL') || u.includes('BEARISH') || u === 'DISTRIBUTING') return 'text-red-400'
  if (u.includes('SELL'))  return 'text-red-400/80'
  return 'text-amber-400/70'
}

const alertBg = (level: string) => {
  if (level === 'HIGH')   return 'bg-red-500/[0.12] border-red-500/25 text-red-400'
  if (level === 'MEDIUM') return 'bg-amber-500/[0.12] border-amber-500/25 text-amber-400'
  return 'bg-muted/30 border-border/30 text-muted-foreground'
}

const insiderBadge = (row: FeedRow | AlertRow) => {
  const badges = []
  if ((row as FeedRow).is_pengendali) badges.push({ label: 'PENGENDALI', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25' })
  if ((row as FeedRow).is_direksi)    badges.push({ label: 'DIREKSI',    cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' })
  if ((row as FeedRow).is_komisaris)  badges.push({ label: 'KOMISARIS',  cls: 'bg-sky-500/15 text-sky-400 border-sky-500/25' })
  if (!badges.length && row.insider_type) badges.push({ label: row.insider_type, cls: 'bg-muted/30 text-muted-foreground border-border/30' })
  return badges
}

const convictionBar = (score: number) => {
  const pct = Math.min(Math.max(score, 0), 100)
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  return { pct, color }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function apiFetch(params: Record<string, string | number>) {
  const qs = new URLSearchParams(
    Object.entries(params).reduce((a, [k, v]) => ({ ...a, [k]: String(v) }), {} as Record<string, string>)
  )
  const res = await fetch(`/api/insider?${qs}`)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`)
  return json
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, accent = false }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; accent?: boolean
}) {
  return (
    <div
      className={`metric-card card-hover flex flex-col gap-2 relative overflow-hidden group ${
        accent ? 'border-[rgba(231,183,51,0.25)]' : ''
      }`}
      style={accent ? {
        background: 'linear-gradient(135deg, rgba(231,183,51,0.15), rgba(231,183,51,0.05))',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 20px -2px rgba(231,183,51,0.1)',
      } : undefined}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:opacity-10 transition-opacity duration-500"></div>
      <div className="flex items-center justify-between relative z-10">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-muted-foreground/60">{label}</p>
        <span className={accent ? 'text-primary' : 'text-muted-foreground/40'}>{icon}</span>
      </div>
      <p className={`text-[28px] font-black leading-none tracking-tight font-mono relative z-10 mt-1 ${accent ? 'bg-gradient-to-br from-[#E7B733] to-[#B38711] text-transparent bg-clip-text' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground/50 mt-1 relative z-10">{sub}</p>}
    </div>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-bold rounded-xl transition-all duration-300 relative overflow-hidden',
        active
          ? 'text-primary shadow-[0_2px_10px_-2px_rgba(231,183,51,0.2)]'
          : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04]',
      ].join(' ')}
    >
      {active && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
      )}
      {active && (
        <div className="absolute inset-0 border border-primary/20 rounded-xl pointer-events-none"></div>
      )}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  )
}

function Badge({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-[7.5px] font-black px-1.5 py-[2px] rounded-md border ${cls}`}>{label}</span>
  )
}

function StockDetailDialog({ stock, history, loading, onClose }: { stock: string; history: FeedRow[]; loading: boolean; onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[85vh] bg-[#0A1228] rounded-[16px] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <h2 className="text-[20px] font-black text-foreground">{stock}</h2>
            <div className="h-4 w-px bg-white/[0.1]"></div>
            <p className="text-[11px] text-muted-foreground/60 font-mono tracking-widest uppercase">All-time Insider History</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/stock/${stock}`} prefetch={false} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-bold transition-colors">
              <BarChart2 size={12} className="text-primary" /> Stock Dashboard
            </Link>
            <Link href={`/broker-tracker?code=${stock}`} prefetch={false} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-bold transition-colors">
              <Activity size={12} className="text-purple-400" /> Broker Summary
            </Link>
            <div className="h-4 w-px bg-white/[0.1] mx-1"></div>
            <button onClick={onClose} className="p-1.5 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.05] rounded-md transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground/40 gap-2">
              <Loader2 size={18} className="animate-spin" /><span className="text-[12px]">Memuat riwayat transaksi…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/30 gap-2">
              <Activity size={32} /><p className="text-[13px]">Tidak ada riwayat transaksi</p>
            </div>
          ) : (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  {['Tanggal','Insider','Tipe','Aksi','Δ%','% Curr','Saham','Est. Value'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-bold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-3 py-2.5 font-mono text-muted-foreground/60">{row.transaction_date}</td>
                    <td className="px-3 py-2.5 max-w-[160px]">
                      <p className="font-semibold text-foreground/80 truncate">{row.insider_name}</p>
                      <div className="flex gap-1 mt-0.5">
                        {insiderBadge(row).map(b => <Badge key={b.label} label={b.label} cls={b.cls} />)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground/50">{row.insider_type}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-black text-[9px] px-2 py-0.5 rounded-md ${
                        row.action_type === 'BUY' ? 'bg-emerald-500/[0.15] text-emerald-400' : 'bg-red-500/[0.15] text-red-400'
                      }`}>{row.action_type}</span>
                    </td>
                    <td className={`px-3 py-2.5 font-black font-mono ${row.pct_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {row.pct_change >= 0 ? '+' : ''}{fmt(row.pct_change, 3)}%
                    </td>
                    <td className="px-3 py-2.5 font-mono text-foreground/70">{fmt(row.pct_current, 2)}%</td>
                    <td className="px-3 py-2.5 font-mono text-muted-foreground/60">{fmtShares(Math.abs(row.shares_change))}</td>
                    <td className="px-3 py-2.5 font-mono text-foreground/70">{row.est_value_miliar > 0 ? `${fmt(row.est_value_miliar, 1)} M` : '\u2013'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InsiderPage() {
  const [tab, setTab]         = useState<'alerts'|'feed'|'cluster'|'screener'|'conviction'>('alerts')
  const [days, setDays]       = useState(30)
  const [actionFilter, setActionFilter] = useState('')
  const [insiderFilter, setInsiderFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'' | 'IDX' | 'KSEI'>('')
  const [realOnly, setRealOnly] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [sortBy, setSortBy]   = useState<string>('conviction_score')
  const [sortAsc, setSortAsc] = useState(false)

  const [summary,    setSummary]    = useState<Summary | null>(null)
  const [feed,       setFeed]       = useState<FeedRow[]>([])
  const [screener,   setScreener]   = useState<ScreenerRow[]>([])
  const [conviction, setConviction] = useState<ConvictionRow[]>([])
  const [alerts,     setAlerts]     = useState<AlertRow[]>([])
  const [cluster,    setCluster]    = useState<ClusterRow[]>([])
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [lastFetch,  setLastFetch]  = useState<Date | null>(null)

  // Stock Detail Dialog State
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [stockHistory, setStockHistory] = useState<FeedRow[]>([])
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false)

  // Fetch stock history when selectedStock changes
  useEffect(() => {
    if (!selectedStock) {
      setStockHistory([])
      return
    }
    setStockHistoryLoading(true)
    apiFetch({ action: 'feed', days: 9999, code: selectedStock, limit: 1000 })
      .then(res => setStockHistory(res.data ?? []))
      .catch(err => console.error(err))
      .finally(() => setStockHistoryLoading(false))
  }, [selectedStock])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const results = await Promise.allSettled([
        apiFetch({ action: 'summary', days, source_type: sourceFilter, real_only: String(realOnly) }),
        apiFetch({ action: 'alerts',  days, limit: 200 }),
        apiFetch({ action: 'feed',    days, limit: 200, action_type: actionFilter, insider_type: insiderFilter,
                   source_type: sourceFilter, real_only: String(realOnly) }),
        apiFetch({ action: 'screener',days, limit: 150, action_type: actionFilter }),
        apiFetch({ action: 'conviction' }),
        apiFetch({ action: 'cluster', days, source_type: sourceFilter }),
      ])
      const [sumRes, alertRes, feedRes, scrRes, convRes, clusterRes] = results
      // Each section renders independently — one failing query must not blank the whole page.
      const val = <T,>(r: PromiseSettledResult<any>, fb: T): T =>
        r.status === 'fulfilled' ? (r.value?.data ?? fb) : fb
      setSummary(val(sumRes, null))
      setAlerts(val(alertRes, []))
      setFeed(val(feedRes, []))
      setScreener(val(scrRes, []))
      setConviction(val(convRes, []))
      setCluster(val(clusterRes, []))
      setLastFetch(new Date())
      const failed = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
      setError(failed.length ? `${failed.length} bagian gagal dimuat — ${failed[0].reason?.message ?? 'error'}` : '')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [days, actionFilter, insiderFilter, sourceFilter, realOnly])

  useEffect(() => { load() }, [load])

  // ── Derived / filtered data ───────────────────────────────────────────────
  const filteredFeed = useMemo(() => {
    let rows = feed
    if (searchQ) {
      const q = searchQ.toUpperCase()
      rows = rows.filter(r => r.stock_code.includes(q) || r.insider_name.toUpperCase().includes(q))
    }
    return rows
  }, [feed, searchQ])

  const filteredAlerts = useMemo(() => {
    let rows = alerts
    if (searchQ) {
      const q = searchQ.toUpperCase()
      rows = rows.filter(r => r.stock_code.includes(q) || r.insider_name.toUpperCase().includes(q))
    }
    return rows
  }, [alerts, searchQ])

  const sortedScreener = useMemo(() => {
    let rows = [...screener]
    if (searchQ) {
      const q = searchQ.toUpperCase()
      rows = rows.filter(r => r.stock_code.includes(q) || (r.company_name ?? '').toUpperCase().includes(q))
    }
    rows.sort((a, b) => {
      const av = (a as any)[sortBy] ?? 0
      const bv = (b as any)[sortBy] ?? 0
      return sortAsc ? av - bv : bv - av
    })
    return rows
  }, [screener, searchQ, sortBy, sortAsc])

  const sortedConviction = useMemo(() => {
    let rows = [...conviction]
    if (searchQ) {
      const q = searchQ.toUpperCase()
      rows = rows.filter(r => r.stock_code.includes(q) || (r.company_name ?? '').toUpperCase().includes(q))
    }
    return rows
  }, [conviction, searchQ])

  // bar chart for buy vs sell by conviction
  const topConvictionChart = useMemo(() =>
    sortedConviction.slice(0, 15).map(r => ({
      code: r.stock_code,
      buy: r.internal_buy,
      sell: r.internal_sell,
      score: r.conviction_score,
    })), [sortedConviction])

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col
      ? sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />
      : <ChevronDown size={10} className="opacity-20" />

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortAsc(!sortAsc)
    else { setSortBy(col); setSortAsc(false) }
  }

  return (
    <div className="sidebar-offset min-h-screen bg-background text-foreground">
      {selectedStock && (
        <StockDetailDialog 
          stock={selectedStock} 
          history={stockHistory} 
          loading={stockHistoryLoading} 
          onClose={() => setSelectedStock(null)} 
        />
      )}

      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(231,183,51,0.15), rgba(231,183,51,0.06))',
                border: '1px solid rgba(231,183,51,0.2)',
              }}
            >
              <Users size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-[20px] font-black tracking-tight leading-none">Insider Radar</h1>
              <p className="text-[11px] text-muted-foreground/50 mt-[3px] uppercase tracking-[0.15em]">
                Analisa Transaksi Insider &amp; Major Holder · IDX Market
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Days filter */}
            {[7,14,30,60,90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={[
                  'text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-150',
                  days === d
                    ? 'bg-primary/[0.12] text-primary border border-primary/20'
                    : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] border border-transparent',
                ].join(' ')}
              >{d}D</button>
            ))}
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* ── Error ──────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-[12px]">
            <AlertCircle size={14} />{error}
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
          <KpiCard
            label="Total Transaksi"
            value={summary?.total_tx?.toLocaleString('id-ID') ?? '–'}
            sub={`${days}D terakhir`}
            icon={<Activity size={15} />}
          />
          <KpiCard
            label="Buy / Sell"
            value={`${summary?.total_buy ?? '–'} / ${summary?.total_sell ?? '–'}`}
            sub={`${summary ? Math.round((summary.total_buy / (summary.total_tx||1)) * 100) : 0}% buy pressure`}
            icon={summary && summary.total_buy > summary.total_sell
              ? <TrendingUp size={15} className="text-emerald-400" />
              : <TrendingDown size={15} className="text-red-400" />}
            accent={!!(summary && summary.total_buy > summary.total_sell)}
          />
          <KpiCard
            label="Saham Aktif"
            value={summary?.unique_stocks ?? '–'}
            sub={`${summary?.unique_insiders ?? '–'} insider unik`}
            icon={<Target size={15} />}
          />
          <KpiCard
            label="Transaksi Internal"
            value={summary?.internal_tx ?? '–'}
            sub={summary ? `Peng.${summary.pengendali_tx} · Dir.${summary.direksi_tx} · Kom.${summary.komisaris_tx}` : '–'}
            icon={<Shield size={15} />}
          />
        </div>

        {/* ── Action + Search filters ─────────────────────────────────────── */}
        <div className="panel flex items-center gap-4 flex-wrap p-3">
          {/* Tabs */}
          <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
            <TabBtn active={tab === 'alerts'}     onClick={() => setTab('alerts')}>
              <Flame size={14} className={tab === 'alerts' ? 'text-orange-400' : ''} /> Alert Feed
            </TabBtn>
            <TabBtn active={tab === 'feed'}       onClick={() => setTab('feed')}>
              <Activity size={14} className={tab === 'feed' ? 'text-blue-400' : ''} /> Activity Feed
            </TabBtn>
            <TabBtn active={tab === 'cluster'}    onClick={() => setTab('cluster')}>
              <Users size={14} className={tab === 'cluster' ? 'text-pink-400' : ''} /> Cluster
              {cluster.length > 0 && (
                <span className="ml-1 text-[8px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 font-black">
                  {cluster.length} 🔥
                </span>
              )}
            </TabBtn>
            <TabBtn active={tab === 'screener'}   onClick={() => setTab('screener')}>
              <Filter size={14} className={tab === 'screener' ? 'text-emerald-400' : ''} /> Screener
            </TabBtn>
            <TabBtn active={tab === 'conviction'} onClick={() => setTab('conviction')}>
              <Brain size={14} className={tab === 'conviction' ? 'text-purple-400' : ''} /> Conviction
            </TabBtn>
          </div>

          <div className="h-6 w-px bg-white/10 hidden xl:block" />

          {/* Action filter */}
          <div className="flex gap-1">
            {['', 'BUY', 'SELL'].map(v => (
              <button
                key={v}
                onClick={() => setActionFilter(v)}
                className={[
                  'text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150',
                  actionFilter === v
                    ? v === 'BUY'  ? 'bg-emerald-500/[0.15] text-emerald-400 border-emerald-500/25'
                    : v === 'SELL' ? 'bg-red-500/[0.15] text-red-400 border-red-500/25'
                    : 'bg-white/[0.08] text-foreground border-white/[0.12]'
                    : 'text-muted-foreground/50 border-transparent hover:border-white/[0.08] hover:text-foreground',
                ].join(' ')}
              >{v || 'ALL'}</button>
            ))}
          </div>

          {/* Insider type filter */}
          <div className="flex gap-1">
            {[['', 'SEMUA'], ['INTERNAL', 'INTERNAL'], ['PENGENDALI', 'PENGENDALI'], ['DIREKSI', 'DIREKSI'], ['KOMISARIS', 'KOMISARIS']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setInsiderFilter(v)}
                className={[
                  'text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150',
                  insiderFilter === v
                    ? 'bg-primary/[0.1] text-primary border-primary/20'
                    : 'text-muted-foreground/50 border-transparent hover:border-white/[0.08] hover:text-foreground',
                ].join(' ')}
              >{l}</button>
            ))}
          </div>

          <div className="h-6 w-px bg-white/10 hidden xl:block" />

          {/* Source filter */}
          <div className="flex gap-1">
            {(['', 'IDX', 'KSEI'] as const).map(v => (
              <button
                key={v}
                onClick={() => setSourceFilter(v)}
                className={[
                  'text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150',
                  sourceFilter === v
                    ? v === 'IDX'  ? 'bg-blue-500/[0.15] text-blue-400 border-blue-500/25'
                    : v === 'KSEI' ? 'bg-purple-500/[0.15] text-purple-400 border-purple-500/25'
                    : 'bg-white/[0.08] text-foreground border-white/[0.12]'
                    : 'text-muted-foreground/50 border-transparent hover:border-white/[0.08] hover:text-foreground',
                ].join(' ')}
              >{v || 'ALL'}</button>
            ))}
          </div>

          {/* Real Insider toggle */}
          <button
            onClick={() => setRealOnly(!realOnly)}
            title={realOnly ? 'Tampilkan semua (termasuk major holder)' : 'Hanya direksi/komisaris/pengendali'}
            className={[
              'flex items-center gap-1.5 text-[10.5px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-150',
              realOnly
                ? 'bg-emerald-500/[0.15] text-emerald-400 border-emerald-500/25'
                : 'text-muted-foreground/50 border-transparent hover:border-white/[0.08] hover:text-foreground',
            ].join(' ')}
          >
            <Shield size={11} />
            REAL ONLY
          </button>

          {/* Search */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
              <input
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Cari kode / nama…"
                className="pl-7 pr-3 py-1.5 text-[11px] bg-white/[0.04] border border-white/[0.07] rounded-lg outline-none focus:border-primary/40 text-foreground placeholder:text-muted-foreground/30 w-[160px]"
              />
              {searchQ && (
                <button onClick={() => setSearchQ('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={10} className="text-muted-foreground/40" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════ TAB: ALERT FEED ════════════════════════════════ */}
        {tab === 'alerts' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground/50 font-mono">{filteredAlerts.length} alerts · {days}D</p>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-muted-foreground/30 font-mono">sorted by alert level</span>
              </div>
            </div>

            {loading && !alerts.length ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground/40 gap-2">
                <Loader2 size={18} className="animate-spin" /><span className="text-[12px]">Memuat alert feed…</span>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/30 gap-2">
                <Eye size={32} /><p className="text-[13px]">Tidak ada alert ditemukan</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredAlerts.map((row, i) => (
                  <div
                    key={`${row.stock_code}-${row.transaction_date}-${i}`}
                    className={`rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap card-hover ${
                      row.alert_level === 'HIGH'
                        ? 'bg-red-500/[0.06] border border-red-500/[0.15]'
                        : row.alert_level === 'MEDIUM'
                        ? 'bg-amber-500/[0.06] border border-amber-500/[0.15]'
                        : 'glass'
                    }`}
                  >
                    {/* Alert badge */}
                    <span className={`text-[7px] font-black px-2 py-1 rounded-md border flex-shrink-0 ${alertBg(row.alert_level)}`}>
                      {row.alert_level}
                    </span>

                    {/* Stock + action */}
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <button onClick={() => setSelectedStock(row.stock_code)} className="text-[13px] font-black text-foreground hover:text-primary transition-colors text-left">
                        {row.stock_code}
                      </button>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          row.action_type === 'BUY'
                            ? 'bg-emerald-500/[0.15] text-emerald-400'
                            : 'bg-red-500/[0.15] text-red-400'
                        }`}
                      >
                        {row.action_type}
                      </span>
                    </div>

                    {/* Insider name + type */}
                    <div className="flex-1 min-w-[150px]">
                      <p className="text-[11px] font-semibold text-foreground/80 truncate max-w-[220px]">{row.insider_name}</p>
                      <p className="text-[9px] text-muted-foreground/45 mt-0.5">{row.insider_type}</p>
                    </div>

                    {/* Pct change */}
                    <div className="text-right min-w-[80px]">
                      <p className={`text-[13px] font-black font-mono ${row.pct_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.pct_change >= 0 ? '+' : ''}{fmt(row.pct_change, 3)}%
                      </p>
                      <p className="text-[9px] text-muted-foreground/40 font-mono">
                        {fmt(row.pct_previous, 2)}% → {fmt(row.pct_current, 2)}%
                      </p>
                    </div>

                    {/* Est value */}
                    {row.est_value_miliar > 0 && (
                      <div className="text-right min-w-[70px]">
                        <p className="text-[11px] font-bold font-mono text-foreground/70">
{fmt(row.est_value_miliar, 1)} M
                        </p>
                        <p className="text-[9px] text-muted-foreground/40">Est. value</p>
                      </div>
                    )}

                    {/* Sector + signal */}
                    <div className="flex items-center gap-2">
                      {row.sector && (
                        <span className="text-[8.5px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-muted-foreground/50">
                          {row.sector}
                        </span>
                      )}
                      {row.market_signal && (
                        <span className={`text-[8.5px] font-bold ${signalColor(row.market_signal)}`}>
                          {row.market_signal}
                        </span>
                      )}
                    </div>

                    {/* Date */}
                    <p className="text-[9px] text-muted-foreground/35 font-mono ml-auto flex-shrink-0">
                      {row.transaction_date} · {row.days_ago}h lalu
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: ACTIVITY FEED ════════════════════════════ */}
        {tab === 'feed' && (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground/50 font-mono">{filteredFeed.length} transaksi · {days}D terakhir</p>

            {loading && !feed.length ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground/40 gap-2">
                <Loader2 size={18} className="animate-spin" /><span className="text-[12px]">Memuat activity feed…</span>
              </div>
            ) : filteredFeed.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/30 gap-2">
                <Activity size={32} /><p className="text-[13px]">Tidak ada transaksi ditemukan</p>
              </div>
            ) : (
              <div className="rounded-[14px] overflow-hidden border border-white/[0.06]">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-border/50">
                      {['Tanggal','Kode','Insider','Tipe','Aksi','Δ%','% Prev → Curr','Saham','Broker','Est. Value','Source'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-[9px] uppercase tracking-[0.15em] text-muted-foreground/40 font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeed.map((row, i) => (
                      <tr
                        key={`${row.stock_code}-${row.transaction_date}-${i}`}
                        className="tr-hover border-b border-white/[0.03]"
                      >
                        <td className="px-3 py-2 font-mono text-muted-foreground/50 whitespace-nowrap">{row.transaction_date}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => setSelectedStock(row.stock_code)} className="font-black text-foreground hover:text-primary transition-colors text-left">
                            {row.stock_code}
                          </button>
                        </td>
                        <td className="px-3 py-2 max-w-[160px]">
                          <p className="font-semibold text-foreground/80 truncate">{row.insider_name}</p>
                          <div className="flex gap-1 mt-0.5">
                            {insiderBadge(row).map(b => (
                              <Badge key={b.label} label={b.label} cls={b.cls} />
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground/50">{row.insider_type}</td>
                        <td className="px-3 py-2">
                          <span className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                            row.action_type === 'BUY'
                              ? 'bg-emerald-500/[0.15] text-emerald-400'
                              : 'bg-red-500/[0.15] text-red-400'
                          }`}>
                            {row.action_type}
                          </span>
                        </td>
                        <td className={`px-3 py-2 font-black font-mono ${row.pct_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.pct_change >= 0 ? '+' : ''}{fmt(row.pct_change, 3)}%
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground/60">
                          {fmt(row.pct_previous, 2)} → {fmt(row.pct_current, 2)}
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground/50">{fmtShares(Math.abs(row.shares_change))}</td>
                        <td className="px-3 py-2">
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] font-mono text-muted-foreground/50">
                            {row.broker_code || row.broker_group || '–'}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-foreground/60">
{row.est_value_miliar > 0 ? `${fmt(row.est_value_miliar, 1)} M` : '\u2013'}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border ${
                            row.source_type === 'IDX'
                              ? 'bg-blue-500/[0.1] text-blue-400 border-blue-500/20'
                              : 'bg-muted/20 text-muted-foreground/50 border-border/20'
                          }`}>
                            {row.source_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: SCREENER ══════════════════════════════════ */}
        {tab === 'screener' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground/50 font-mono">{sortedScreener.length} saham · insider + market composite</p>
            </div>

            {loading && !screener.length ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground/40 gap-2">
                <Loader2 size={18} className="animate-spin" /><span className="text-[12px]">Memuat screener…</span>
              </div>
            ) : (
              <div className="rounded-[14px] overflow-hidden border border-white/[0.06]">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-border/50">
                      {[
                        ['stock_code',       'Kode'],
                        ['sector',           'Sektor'],
                        ['conviction_score', 'Conviction'],
                        ['direction_30d',    'Arah 30D'],
                        ['buy_pressure_pct', 'Buy Press.'],
                        ['net_pct_30d',      'Δ% 30D'],
                        ['tx_last30d',       'Tx 30D'],
                        ['tx_last7d',        'Tx 7D'],
                        ['fresh_internal_buy','Int.Buy'],
                        ['composite_signal', 'Composite Signal'],
                        ['current_price',    'Harga'],
                        ['price_change_pct', 'Δ Harga'],
                      ].map(([col, label]) => (
                        <th
                          key={col}
                          className="text-left px-3 py-2.5 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/40 font-bold whitespace-nowrap cursor-pointer hover:text-muted-foreground/70 transition-colors select-none"
                          onClick={() => toggleSort(col)}
                        >
                          <div className="flex items-center gap-1">
                            {label} <SortIcon col={col} />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScreener.map((row, i) => {
                      const { pct, color } = convictionBar(row.conviction_score)
                      return (
                        <tr
                          key={row.stock_code}
                          className="tr-hover border-b border-white/[0.03]"
                        >
                          <td className="px-3 py-2.5">
                            <button onClick={() => setSelectedStock(row.stock_code)} className="font-black text-foreground hover:text-primary transition-colors text-left">
                              {row.stock_code}
                            </button>
                            {row.company_name && (
                              <p className="text-[9px] text-muted-foreground/40 truncate max-w-[100px] mt-0.5">{row.company_name}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground/50">{row.sector ?? '–'}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="relative w-16 h-1.5 rounded-full bg-white/[0.08]">
                                <div
                                  className="absolute left-0 top-0 h-full rounded-full transition-all"
                                  style={{ width: `${pct}%`, background: color }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[10.5px]" style={{ color }}>
                                {fmt(row.conviction_score, 0)}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[9px] font-bold ${signalColor(row.direction_30d)}`}>
                              {row.direction_30d ?? '–'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-mono">
                            <span className={row.buy_pressure_pct >= 50 ? 'text-emerald-400' : 'text-red-400'}>
                              {fmt(row.buy_pressure_pct, 0)}%
                            </span>
                          </td>
                          <td className={`px-3 py-2.5 font-mono font-bold ${row.net_pct_30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {row.net_pct_30d >= 0 ? '+' : ''}{fmt(row.net_pct_30d, 3)}%
                          </td>
                          <td className="px-3 py-2.5 font-mono text-foreground/60">{row.tx_last30d}</td>
                          <td className="px-3 py-2.5 font-mono text-foreground/60">{row.tx_last7d}</td>
                          <td className="px-3 py-2.5">
                            <span className="text-emerald-400 font-bold font-mono">{row.fresh_internal_buy}</span>
                            <span className="text-muted-foreground/30 mx-1">/</span>
                            <span className="text-red-400 font-bold font-mono">{row.fresh_internal_sell}</span>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.composite_signal && (
                              <span className={`text-[8.5px] font-bold ${signalColor(row.composite_signal)}`}>
                                {row.composite_signal}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-foreground/70">
                            {row.current_price > 0 ? row.current_price.toLocaleString('id-ID') : '–'}
                          </td>
                          <td className={`px-3 py-2.5 font-mono font-bold ${(row.price_change_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(row.price_change_pct ?? 0) >= 0 ? '+' : ''}{fmt(row.price_change_pct, 2)}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: CLUSTER ════════════════════════════════════ */}
        {tab === 'cluster' && (
          <div className="space-y-3">
            <div className="glass rounded-[14px] p-4 border border-pink-500/15">
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className="text-pink-400" />
                <p className="text-[11px] font-black uppercase tracking-widest text-pink-400">Insider Cluster Activity</p>
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Insider yang aktif di ≥2 saham dalam periode — pola powerful untuk deteksi group restructuring (mis. INTI ANUGERAH PRATAMA → LPKR/LPLI/LPPS) atau institusi rebalancing portfolio.
              </p>
            </div>

            {loading && !cluster.length ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground/40 gap-2">
                <Loader2 size={18} className="animate-spin" /><span className="text-[12px]">Memuat cluster data…</span>
              </div>
            ) : cluster.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/30 gap-2">
                <Users size={32} /><p className="text-[13px]">Tidak ada cluster activity</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 stagger">
                {cluster.map((c, i) => {
                  const isAccum = c.cluster_signal.includes('ACCUMULATION') || c.cluster_signal.includes('NET BUY')
                  const isDist  = c.cluster_signal.includes('DISTRIBUTION') || c.cluster_signal.includes('NET SELL')
                  return (
                    <div
                      key={`${c.insider_name}-${i}`}
                      className="glass card-hover rounded-[14px] p-4 relative overflow-hidden"
                      style={{
                        background: isAccum
                          ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.01))'
                          : isDist
                          ? 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.01))'
                          : undefined,
                        borderColor: isAccum ? 'rgba(16,185,129,0.20)' : isDist ? 'rgba(239,68,68,0.20)' : undefined,
                      }}
                    >
                      <span className="absolute top-3 right-3 text-[9px] font-black text-muted-foreground/20 font-mono">#{i + 1}</span>

                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                          isAccum ? 'bg-emerald-500/15 border border-emerald-500/25'
                          : isDist ? 'bg-red-500/15 border border-red-500/25'
                          : 'bg-amber-500/15 border border-amber-500/25'
                        }`}>
                          {isAccum ? <TrendingUp size={15} className="text-emerald-400" />
                           : isDist ? <TrendingDown size={15} className="text-red-400" />
                           : <Activity size={15} className="text-amber-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-foreground truncate">{c.insider_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-md border ${
                              c.derived_type === 'PENGENDALI' ? 'bg-purple-500/15 text-purple-400 border-purple-500/25'
                              : c.derived_type === 'DIREKSI' ? 'bg-blue-500/15 text-blue-400 border-blue-500/25'
                              : c.derived_type === 'KOMISARIS' ? 'bg-sky-500/15 text-sky-400 border-sky-500/25'
                              : 'bg-white/[0.05] text-muted-foreground/70 border-white/10'
                            }`}>
                              {c.derived_type}
                            </span>
                            <span className={`text-[8.5px] font-black ${
                              isAccum ? 'text-emerald-400' : isDist ? 'text-red-400' : 'text-amber-400'
                            }`}>
                              {c.cluster_signal}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-2 rounded-lg bg-white/[0.04]">
                          <p className="text-[8px] text-muted-foreground/45 uppercase">Saham</p>
                          <p className="text-[14px] font-black text-foreground">{c.stock_count}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-emerald-500/[0.06]">
                          <p className="text-[8px] text-muted-foreground/45 uppercase">Buy</p>
                          <p className="text-[14px] font-black text-emerald-400">{c.buy_count}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-red-500/[0.06]">
                          <p className="text-[8px] text-muted-foreground/45 uppercase">Sell</p>
                          <p className="text-[14px] font-black text-red-400">{c.sell_count}</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-white/[0.04]">
                          <p className="text-[8px] text-muted-foreground/45 uppercase">Span</p>
                          <p className="text-[14px] font-black text-foreground">{c.span_days}d</p>
                        </div>
                      </div>

                      {/* Stocks list */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {c.stocks.split(', ').map((s, j) => (
                          <button key={j} onClick={() => setSelectedStock(s)}
                            className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-white/[0.05] hover:bg-primary/15 hover:text-primary border border-white/10 transition-all">
                            {s}
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-[9px] text-muted-foreground/45 font-mono">
                        <span>{c.last_tx}</span>
                        {c.total_pct_buy > 0 && (
                          <span className="text-emerald-400">+{c.total_pct_buy.toFixed(2)}% total beli</span>
                        )}
                        {c.total_pct_sell > 0 && (
                          <span className="text-red-400">−{c.total_pct_sell.toFixed(2)}% total jual</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: CONVICTION ════════════════════════════════ */}
        {tab === 'conviction' && (
          <div className="space-y-4">

            {/* Bar chart: top 15 by conviction */}
            {topConvictionChart.length > 0 && (
              <div className="glass rounded-[14px] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40 mb-4">
                  Top 15 — Internal Buy vs Sell
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={topConvictionChart} barGap={2} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="code" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                    <Tooltip
                      contentStyle={{ background: 'rgba(10,18,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }}
                      labelStyle={{ color: '#fff', fontWeight: 700 }}
                    />
                    <Bar dataKey="buy"  fill="#10b981" name="Internal Buy"  radius={[3,3,0,0]} />
                    <Bar dataKey="sell" fill="#ef4444" name="Internal Sell" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Conviction table */}
            {loading && !conviction.length ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground/40 gap-2">
                <Loader2 size={18} className="animate-spin" /><span className="text-[12px]">Memuat conviction data…</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
                {sortedConviction.map((row, i) => {
                  const { pct, color } = convictionBar(row.conviction_score)
                  const isPositive = row.fresh_internal_buy > row.fresh_internal_sell
                  return (
                    <div
                      key={row.stock_code}
                      className={`glass card-hover rounded-[12px] p-3.5 relative overflow-hidden ${
                        row.recency_tag === 'STALE' ? 'opacity-55' : row.recency_tag === 'AGING' ? 'opacity-80' : ''
                      }`}
                      style={isPositive && (row.recency_tag === 'FRESH' || row.recency_tag === 'RECENT') ? {
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))',
                        borderColor: 'rgba(16,185,129,0.12)',
                      } : undefined}
                    >
                      {/* Rank badge */}
                      <span className="absolute top-3 right-3 text-[9px] font-black text-muted-foreground/20 font-mono">
                        #{i + 1}
                      </span>

                      {/* Header */}
                      <div className="flex items-start gap-2 mb-2.5 flex-wrap">
                        <button onClick={() => setSelectedStock(row.stock_code)} className="text-[15px] font-black text-foreground hover:text-primary transition-colors text-left">
                          {row.stock_code}
                        </button>
                        {/* Recency tag — penting! */}
                        {row.recency_tag && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border mt-0.5 flex items-center gap-1 ${
                            row.recency_tag === 'FRESH'  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : row.recency_tag === 'RECENT' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : row.recency_tag === 'AGING'  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                          }`}>
                            {row.recency_tag === 'FRESH'  ? '🔥 FRESH'
                            : row.recency_tag === 'RECENT' ? '⚡ RECENT'
                            : row.recency_tag === 'AGING'  ? '⏳ AGING'
                            : '💤 STALE'} · {row.days_since_tx}d
                          </span>
                        )}
                        {row.insider_signal && (
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md border mt-0.5 ${signalColor(row.insider_signal)} bg-current/5`}
                            style={{ borderColor: 'currentColor', opacity: 0.9 }}>
                            {row.insider_signal}
                          </span>
                        )}
                      </div>

                      {row.company_name && (
                        <p className="text-[9px] text-muted-foreground/40 mb-2.5 truncate">{row.company_name}</p>
                      )}

                      {/* Conviction bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-[9px] mb-1">
                          <span className="text-muted-foreground/40">Conviction Score</span>
                          <span className="font-black font-mono" style={{ color }}>{fmt(row.conviction_score, 0)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Total Tx', value: row.total_tx },
                          { label: 'Int.Buy', value: row.internal_buy, cls: 'text-emerald-400' },
                          { label: 'Int.Sell', value: row.internal_sell, cls: 'text-red-400' },
                          { label: 'Fresh Buy', value: row.fresh_internal_buy, cls: 'text-emerald-400 font-black' },
                          { label: 'Fresh Sell', value: row.fresh_internal_sell, cls: 'text-red-400 font-black' },
                          { label: 'Score 30D', value: fmt(row.score_30d, 0) },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <p className={`text-[11px] font-bold font-mono ${(s as any).cls ?? 'text-foreground/70'}`}>{s.value}</p>
                            <p className="text-[8px] text-muted-foreground/35 mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.05]">
                        <p className="text-[9px] text-muted-foreground/35 font-mono">{row.latest_tx}</p>
                        {row.current_price > 0 && (
                          <p className={`text-[10px] font-bold font-mono ${(row.price_change_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {row.current_price.toLocaleString('id-ID')}
                            <span className="ml-1 text-[8px]">
                              {(row.price_change_pct ?? 0) >= 0 ? '+' : ''}{fmt(row.price_change_pct, 2)}%
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Footer meta ────────────────────────────────────────────────── */}
        {lastFetch && (
          <p className="text-[9px] text-muted-foreground/25 font-mono text-right pb-4">
            Sumber: KSEI · IDX · Last fetch: {lastFetch.toLocaleTimeString('id-ID')}
          </p>
        )}

      </div>
    </div>
  )
}
