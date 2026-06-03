'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Crown, Search, RefreshCw, ExternalLink, TrendingUp, TrendingDown,
  Layers, Activity, ArrowLeft, Building2, Users, Sparkles, AlertTriangle,
  PieChart as PieChartIcon, LineChart as LineChartIcon, ChevronUp, ChevronDown, ChevronsUpDown,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ComposedChart, Line, Area, CartesianGrid, ReferenceLine,
  PieChart, Pie,
} from 'recharts'

type SortKey = 'm0_smart' | 'm1_smart' | 'm2_smart' | 'cum3m_smart' | 'm0_retail' | 'foreign_own_pct' | 'stock_code'

async function apiFetch(params: Record<string, string | number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  const r  = await fetch(`/api/ksei-monthly?${qs}`)
  const j  = await r.json()
  if (j.error) throw new Error(j.error)
  return j
}

const fmtM = (v: number) => {
  if (v == null || isNaN(v)) return '—'
  const a = Math.abs(v)
  if (a >= 1000) return `${v >= 0 ? '+' : ''}${(v / 1000).toFixed(2)} T`
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)} M`
}
const numCls = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'

const TREND_META: Record<string, { label: string; cls: string }> = {
  KONSISTEN_AKUMULASI:   { label: 'Konsisten Akumulasi', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  MULAI_AKUMULASI:       { label: 'Mulai Akumulasi',     cls: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  KONSISTEN_DISTRIBUSI:  { label: 'Konsisten Distribusi',cls: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30' },
  MULAI_DISTRIBUSI:      { label: 'Mulai Distribusi',    cls: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30' },
  MIXED:                 { label: 'Mixed',               cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
}
const DIV_META: Record<string, { label: string; cls: string }> = {
  DIVERGEN_BULLISH: { label: 'Divergen Bullish', cls: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  DIVERGEN_BEARISH: { label: 'Divergen Bearish', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  ALIGNED:          { label: 'Aligned',          cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
}
const KAT_COLOR: Record<string, string> = {
  Smart:  '#22c55e',
  Inst:   '#3b82f6',
  Retail: '#ef4444',
  Other:  '#94a3b8',
}

// Warna per tipe investor individual (Local = solid, Foreign = lebih terang/teal-shift)
const TIPE_COLOR: Record<string, string> = {
  'Local CP': '#16a34a', 'Local PF': '#22c55e', 'Local IB': '#4ade80', 'Local MF': '#86efac',
  'Local ID': '#ef4444', 'Local IS': '#3b82f6', 'Local SC': '#64748b', 'Local FD': '#94a3b8', 'Local OT': '#cbd5e1',
  'Foreign CP': '#0d9488', 'Foreign PF': '#14b8a6', 'Foreign IB': '#2dd4bf', 'Foreign MF': '#5eead4',
  'Foreign ID': '#f87171', 'Foreign IS': '#60a5fa', 'Foreign SC': '#475569', 'Foreign FD': '#78716c', 'Foreign OT': '#a8a29e',
}

// Glossary tipe KSEI
const TIPE_GLOSS: Record<string, string> = {
  CP: 'Corporate', PF: 'Pension Fund', IB: 'Insurance/Bank', MF: 'Mutual Fund',
  ID: 'Individual', IS: 'Insurance', SC: 'Securities', FD: 'Foundation', OT: 'Others',
}

// ── Sortable table header ──
function SortableTh({ k, label, align, cls = '', sortKey, sortDir, onSort }: {
  k: SortKey; label: string; align: 'left' | 'right' | 'center'; cls?: string
  sortKey: SortKey; sortDir: 'asc' | 'desc'; onSort: (k: SortKey) => void
}) {
  const active = sortKey === k
  const justify = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <th className={`px-4 py-3 font-bold cursor-pointer select-none hover:text-foreground transition-colors text-${align} ${cls}`}
      onClick={() => onSort(k)}>
      <span className={`inline-flex items-center gap-1 ${justify}`}>
        {label}
        {active
          ? (sortDir === 'desc' ? <ChevronDown size={11} className="text-gold-400" /> : <ChevronUp size={11} className="text-gold-400" />)
          : <ChevronsUpDown size={10} className="opacity-25" />}
      </span>
    </th>
  )
}

export default function KseiMonthlyPage() {
  const [tab, setTab]         = useState<'screener' | 'deepdive'>('screener')
  const [rows, setRows]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // Filters
  const [trendFilter, setTrend] = useState('')
  const [divFilter, setDiv]     = useState('')
  const [sectorFilter, setSec]  = useState('')
  const [sectors, setSectors]   = useState<string[]>([])
  const [search, setSearch]     = useState('')

  // Sort
  const [sortKey, setSortKey]   = useState<SortKey>('m0_smart')
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('desc')
  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(k); setSortDir('desc') }
  }

  // Deep dive
  const [ddCode, setDdCode]     = useState('')
  const [ddInput, setDdInput]   = useState('')
  const [ddData, setDdData]     = useState<any>(null)
  const [ddLoading, setDdLoading] = useState(false)

  // ── Load screener ──
  const loadScreener = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const j = await apiFetch({ action: 'screener', trend: trendFilter, divergence: divFilter, sector: sectorFilter })
      setRows(j.data || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [trendFilter, divFilter, sectorFilter])

  useEffect(() => { if (tab === 'screener') loadScreener() }, [loadScreener, tab])

  useEffect(() => {
    apiFetch({ action: 'sectors' }).then(j => setSectors((j.data || []).map((d: any) => d.sector))).catch(() => {})
  }, [])

  // ── Load deep dive ──
  const loadDeepDive = useCallback(async (code: string) => {
    if (!code) return
    setDdLoading(true); setDdData(null)
    try {
      const j = await apiFetch({ action: 'deepdive', code })
      setDdData(j)
      setDdCode(code)
    } catch (e: any) { setError(e.message) }
    finally { setDdLoading(false) }
  }, [])

  const openDeepDive = (code: string) => {
    setTab('deepdive'); setDdInput(code); loadDeepDive(code)
  }

  const filtered = useMemo(() => {
    let out = rows
    if (search) {
      const q = search.toUpperCase()
      out = rows.filter(r => r.stock_code?.includes(q) || (r.sector || '').toUpperCase().includes(q))
    }
    const sorted = [...out].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      const cmp = typeof av === 'string'
        ? String(av).localeCompare(String(bv))
        : (Number(av) || 0) - (Number(bv) || 0)
      return sortDir === 'desc' ? -cmp : cmp
    })
    return sorted
  }, [rows, search, sortKey, sortDir])

  // Stats
  const stats = useMemo(() => ({
    total:    rows.length,
    akumulasi:rows.filter(r => r.smart_money_trend?.includes('AKUMULASI')).length,
    distribusi:rows.filter(r => r.smart_money_trend?.includes('DISTRIBUSI')).length,
    divergen: rows.filter(r => r.divergence_signal === 'DIVERGEN_BULLISH').length,
  }), [rows])

  return (
    <div className="sidebar-offset max-w-[1400px] mx-auto px-4 py-6 space-y-5 pb-12 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg,rgba(231,183,51,0.15),rgba(231,183,51,0.05))', border: '1px solid rgba(231,183,51,0.2)' }}>
          <Crown size={18} className="text-gold-400" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-black gradient-gold leading-none">KSEI Smart Money Tracker</h1>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            Pergerakan institusi bulanan · CP + PF + IB + MF · Sumber: KSEI full snapshot
          </p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border/40">
        {[
          { id: 'screener', label: 'Smart Money Screener', icon: Activity },
          { id: 'deepdive', label: 'Deep Dive per Saham',  icon: Layers },
        ].map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold rounded-t-xl border-b-2 transition-all ${
                tab === t.id
                  ? 'text-gold-400 border-gold-400 bg-gold-400/10'
                  : 'text-muted-foreground/60 border-transparent hover:text-muted-foreground hover:bg-white/[0.03]'
              }`}>
              <Icon size={13} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ════════════════════ TAB: SCREENER ════════════════════ */}
      {tab === 'screener' && (
        <div className="space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Saham',       value: stats.total,      color: 'text-foreground' },
              { label: 'Akumulasi Smart',   value: stats.akumulasi,  color: 'text-emerald-400' },
              { label: 'Distribusi Smart',  value: stats.distribusi, color: 'text-red-400' },
              { label: 'Divergen Bullish',  value: stats.divergen,   color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="glass rounded-2xl p-3 text-center card-hover">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground/55 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari kode / sektor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50" />
            </div>
            <select value={trendFilter} onChange={e => setTrend(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50">
              <option value="">Semua Trend</option>
              {Object.entries(TREND_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={divFilter} onChange={e => setDiv(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50">
              <option value="">Semua Divergence</option>
              {Object.entries(DIV_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={sectorFilter} onChange={e => setSec(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50 max-w-[160px]">
              <option value="">Semua Sektor</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={loadScreener} disabled={loading}
              className="px-3 py-2 rounded-xl border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

          {/* Table */}
          <div className="glass rounded-2xl overflow-hidden border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-card/70 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wide">
                    <SortableTh k="stock_code"      label="Saham"        align="left"  sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh k="m0_smart"        label="Smart M0"     align="right" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh k="m1_smart"        label="M-1"          align="right" cls="hidden md:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh k="m2_smart"        label="M-2"          align="right" cls="hidden md:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh k="cum3m_smart"     label="Kumulatif 3B" align="right" cls="hidden lg:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh k="m0_retail"       label="Retail M0"    align="right" cls="hidden lg:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh k="foreign_own_pct" label="Foreign %"    align="right" cls="hidden xl:table-cell" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-3 text-center font-bold">Trend</th>
                    <th className="px-4 py-3 text-center font-bold hidden md:table-cell">Divergence</th>
                    <th className="px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/20 animate-pulse">
                        {Array.from({ length: 9 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 bg-muted/50 rounded" /></td>)}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                      <Activity size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="font-bold text-sm">Tidak ada data</p>
                    </td></tr>
                  ) : filtered.map((r, i) => {
                    const tm = TREND_META[r.smart_money_trend] || TREND_META.MIXED
                    const dm = DIV_META[r.divergence_signal] || DIV_META.ALIGNED
                    return (
                      <tr key={i} className="tr-hover border-b border-border/20 group cursor-pointer"
                        onClick={() => openDeepDive(r.stock_code)}>
                        <td className="px-4 py-2.5">
                          <div className="font-mono font-black text-foreground group-hover:text-gold-400 transition-colors">{r.stock_code}</div>
                          <div className="text-[9px] text-muted-foreground/45 truncate max-w-[110px]">{r.sector || '—'}</div>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-black font-mono ${numCls(r.m0_smart)}`}>{fmtM(r.m0_smart)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono hidden md:table-cell ${numCls(r.m1_smart)}`}>{fmtM(r.m1_smart)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono hidden md:table-cell ${numCls(r.m2_smart)}`}>{fmtM(r.m2_smart)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono font-bold hidden lg:table-cell ${numCls(r.cum3m_smart)}`}>{fmtM(r.cum3m_smart)}</td>
                        <td className={`px-4 py-2.5 text-right font-mono hidden lg:table-cell ${numCls(r.m0_retail)}`}>{fmtM(r.m0_retail)}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-blue-400 hidden xl:table-cell">{r.foreign_own_pct?.toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${tm.cls}`}>{tm.label}</span>
                        </td>
                        <td className="px-4 py-2.5 text-center hidden md:table-cell">
                          {r.divergence_signal !== 'ALIGNED' && (
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${dm.cls}`}>{dm.label}</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <Layers size={12} className="text-muted-foreground/30 group-hover:text-gold-400 transition-colors" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border/30 text-[10px] text-muted-foreground/40 flex justify-between">
                <span>{filtered.length} saham · klik baris untuk Deep Dive</span>
                <span>Smart Money = CP+PF+IB+MF (Local & Foreign)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════ TAB: DEEP DIVE ════════════════════ */}
      {tab === 'deepdive' && (
        <div className="space-y-4">

          {/* Search */}
          <div className="glass rounded-2xl p-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input value={ddInput}
                onChange={e => setDdInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && loadDeepDive(ddInput)}
                placeholder="Masukkan kode saham — mis. BBCA, lalu Enter..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:border-gold-400/50" />
            </div>
            <button onClick={() => loadDeepDive(ddInput)} disabled={!ddInput || ddLoading}
              className="px-5 py-2.5 rounded-xl bg-gold-400 text-black font-black text-xs hover:bg-gold-300 active:scale-95 transition-all disabled:opacity-40">
              {ddLoading ? <RefreshCw size={13} className="animate-spin" /> : 'Analisa'}
            </button>
          </div>

          {!ddData && !ddLoading && (
            <div className="glass rounded-2xl p-16 text-center">
              <Layers size={32} className="mx-auto mb-4 text-gold-400/30" />
              <p className="text-sm font-bold text-muted-foreground/50">Masukkan kode saham untuk analisis mendalam</p>
              <p className="text-[11px] text-muted-foreground/30 mt-1">Komposisi 18 tipe investor · Trend 12 bulan · Smart vs Retail</p>
            </div>
          )}

          {ddLoading && (
            <div className="glass rounded-2xl p-16 flex items-center justify-center">
              <RefreshCw size={24} className="animate-spin text-gold-400" />
            </div>
          )}

          {ddData && ddData.summary && (
            <DeepDiveContent code={ddCode} data={ddData} />
          )}
        </div>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// OWNERSHIP DONUT — komposisi kepemilikan terkini (group by kategori)
// ════════════════════════════════════════════════════════════════════════════
function OwnershipDonut({ composition }: { composition: any[] }) {
  // Group by kategori (Smart / Inst / Retail / Other)
  const byKat = useMemo(() => {
    const map: Record<string, number> = {}
    ;(composition || []).forEach((c: any) => {
      map[c.kategori] = (map[c.kategori] || 0) + Number(c.pct || 0)
    })
    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
  }, [composition])

  // Top 6 tipe investor individual untuk detail
  const KAT_LABEL: Record<string, string> = {
    Smart: 'Smart Money', Inst: 'Institusi', Retail: 'Retail', Other: 'Lainnya',
  }

  // Detail per tipe investor (semua 18, untuk donut kedua)
  const byTipe = useMemo(() =>
    [...(composition || [])]
      .map((c: any) => ({ name: c.tipe, value: Number(Number(c.pct).toFixed(2)), kategori: c.kategori, delta: Number(c.delta_pct) }))
      .filter(t => t.value > 0)
      .sort((a, b) => b.value - a.value),
  [composition])

  if (!byKat.length) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ═══ Donut 1: by Kategori ═══ */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon size={15} className="text-gold-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest">Komposisi — Kategori</h3>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-44 h-44 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byKat} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
                  {byKat.map((e, i) => <Cell key={i} fill={KAT_COLOR[e.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: any, n: any) => [`${Number(v).toFixed(2)}%`, KAT_LABEL[n] || n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] text-muted-foreground/45 uppercase tracking-wide">Smart</span>
              <span className="text-lg font-black text-emerald-400">
                {(byKat.find(k => k.name === 'Smart')?.value ?? 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {byKat.map((e, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: KAT_COLOR[e.name] || '#94a3b8' }} />
                <span className="text-[11px] text-muted-foreground/70 flex-1">{KAT_LABEL[e.name] || e.name}</span>
                <span className="text-[12px] font-black text-foreground">{e.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Donut 2: by Tipe Investor (detail real) ═══ */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon size={15} className="text-gold-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest">Komposisi — Tipe Investor</h3>
        </div>
        <div className="flex items-center gap-5">
          <div className="w-44 h-44 shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byTipe} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  innerRadius={54} outerRadius={82} paddingAngle={1.5} stroke="none">
                  {byTipe.map((e, i) => <Cell key={i} fill={TIPE_COLOR[e.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(v: any, n: any) => {
                    const kode = String(n).split(' ')[1] || ''
                    return [`${Number(v).toFixed(2)}%`, `${n} (${TIPE_GLOSS[kode] || ''})`]
                  }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[8px] text-muted-foreground/45 uppercase tracking-wide">Tipe</span>
              <span className="text-lg font-black text-gold-400">{byTipe.length}</span>
            </div>
          </div>
          {/* Legend scrollable — top types + delta */}
          <div className="flex-1 space-y-1 max-h-44 overflow-y-auto pr-1">
            {byTipe.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: TIPE_COLOR[e.name] || '#94a3b8' }} />
                <span className="text-muted-foreground/70 flex-1 truncate">{e.name}</span>
                <span className="font-bold text-foreground w-12 text-right">{e.value.toFixed(2)}%</span>
                <span className={`font-mono w-12 text-right ${numCls(e.delta)}`}>
                  {e.delta > 0 ? '+' : ''}{e.delta.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════════
// DEEP DIVE CONTENT
// ════════════════════════════════════════════════════════════════════════════
function DeepDiveContent({ code, data }: { code: string; data: any }) {
  const { trend, composition, summary } = data

  // Insight generation
  const latest = trend[trend.length - 1] || {}
  const smartFlow = Number(latest.smart_flow || 0)
  const retailFlow = Number(latest.retail_flow || 0)

  const insight = useMemo(() => {
    const parts: string[] = []
    if (smartFlow > 0 && retailFlow < 0)
      parts.push(`🟢 Smart money akumulasi ${fmtM(smartFlow)} sementara retail distribusi — pola DIVERGEN BULLISH klasik.`)
    else if (smartFlow < 0 && retailFlow > 0)
      parts.push(`🔴 Smart money distribusi ${fmtM(smartFlow)} sementara retail beli — waspada distribusi ke retail.`)
    else if (smartFlow > 0)
      parts.push(`🟢 Smart money net akumulasi ${fmtM(smartFlow)} bulan terakhir.`)
    else if (smartFlow < 0)
      parts.push(`🔴 Smart money net distribusi ${fmtM(smartFlow)} bulan terakhir.`)
    else
      parts.push(`⚪ Tidak ada pergerakan smart money signifikan bulan terakhir.`)

    if (summary.foreign_pct > 50) parts.push(`Kepemilikan asing dominan (${summary.foreign_pct}%).`)
    if (summary.is_split) parts.push(`⚠️ Terdeteksi indikasi stock split.`)
    if (summary.is_reverse) parts.push(`⚠️ Terdeteksi indikasi reverse split.`)
    return parts.join(' ')
  }, [smartFlow, retailFlow, summary])

  return (
    <div className="space-y-4">

      {/* Summary header */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/stock/${code}`} prefetch={false}
              className="text-2xl font-black font-mono text-foreground hover:text-gold-400 transition-colors">
              {code}
            </Link>
            <div>
              <p className="text-[11px] text-muted-foreground/60">{summary.latest_month}</p>
              <p className="text-sm font-bold">Rp{Number(summary.price).toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground/45 uppercase tracking-wide mb-1">Local</p>
              <p className="text-lg font-black text-emerald-400">{summary.local_pct}%</p>
            </div>
            <div className="text-center">
              <p className="text-[9px] text-muted-foreground/45 uppercase tracking-wide mb-1">Foreign</p>
              <p className="text-lg font-black text-blue-400">{summary.foreign_pct}%</p>
            </div>
            {/* Toggle ke chart saham */}
            <Link href={`/stock/${code}`} prefetch={false}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 text-[11px] font-bold hover:bg-gold-400/20 active:scale-95 transition-all">
              <LineChartIcon size={13} /> Chart Saham
            </Link>
          </div>
        </div>
        {/* Insight box */}
        <div className="mt-4 p-3 rounded-xl bg-gold-400/[0.05] border border-gold-400/20 flex items-start gap-2.5">
          <Sparkles size={14} className="text-gold-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground/75 leading-relaxed">{insight}</p>
        </div>
      </div>

      {/* Donut: Komposisi kepemilikan terkini */}
      <OwnershipDonut composition={composition} />

      {/* Chart 1: Smart Money Flow bulanan */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-gold-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest">Smart Money Flow Bulanan (Miliar Rp)</h3>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} tickFormatter={(v) => v?.slice(2, 7)} />
            <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(v: any, n: any) => [`${Number(v).toFixed(1)} M`, n]} />
            <ReferenceLine y={0} stroke="hsl(var(--border))" />
            <Bar dataKey="smart_flow" name="Smart Money" radius={[3, 3, 0, 0]}>
              {trend.map((d: any, i: number) => <Cell key={i} fill={Number(d.smart_flow) >= 0 ? '#22c55e' : '#ef4444'} />)}
            </Bar>
            <Line dataKey="retail_flow" name="Retail" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 2: Local vs Foreign Smart Flow */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-gold-400" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Local vs Foreign Smart Flow</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} tickFormatter={(v) => v?.slice(2, 7)} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(v: any, n: any) => [`${Number(v).toFixed(1)} M`, n]} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="local_flow" name="Local Smart" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="foreign_flow" name="Foreign Smart" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Foreign Ownership % trend */}
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={15} className="text-gold-400" />
            <h3 className="text-[11px] font-black uppercase tracking-widest">Foreign Ownership Trend (%)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} tickFormatter={(v) => v?.slice(2, 7)} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Foreign']} />
              <defs>
                <linearGradient id="fo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area dataKey="foreign_own_pct" name="Foreign %" stroke="#3b82f6" strokeWidth={2} fill="url(#fo)" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Investor Composition Table */}
      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        <div className="px-5 py-3.5 border-b border-border/40 flex items-center gap-2">
          <Users size={15} className="text-gold-400" />
          <h3 className="text-[11px] font-black uppercase tracking-widest">Komposisi Investor — Bulan Terakhir vs Sebelumnya</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-card/70 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-bold">Tipe Investor</th>
                <th className="px-4 py-3 text-center font-bold">Kategori</th>
                <th className="px-4 py-3 text-right font-bold">% Kepemilikan</th>
                <th className="px-4 py-3 text-right font-bold hidden md:table-cell">Lembar Saham</th>
                <th className="px-4 py-3 text-right font-bold">Δ% (vs prev)</th>
              </tr>
            </thead>
            <tbody>
              {(composition || []).map((c: any, i: number) => (
                <tr key={i} className="tr-hover border-b border-border/20">
                  <td className="px-4 py-2.5 font-bold text-foreground/85">{c.tipe}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                      style={{ color: KAT_COLOR[c.kategori], background: `${KAT_COLOR[c.kategori]}1a`, border: `1px solid ${KAT_COLOR[c.kategori]}33` }}>
                      {c.kategori}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-bold">{Number(c.pct).toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground/60 hidden md:table-cell">
                    {Number(c.shares).toLocaleString('id-ID')}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-bold ${numCls(Number(c.delta_pct))}`}>
                    {Number(c.delta_pct) > 0 ? '+' : ''}{Number(c.delta_pct).toFixed(3)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
