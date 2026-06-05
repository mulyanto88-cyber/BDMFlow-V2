'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { formatNumber } from '@/lib/utils'
import { RefreshCw, X, AlertTriangle, SlidersHorizontal, Radar, ChevronLeft, ChevronRight, EyeOff, Zap, Filter, Clock, Flame, Globe, Building2 } from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface StockRow {
  stock_code: string
  sector: string
  close: number
  change_percent: number
  smart_score: number
  radar_score: number
  net_foreign_period: number
  aov_max: number
  spike_count: number
  spike_today: boolean
  is_stealth: boolean
  whale_signal: boolean
  big_player_anomaly: boolean
  signal: string
  foreign_broker_net_7d: number
  local_inst_net_7d: number
  ksei_net_smart: number
  fresh_insider_buy: boolean
  daily_value: number   // raw IDR (BIGINT from DB)
  vwma_20d: number
  above_vwma: boolean
}

type SortField = 'radar_score' | 'smart_score' | 'change_percent' | 'net_foreign_period' | 'aov_max' | 'spike_count' | 'close' | 'stock_code' | 'daily_value'

const PERIOD_OPTIONS = [
  { label: '1D', days: 1 }, { label: '7D', days: 7 }, { label: '14D', days: 14 },
  { label: '1M', days: 30 }, { label: '3M', days: 90 },
]

const SIGNAL_STYLE: Record<string, string> = {
  '🚀 STRONG BUY': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  '👀 WATCH':      'bg-amber-500/20  text-amber-400  border border-amber-500/30',
  '➖ NEUTRAL':    'bg-slate-500/20  text-slate-400  border border-slate-500/20',
}

interface PresetFilter {
  flag?: string
  minScore?: number
  minRadarScore?: number
  signal?: string
  onlyActiveToday?: boolean
  minValue?: number
}

const PRESETS = [
  { id: 'hot-today',    name: '🔥 Hot Today',   icon: Flame,     filters: { onlyActiveToday: true, minValue: 10 }                          as PresetFilter },
  { id: 'whale-hunt',   name: '🐋 Whale Hunt',  icon: Zap,       filters: { flag: 'WHALE',     minRadarScore: 50, minValue: 5 }            as PresetFilter },
  { id: 'foreign-in',   name: '🌏 Foreign In',  icon: Globe,     filters: { flag: 'FOREIGN_IN', minValue: 10 }                             as PresetFilter },
  { id: 'consensus',    name: '🤝 Consensus',   icon: Building2, filters: { flag: 'CONSENSUS',  minValue: 5 }                              as PresetFilter },
  { id: 'stealth-mode', name: '🕵️ Stealth',    icon: EyeOff,    filters: { flag: 'STEALTH',   minRadarScore: 40, minValue: 5 }            as PresetFilter },
]

// ─── BrokerDir Badge ──────────────────────────────────────────────────────────
function BrokerDir({ r }: { r: StockRow }) {
  const badge = (val: number, label: string) => {
    const cls = val > 0
      ? 'text-emerald-400 bg-emerald-500/10'
      : val < 0
      ? 'text-red-400 bg-red-500/10'
      : 'text-muted-foreground/30 bg-transparent'
    const arrow = val > 0 ? '↑' : val < 0 ? '↓' : '—'
    return <span key={label} className={`text-[9px] font-bold px-1 rounded ${cls}`}>{label}{arrow}</span>
  }
  return (
    <div className="flex items-center justify-center gap-0.5">
      {badge(r.foreign_broker_net_7d, 'F')}
      {badge(r.local_inst_net_7d, 'I')}
      {badge(r.ksei_net_smart, 'K')}
    </div>
  )
}

// ─── DB helper ────────────────────────────────────────────────────────────────
async function mdQuery(query: string): Promise<any[]> {
  const res = await fetch('/api/motherduck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data || []
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScreenerPage() {
  // Raw data from DB — fetched once, re-used across period changes
  const [rawData, setRawData]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  // UI state
  const [showFilters, setShowFilters]   = useState(false)
  const [showPresets, setShowPresets]   = useState(false)

  // Filters
  const [period, setPeriod]             = useState(7)
  const [filterSignal, setFilterSignal] = useState('ALL')
  const [filterFlag, setFilterFlag]     = useState('ALL')
  const [filterSector, setFilterSector] = useState('ALL')
  const [minScore, setMinScore]         = useState(0)
  const [minRadarScore, setMinRadarScore] = useState(0)
  const [minValue, setMinValue]         = useState(5)   // miliar — liquidity gate
  const [onlyActiveToday, setOnlyActiveToday] = useState(false)

  // Sort & pagination
  const [sortBy, setSortBy]   = useState<SortField>('spike_count')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const [page, setPage]       = useState(1)
  const pageSize = 20

  const periodLabel = period === 30 ? '1M' : period === 90 ? '3M' : `${period}D`

  // ── Fetch (no period dependency — all periods fetched at once) ──────────────
  const abortRef = useRef<AbortController | null>(null)
  const fetchData = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const data = await mdQuery(`
        SELECT
          s.stock_code, s.sector, s.close, s.change_percent, s.smart_money_score,
          s.whale_signal, s.big_player_anomaly, s.signal,
          s.aov_max_1d,  s.aov_max_7d,  s.aov_max_14d,  s.aov_max_30d,  s.aov_max_90d,
          s.spike_1d,    s.spike_7d,    s.spike_14d,    s.spike_30d,    s.spike_90d,
          s.foreign_1d,  s.foreign_7d,  s.foreign_14d,  s.foreign_30d,  s.foreign_90d,
          COALESCE(r.radar_score, 0)               AS radar_score,
          COALESCE(r.foreign_broker_net_7d, 0)     AS foreign_broker_net_7d,
          COALESCE(r.local_inst_net_7d, 0)         AS local_inst_net_7d,
          COALESCE(r.ksei_net_smart_miliar, 0)     AS ksei_net_smart_miliar,
          COALESCE(r.fresh_insider_buy, false)     AS fresh_insider_buy,
          COALESCE(l.value, 0)                     AS daily_value,
          COALESCE(l.vwma_20d, 0)                  AS vwma_20d
        FROM market.vw_screener_allinone s
        LEFT JOIN market.vw_watchlist_radar r ON s.stock_code = r.stock_code
        LEFT JOIN market.vw_stock_latest    l ON s.stock_code = l.stock_code
        WHERE r.warning_flag IS NULL
      `)
      if (controller.signal.aborted) return
      setRawData(data)
    } catch (err: any) {
      if (controller.signal.aborted) return
      setError(err.message || 'Failed to fetch data')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Compute StockRow[] from rawData + period (instant on period change) ─────
  const results = useMemo<StockRow[]>(() => {
    const pd = `${period}d`   // "1d" | "7d" | "14d" | "30d" | "90d"
    return rawData.map((r: any) => {
      const close      = Number(r.close || 0)
      const vwma       = Number(r.vwma_20d || 0)
      const smart_score = Number(r.smart_money_score || 0)
      return {
        stock_code:           r.stock_code,
        sector:               r.sector || '—',
        close,
        change_percent:       Number(r.change_percent || 0),
        smart_score,
        radar_score:          Number(r.radar_score || 0),
        net_foreign_period:   Number(r[`foreign_${pd}`] || 0),
        aov_max:              Number(r[`aov_max_${pd}`] || 0),
        spike_count:          Number(r[`spike_${pd}`] || 0),
        spike_today:          Number(r.spike_1d || 0) > 0,
        is_stealth:           Number(r.change_percent) >= -2 && Number(r.change_percent) <= 2 && smart_score >= 60,
        whale_signal:         Boolean(r.whale_signal),
        big_player_anomaly:   Boolean(r.big_player_anomaly),
        signal:               r.signal || '➖ NEUTRAL',
        foreign_broker_net_7d: Number(r.foreign_broker_net_7d || 0),
        local_inst_net_7d:    Number(r.local_inst_net_7d || 0),
        ksei_net_smart:       Number(r.ksei_net_smart_miliar || 0),
        fresh_insider_buy:    Boolean(r.fresh_insider_buy),
        daily_value:          Number(r.daily_value || 0),
        vwma_20d:             vwma,
        above_vwma:           vwma > 0 && close > vwma,
      }
    })
  }, [rawData, period])

  const sectors    = useMemo(() => ['ALL', ...Array.from(new Set(results.map(r => r.sector).filter(s => s !== '—'))).sort()], [results])
  const activeToday = useMemo(() => results.filter(r => r.spike_today && r.daily_value >= minValue * 1e9).length, [results, minValue])

  // ── Filter + sort ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => results
    .filter(r => {
      if (r.daily_value < minValue * 1e9)                                              return false
      if (onlyActiveToday && !r.spike_today)                                           return false
      if (filterSignal !== 'ALL' && r.signal !== filterSignal)                         return false
      if (filterSector !== 'ALL' && r.sector !== filterSector)                         return false
      if (r.smart_score < minScore)                                                    return false
      if (r.radar_score < minRadarScore)                                               return false
      if (filterFlag === 'WHALE'     && !r.whale_signal)                               return false
      if (filterFlag === 'BIG_PLAYER' && !r.big_player_anomaly)                        return false
      if (filterFlag === 'FOREIGN_IN' && r.foreign_broker_net_7d <= 0)                 return false
      if (filterFlag === 'STEALTH'   && !r.is_stealth)                                 return false
      if (filterFlag === 'CONSENSUS' && !(r.foreign_broker_net_7d > 0 && r.local_inst_net_7d > 0)) return false
      if (filterFlag === 'KSEI_IN'   && r.ksei_net_smart <= 0)                         return false
      if (filterFlag === 'INSIDER'   && !r.fresh_insider_buy)                          return false
      return true
    })
    .sort((a, b) => {
      const av = a[sortBy], bv = b[sortBy]
      const cmp = typeof av === 'string' ? (av as string).localeCompare(bv as string) : Number(av) - Number(bv)
      return sortDir === 'desc' ? -cmp : cmp
    }),
  [results, minValue, onlyActiveToday, filterSignal, filterSector, minScore, minRadarScore, filterFlag, sortBy, sortDir])

  const totalPages    = Math.ceil(filtered.length / pageSize)
  const paginatedData = filtered.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [filterSignal, filterSector, filterFlag, minScore, minRadarScore, minValue, onlyActiveToday])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleSort = (col: SortField) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    const f = preset.filters
    setFilterSignal(f.signal || 'ALL')
    setFilterFlag(f.flag || 'ALL')
    setMinScore(f.minScore ?? 0)
    setMinRadarScore(f.minRadarScore ?? 0)
    setMinValue(f.minValue ?? 5)
    setOnlyActiveToday(f.onlyActiveToday || false)
    setShowPresets(false)
  }

  const resetFilters = () => {
    setFilterSignal('ALL'); setFilterSector('ALL'); setFilterFlag('ALL')
    setMinScore(0); setMinRadarScore(0); setMinValue(5); setOnlyActiveToday(false)
    setPeriod(7)
  }

  const hasActiveFilters = filterSignal !== 'ALL' || filterFlag !== 'ALL' || filterSector !== 'ALL'
    || minScore > 0 || minRadarScore > 0 || minValue !== 5 || onlyActiveToday

  const SortArrow = ({ col }: { col: SortField }) =>
    sortBy === col ? <span className="text-gold-400">{sortDir === 'desc' ? ' ▼' : ' ▲'}</span> : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="sidebar-offset space-y-5 animate-fade-in pb-10">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
            <Radar className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h1 className="text-[20px] font-black tracking-tight">Screener Pro</h1>
            <p className="text-muted-foreground text-xs">
              {loading
                ? 'Scanning market…'
                : <>{filtered.length} / {results.length} stocks · {periodLabel} · <span className="text-orange-400 font-semibold">{activeToday} active today</span></>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Presets dropdown */}
          <div className="relative">
            <button onClick={() => setShowPresets(p => !p)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gold-400/30 bg-gold-400/10 text-gold-400 text-xs font-bold hover:bg-gold-400/20 transition-all">
              <Zap className="w-4 h-4" /> Presets
            </button>
            {showPresets && (
              <div className="absolute right-0 top-full mt-2 glass rounded-xl border border-gold-400/20 shadow-2xl z-50 min-w-[200px] overflow-hidden">
                {PRESETS.map(p => (
                  <button key={p.id} onClick={() => applyPreset(p)}
                    className="w-full px-4 py-3 text-left text-xs hover:bg-gold-400/10 flex items-center gap-3 border-b border-white/[0.05] last:border-0">
                    <p.icon className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    <span className="font-semibold">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${showFilters ? 'bg-gold-400/20 border-gold-400/40 text-gold-400' : 'glass border-border/30 text-muted-foreground hover:text-foreground'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            Filter
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 inline-block" />}
          </button>

          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-400/10 border border-gold-400/30 text-gold-400 text-xs font-bold hover:bg-gold-400/20 transition-all disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Scan
          </button>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="text-xs text-red-400 hover:text-red-300 underline">Reset</button>
          )}
        </div>
      </div>

      {/* ── PERIOD + QUICK TOGGLES ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period picker */}
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
          <Clock className="w-3.5 h-3.5 text-muted-foreground ml-2" />
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.days} onClick={() => setPeriod(opt.days)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-all ${period === opt.days ? 'bg-gold-400/20 text-gold-400' : 'text-muted-foreground hover:text-white'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Active Today toggle */}
        <button onClick={() => setOnlyActiveToday(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${onlyActiveToday ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' : 'glass border-white/[0.06] text-muted-foreground hover:text-white'}`}>
          <Flame className="w-3 h-3" />
          Active Today
          {activeToday > 0 && (
            <span className={`px-1.5 rounded-full ${onlyActiveToday ? 'bg-orange-500/40' : 'bg-white/10'}`}>{activeToday}</span>
          )}
        </button>

        {/* Preset quick chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => applyPreset(p)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/[0.06] text-[10px] font-semibold hover:border-gold-400/30 transition-all">
              <p.icon className="w-3 h-3 text-gold-400" />
              {p.name.replace(/^\S+\s/, '')}
            </button>
          ))}
        </div>
      </div>

      {/* ── ADVANCED FILTERS ─────────────────────────────────────────────── */}
      {showFilters && (
        <div className="panel rounded-2xl p-5 border border-gold-400/20 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gold-400 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Advanced Filters
            </h3>
            <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground underline">Reset All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase mb-2 block">Signal</label>
              <select value={filterSignal} onChange={e => setFilterSignal(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs focus:border-gold-400/30 focus:outline-none">
                <option value="ALL">Semua</option>
                <option value="🚀 STRONG BUY">🚀 Strong Buy</option>
                <option value="👀 WATCH">👀 Watch</option>
                <option value="➖ NEUTRAL">➖ Neutral</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase mb-2 block">Sektor</label>
              <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs focus:border-gold-400/30 focus:outline-none">
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase mb-2 block">Flag</label>
              <select value={filterFlag} onChange={e => setFilterFlag(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-3 py-2 text-xs focus:border-gold-400/30 focus:outline-none">
                <option value="ALL">Semua</option>
                <option value="WHALE">🐋 Whale</option>
                <option value="BIG_PLAYER">⚡ Big Player</option>
                <option value="FOREIGN_IN">🌏 Foreign In</option>
                <option value="CONSENSUS">🤝 F+I Consensus</option>
                <option value="KSEI_IN">📊 KSEI Smart In</option>
                <option value="INSIDER">🎯 Insider Buy</option>
                <option value="STEALTH">🕵️ Stealth</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase mb-2 block">
                Min Value: <span className="text-gold-400 font-bold">{minValue === 0 ? 'Off' : `${minValue} M`}</span>
              </label>
              <input type="range" min={0} max={50} step={5} value={minValue}
                onChange={e => setMinValue(Number(e.target.value))} className="w-full accent-amber-400 mt-2" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase mb-2 block">
                Min Radar: <span className="text-gold-400 font-bold">{minRadarScore}</span>
              </label>
              <input type="range" min={0} max={80} step={5} value={minRadarScore}
                onChange={e => setMinRadarScore(Number(e.target.value))} className="w-full accent-amber-400 mt-2" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground uppercase mb-2 block">
                Min Score: <span className="text-gold-400 font-bold">{minScore}</span>
              </label>
              <input type="range" min={0} max={80} step={5} value={minScore}
                onChange={e => setMinScore(Number(e.target.value))} className="w-full accent-amber-400 mt-2" />
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── TABLE ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer h-12 rounded-xl" />)}
        </div>

      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 border border-border/30 text-center">
          <Radar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No results</h3>
          <p className="text-muted-foreground text-sm mb-4">Coba turunkan Min Value atau hapus filter aktif</p>
          <button onClick={resetFilters}
            className="px-6 py-2.5 bg-gold-400/20 border border-gold-400/30 text-gold-400 rounded-xl text-sm font-bold hover:bg-gold-400/30 transition-all">
            Reset Filters
          </button>
        </div>

      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Showing <span className="text-gold-400 font-bold">{paginatedData.length}</span> of{' '}
              <span className="text-foreground font-bold">{filtered.length}</span> stocks
            </p>
            <p className="text-[10px] text-muted-foreground/40">Dir: F=Asing · I=Institusi Lokal · K=KSEI Smart</p>
          </div>

          <div className="glass rounded-2xl overflow-hidden border border-white/[0.06]">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                    <th className="p-2 text-left w-6">#</th>
                    <th className="p-2 text-left sticky left-0 bg-card/95 backdrop-blur-sm z-10 cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('stock_code')}>Kode<SortArrow col="stock_code" /></th>
                    <th className="p-2 text-left hidden md:table-cell">Sektor</th>
                    <th className="p-2 text-right cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('close')}>Close<SortArrow col="close" /></th>
                    <th className="p-2 text-right cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('change_percent')}>Chg%<SortArrow col="change_percent" /></th>
                    <th className="p-2 text-right cursor-pointer hover:text-foreground hidden sm:table-cell"
                       onClick={() => toggleSort('daily_value')}>Val<SortArrow col="daily_value" /></th>
                    <th className="p-2 text-center cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('aov_max')}>AOV<SortArrow col="aov_max" /></th>
                    <th className="p-2 text-center cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('spike_count')}>Spikes ({periodLabel})<SortArrow col="spike_count" /></th>
                    <th className="p-2 text-center cursor-pointer hover:text-foreground hidden lg:table-cell"
                      onClick={() => toggleSort('radar_score')}>Radar<SortArrow col="radar_score" /></th>
                    <th className="p-2 text-center hidden md:table-cell">Dir</th>
                    <th className="p-2 text-center">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((r, i) => (
                    <tr key={r.stock_code} className="tr-hover border-b border-white/[0.02] group hover:bg-gold-400/[0.03] transition-all">

                      {/* # */}
                      <td className="p-2 text-[10px] text-muted-foreground">{(page - 1) * pageSize + i + 1}</td>

                      {/* Kode */}
                      <td className="p-2 sticky left-0 bg-card group-hover:bg-card/95 backdrop-blur-sm z-10">
                        <Link href={`/stock/${r.stock_code}`} prefetch={false} className="block">
                          <p className="font-black font-mono text-xs text-foreground group-hover:text-gold-400 transition-colors">{r.stock_code}</p>
                          {r.fresh_insider_buy && <span className="text-[8px] text-purple-400">🎯 insider</span>}
                        </Link>
                      </td>

                      {/* Sektor */}
                      <td className="p-2 hidden md:table-cell text-[10px] text-muted-foreground truncate max-w-[100px]">{r.sector}</td>

                      {/* Close + above VWMA indicator */}
                      <td className="p-2 text-right font-semibold text-foreground">
                        {formatNumber(r.close)}
                        {r.above_vwma && <span className="ml-1 text-[8px] text-emerald-400/60">▲V</span>}
                      </td>

                      {/* Chg% */}
                      <td className={`p-2 text-right font-bold ${r.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.change_percent >= 0 ? '+' : ''}{r.change_percent.toFixed(2)}%
                      </td>

                      {/* Val — smart unit: T / M / Jt */}
                      <td className="p-2 text-right hidden sm:table-cell font-mono">
                        {r.daily_value >= 1e9
                          ? <span className={r.daily_value >= 50e9 ? 'text-emerald-400' : r.daily_value >= 10e9 ? 'text-amber-400' : 'text-foreground'}>
                              {r.daily_value >= 1e12
                                ? `${(r.daily_value / 1e12).toFixed(1)} T`
                                : r.daily_value >= 1e9
                                  ? `${(r.daily_value / 1e9).toFixed(0)} M`
                                  : `${(r.daily_value / 1e6).toFixed(0)} Jt`}
                            </span>
                          : <span className="text-muted-foreground/30">—</span>
                        }
                      </td>

                      {/* AOV Max */}
                      <td className="p-2 text-center">
                        {r.aov_max > 0
                          ? <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold font-mono ${r.aov_max >= 2 ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {r.aov_max.toFixed(2)}x
                            </span>
                          : <span className="text-muted-foreground/30">—</span>
                        }
                      </td>

                      {/* Spikes — frequency count + active today + whale/big_player flags */}
                      <td className="p-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.spike_today && <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                          <span className={`font-black text-sm ${r.spike_count >= 3 ? 'text-purple-400' : r.spike_count >= 1 ? 'text-blue-400' : 'text-muted-foreground/40'}`}>
                            {r.spike_count}
                          </span>
                          {r.whale_signal        && <span className="text-[10px]" title="Whale Signal">🐋</span>}
                          {r.big_player_anomaly  && <span className="text-[10px]" title="Big Player Anomaly">⚡</span>}
                          {r.is_stealth          && <span className="text-[10px]" title="Stealth Accumulation">🕵️</span>}
                        </div>
                      </td>

                      {/* Radar Score */}
                      <td className="p-2 text-center hidden lg:table-cell">
                        <span className={`text-sm font-black ${r.radar_score >= 70 ? 'text-emerald-400' : r.radar_score >= 50 ? 'text-amber-400' : r.radar_score >= 30 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                          {r.radar_score > 0 ? r.radar_score : '—'}
                        </span>
                      </td>

                      {/* Broker Direction */}
                      <td className="p-2 text-center hidden md:table-cell">
                        <BrokerDir r={r} />
                      </td>

                      {/* Signal */}
                      <td className="p-2 text-center">
                        <Link href={`/stock/${r.stock_code}`} prefetch={false}>
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${SIGNAL_STYLE[r.signal] || SIGNAL_STYLE['➖ NEUTRAL']}`}>
                            {r.signal}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/[0.05] flex items-center justify-between">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-border/30 text-xs font-bold disabled:opacity-50">
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs text-muted-foreground">
                  Page <span className="text-gold-400 font-bold">{page}</span> of <span className="font-bold">{totalPages}</span>
                </span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-border/30 text-xs font-bold disabled:opacity-50">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
