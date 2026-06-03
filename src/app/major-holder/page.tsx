'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Users, RefreshCw, Search, ExternalLink, TrendingUp, TrendingDown,
  Eye, Building2, Globe, Filter, Zap, AlertTriangle, Activity,
  ArrowUpRight, ArrowDownRight, Ghost, ChevronRight, X,
} from 'lucide-react'
import Link from 'next/link'
import { formatShares } from '@/lib/utils'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Row {
  tanggal: string
  stock_code: string
  holder_name: string
  shares_prev: number
  shares_curr: number
  shares_change: number
  aksi: string
  lf: string
  is_transfer: boolean
  alert_type?: string
  sector: string
  group_name: string
  current_price: number
  change_pct: number
}

type Tab = 'changes' | 'accumulation' | 'distribution' | 'holdings'
type LFFilter = 'all' | 'lokal' | 'asing'
const DAYS_OPTS = [7, 14, 30, 60, 90]

async function apiFetch(params: Record<string, string | number | boolean>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
  const r  = await fetch(`/api/major-holder?${qs}`)
  const j  = await r.json()
  if (j.error) throw new Error(j.error)
  return j
}

// ── Sub-components ────────────────────────────────────────────────────────────
function AksiChip({ aksi, isTransfer, alertType }: { aksi: string; isTransfer: boolean; alertType?: string }) {
  if (isTransfer) return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-slate-500/10 text-slate-400 border-slate-500/20">
      Transfer
    </span>
  )
  if (alertType === 'Ghost Whale') return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 flex items-center gap-1 w-fit">
      <Ghost size={9} /> Exit
    </span>
  )
  const map: Record<string, string> = {
    Buying:        'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    Accumulation:  'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
    Reduction:     'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    Holding:       'bg-slate-500/10 text-slate-500 border-slate-500/20',
  }
  return (
    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${map[aksi] || map.Holding}`}>
      {aksi}
    </span>
  )
}

function LFBadge({ lf }: { lf: string }) {
  return (
    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
      lf === 'Asing' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'
    }`}>
      {lf === 'Asing' ? '🌐 A' : '🏠 L'}
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MajorHolderPage() {
  const [tab, setTab]             = useState<Tab>('changes')
  const [rows, setRows]           = useState<any[]>([])
  const [kpi, setKpi]             = useState<any>({})
  const [trend, setTrend]         = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [trendLoading, setTrendLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Filters
  const [days, setDays]           = useState(30)
  const [lfFilter, setLfFilter]   = useState<LFFilter>('all')
  const [hideTransfer, setHideTransfer] = useState(true)
  const [search, setSearch]       = useState('')

  // Per-saham detail
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [sahamDetail, setSahamDetail]   = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const detailRef = useRef<HTMLDivElement>(null)

  // ── Load data ──
  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const j = await apiFetch({ action: tab, days, lf: lfFilter, hide_transfer: hideTransfer })
      setRows(j.data || [])
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [tab, days, lfFilter, hideTransfer])

  useEffect(() => { load() }, [load])

  // Load KPI once
  useEffect(() => {
    apiFetch({ action: 'kpi' }).then(j => setKpi(j.data || {})).catch(() => {})
    apiFetch({ action: 'trend' }).then(j => setTrend((j.data || []).reverse())).catch(() => {})
      .finally(() => setTrendLoading(false))
  }, [])

  // Load saham detail
  const loadSahamDetail = useCallback(async (code: string) => {
    setSelectedCode(code); setDetailLoading(true); setSahamDetail(null)
    try {
      const j = await apiFetch({ action: 'saham_detail', code })
      setSahamDetail(j)
    } catch (e: any) { console.error(e) }
    finally { setDetailLoading(false) }
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }, [])

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toUpperCase()
    return rows.filter(r =>
      (r.stock_code || '').includes(q) ||
      (r.holder_name || '').toUpperCase().includes(q) ||
      (r.sector || '').toUpperCase().includes(q)
    )
  }, [rows, search])

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'changes',      label: 'Semua Perubahan',   icon: <Activity size={13} /> },
    { id: 'accumulation', label: 'Fresh Accumulation', icon: <TrendingUp size={13} /> },
    { id: 'distribution', label: 'Distribution Alert', icon: <TrendingDown size={13} /> },
    { id: 'holdings',     label: 'Active Holdings',    icon: <Eye size={13} /> },
  ]

  return (
    <div className="sidebar-offset max-w-[1400px] mx-auto px-4 py-6 space-y-5 pb-12 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(231,183,51,0.15),rgba(231,183,51,0.05))', border: '1px solid rgba(231,183,51,0.2)' }}>
            <Users size={18} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-black gradient-gold leading-none">KSEI &gt;5% Harian</h1>
            <p className="text-[11px] text-muted-foreground/60 mt-0.5">
              Pergerakan pemegang &gt;5% · PDF KSEI harian · account transfer otomatis difilter
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {DAYS_OPTS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                days === d ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30' : 'text-muted-foreground border border-border/50 hover:text-foreground'
              }`}>{d}D</button>
          ))}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/50 text-[11px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Active Holdings', value: kpi.active_holdings?.toLocaleString('id-ID') || '—', color: 'text-foreground',   sub: 'snapshot terkini' },
          { label: 'Akumulasi 30D',   value: kpi.akumulasi_30d  || '—',   color: 'text-emerald-400', sub: 'saham real buy' },
          { label: 'Distribusi 30D',  value: kpi.distribusi_30d || '—',   color: 'text-red-400',     sub: 'saham real sell' },
          { label: 'Ghost Whale 30D', value: kpi.ghost_whale_30d || '—',  color: 'text-amber-400',   sub: 'exit total >5%' },
          { label: 'Transfer Noise',  value: `${kpi.transfer_pct || '—'}%`, color: 'text-slate-400', sub: 'akun ganti nama' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-3 text-center card-hover">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground/65 mt-0.5">{k.label}</p>
            <p className="text-[9px] text-muted-foreground/35">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Trend Chart ── */}
      {!trendLoading && trend.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-gold-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
              Weekly Activity — Real Buy vs Sell (exclude transfers)
            </p>
            <div className="ml-auto flex items-center gap-4 text-[9px] text-muted-foreground/40">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-emerald-400 inline-block"/>Akumulasi</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-red-400 inline-block"/>Distribusi</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2 rounded bg-slate-500 inline-block"/>Transfer</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={trend} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="week" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                tickFormatter={v => v?.slice(2, 7)} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }} />
              <Bar dataKey="real_akumulasi" name="Akumulasi" fill="#22c55e" radius={[2, 2, 0, 0]} />
              <Bar dataKey="real_distribusi" name="Distribusi" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="transfers" name="Transfer" fill="#475569" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Per-saham Detail Panel ── */}
      {selectedCode && (
        <div ref={detailRef} className="glass rounded-2xl border border-gold-400/20 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/40 flex items-center gap-3">
            <Link href={`/stock/${selectedCode}`} prefetch={false}
              className="text-lg font-black font-mono text-gold-400 hover:text-gold-300 transition-colors">
              {selectedCode}
            </Link>
            <span className="text-[11px] text-muted-foreground/60">Detail Pemegang &gt;5%</span>
            <button onClick={() => { setSelectedCode(null); setSahamDetail(null) }}
              className="ml-auto text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {detailLoading ? (
            <div className="p-8 flex justify-center"><RefreshCw size={20} className="animate-spin text-gold-400" /></div>
          ) : sahamDetail ? (
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/30">
              {/* Current Holders */}
              <div className="p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">
                  Pemegang Saat Ini ({sahamDetail.holders?.length || 0})
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {(sahamDetail.holders || []).map((h: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-background border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-foreground/80 truncate">{h.holder_name}</p>
                        <p className="text-[9px] text-muted-foreground/45">{h.lf} · {h.aksi}</p>
                      </div>
                      <span className="text-[11px] font-black text-foreground font-mono shrink-0">
                        {formatShares(h.current_shares)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Recent Activity */}
              <div className="p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">
                  Aktivitas 30 Hari Terakhir ({sahamDetail.recent?.filter((r: any) => !r.is_transfer).length || 0} real)
                </p>
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {(sahamDetail.recent || []).map((r: any, i: number) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      r.is_transfer ? 'bg-muted/20 border-border/20 opacity-50' : 'bg-background border-border/30'
                    }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-muted-foreground/50">{r.tanggal?.slice(5)}</p>
                        <p className="text-[10px] truncate text-foreground/70">{r.holder_name}</p>
                      </div>
                      <AksiChip aksi={r.aksi} isTransfer={r.is_transfer} />
                      <span className={`text-[10px] font-black font-mono shrink-0 ${
                        r.shares_change > 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {r.shares_change > 0 ? '+' : ''}{formatShares(r.shares_change)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-2 border border-border/50">
        <Filter size={14} className="text-muted-foreground" />
        {/* L/F Filter */}
        {(['all','lokal','asing'] as LFFilter[]).map(f => (
          <button key={f} onClick={() => setLfFilter(f)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
              lfFilter === f
                ? f === 'lokal'  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : f === 'asing' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-white/[0.08] text-foreground border-white/[0.12]'
                : 'text-muted-foreground border-transparent hover:border-border/50'
            }`}>
            {f === 'all' ? 'Semua' : f === 'lokal' ? '🏠 Lokal' : '🌐 Asing'}
          </button>
        ))}
        <div className="w-px h-4 bg-border/40 mx-1" />
        {/* Transfer toggle */}
        <button onClick={() => setHideTransfer(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${
            hideTransfer
              ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
          {hideTransfer ? '🔇 Transfer Tersembunyi' : '📢 Tampilkan Transfer'}
        </button>
        {/* Search */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
          <input value={search} onChange={e => setSearch(e.target.value.toUpperCase())}
            placeholder="Kode / nama / sektor..."
            className="pl-8 pr-3 py-1.5 rounded-xl border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50 w-48" />
        </div>
        <span className="text-[10px] text-muted-foreground/40">{filtered.length} records</span>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-border/40 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-bold rounded-t-xl border-b-2 whitespace-nowrap transition-all ${
              tab === t.id
                ? 'text-gold-400 border-gold-400 bg-gold-400/10'
                : 'text-muted-foreground/60 border-transparent hover:text-muted-foreground hover:bg-white/[0.03]'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

      {/* ── Table ── */}
      <div className="glass rounded-2xl overflow-hidden border border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-card/70 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-bold">Tanggal</th>
                <th className="px-4 py-3 text-left font-bold">Kode</th>
                <th className="px-4 py-3 text-left font-bold">Pemegang</th>
                <th className="px-4 py-3 text-center font-bold">Aksi</th>
                {tab !== 'holdings' ? (
                  <>
                    <th className="px-4 py-3 text-right font-bold hidden md:table-cell">Sebelum</th>
                    <th className="px-4 py-3 text-right font-bold">Sesudah</th>
                    <th className="px-4 py-3 text-right font-bold">Perubahan</th>
                  </>
                ) : (
                  <th className="px-4 py-3 text-right font-bold">Saham Dipegang</th>
                )}
                <th className="px-4 py-3 text-center font-bold">L/F</th>
                <th className="px-4 py-3 text-left font-bold hidden lg:table-cell">Sektor</th>
                <th className="px-4 py-3 text-right font-bold hidden md:table-cell">Harga</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/20 animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-3 bg-muted/40 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-muted-foreground">
                  <Users size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-bold">Tidak ada data</p>
                  <p className="text-[11px] mt-1 opacity-60">Coba perluas periode atau ubah filter</p>
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr key={i}
                  onClick={() => loadSahamDetail(r.stock_code)}
                  className={`tr-hover border-b border-border/20 group cursor-pointer ${
                    r.is_transfer ? 'opacity-50' : ''
                  } ${selectedCode === r.stock_code ? 'bg-gold-400/[0.05]' : ''}`}>

                  <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground/60 whitespace-nowrap">
                    {(r.tanggal || r.last_update || '').slice(0, 10)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`font-mono font-black transition-colors ${
                      selectedCode === r.stock_code ? 'text-gold-400' : 'text-foreground group-hover:text-gold-400'
                    }`}>{r.stock_code}</span>
                    {r.group_name && r.group_name !== 'Others' && (
                      <p className="text-[8px] text-muted-foreground/35 truncate max-w-[80px]">{r.group_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px] font-semibold text-foreground/75 truncate block max-w-[200px]">
                      {r.holder_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <AksiChip aksi={r.aksi} isTransfer={r.is_transfer} alertType={r.alert_type} />
                  </td>

                  {tab !== 'holdings' ? (
                    <>
                      <td className="px-4 py-2.5 text-right font-mono text-muted-foreground/50 hidden md:table-cell text-[10px]">
                        {r.shares_prev > 0 ? formatShares(r.shares_prev) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold text-[10px]">
                        {r.shares_curr > 0 ? formatShares(r.shares_curr) : <span className="text-red-400">0</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-black font-mono text-[11px]">
                        {r.shares_change > 0
                          ? <span className="text-emerald-400">+{formatShares(r.shares_change)}</span>
                          : r.shares_change < 0
                            ? <span className="text-red-400">{formatShares(r.shares_change)}</span>
                            : <span className="text-muted-foreground">—</span>}
                      </td>
                    </>
                  ) : (
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">
                      {formatShares(r.current_shares || 0)}
                    </td>
                  )}

                  <td className="px-4 py-2.5 text-center"><LFBadge lf={r.lf || '—'} /></td>

                  <td className="px-4 py-2.5 text-muted-foreground/50 hidden lg:table-cell truncate max-w-[110px] text-[10px]">
                    {r.sector || '—'}
                  </td>

                  <td className="px-4 py-2.5 text-right hidden md:table-cell">
                    {r.current_price ? (
                      <div>
                        <span className="font-mono font-semibold text-[10px]">
                          {Number(r.current_price).toLocaleString('id-ID')}
                        </span>
                        {r.change_pct != null && (
                          <span className={`text-[8px] ml-1 font-bold ${Number(r.change_pct) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {Number(r.change_pct) >= 0 ? '+' : ''}{Number(r.change_pct).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    ) : '—'}
                  </td>

                  <td className="px-2 py-2.5">
                    <ChevronRight size={12} className="text-muted-foreground/25 group-hover:text-gold-400 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border/30 text-[10px] text-muted-foreground/35 flex justify-between">
            <span>
              {filtered.length} records
              {hideTransfer && tab !== 'holdings' && ' · transfer tersembunyi'}
              {' '}· klik baris untuk detail pemegang
            </span>
            <span>Sumber: ksei.data5_mutasi · PDF KSEI harian</span>
          </div>
        )}
      </div>
    </div>
  )
}
