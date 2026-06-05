'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { formatRupiah } from '@/lib/utils'
import {
  Search, Crown, Activity, Shield, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, TrendingUp, TrendingDown,
  Zap, BarChart2, Star
} from 'lucide-react'
import Link from 'next/link'

// ─── API Helper ──────────────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface TacticalData {
  stock_code: string
  tactical_signal: string
  close: number
  change_percent: number
  net_foreign_1d: number
  net_foreign_7d_miliar: number
  net_foreign_30d_miliar: number
  broker_net_7d_miliar: number
  broker_net_30d_miliar: number
}

interface StrategicData {
  stock_code: string
  strategic_signal: string
  total_inst_pct: number
  prev_inst_pct: number
  mom_change_pct: number
}

interface SmartScoreData {
  stock_code: string
  sector: string
  close: number
  change_percent: number
  foreign_30d: number
  broker_net: number
  whale_signal: boolean
  big_player_anomaly: boolean
  aov_ratio_ma20: number
  smart_money_score: number
  signal: string
}

interface SearchedStock {
  code: string
  tactical?: TacticalData | null
  strategic?: StrategicData | null
  notFound?: boolean
}

type SortField = 'close' | 'change_percent' | 'net_foreign_1d' | 'net_foreign_7d_miliar' | 'broker_net_7d_miliar'
type SortDir = 'asc' | 'desc'
type ActiveTab = 'TACTICAL' | 'STRATEGIC' | 'SMART_SCORE'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMiliar(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? '+' : '-'
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)} T`
  if (abs >= 1)    return `${sign}${abs.toFixed(1)} M`
  if (abs > 0)     return `${sign}${(abs * 1000).toFixed(0)}Jt`
  return '0'
}

function tacticalBadge(signal: string): string {
  const s = (signal || '').toUpperCase()
  if (s.includes('STRONG_BUY') || s === 'STRONG_BULLISH' || s.includes('STRONG BUY'))
    return 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
  if (s.includes('BULL') || s.includes('BUY') || s.includes('MOMENTUM'))
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
  if (s.includes('STRONG_SELL') || s === 'STRONG_BEARISH' || s.includes('STRONG SELL'))
    return 'bg-red-500/30 text-red-300 border border-red-500/50'
  if (s.includes('BEAR') || s.includes('SELL') || s.includes('REVERSAL'))
    return 'bg-red-500/15 text-red-400 border border-red-500/25'
  return 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
}

function strategicBadge(signal: string): string {
  const s = (signal || '').toUpperCase()
  if (s.includes('ACCUM') || s.includes('BUY') || s.includes('BULL'))
    return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
  if (s.includes('DISTRIB') || s.includes('SELL') || s.includes('BEAR'))
    return 'bg-red-500/15 text-red-400 border border-red-500/25'
  return 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
}

function scoreBadge(score: number): string {
  if (score >= 70) return 'bg-emerald-500/25 text-emerald-300'
  if (score >= 50) return 'bg-blue-500/20 text-blue-400'
  if (score >= 30) return 'bg-slate-500/15 text-slate-400'
  return 'bg-red-500/15 text-red-400'
}

function sigColor(s: string): string {
  const u = s.toUpperCase()
  if (u.includes('STRONG_BUY') || u.includes('STRONG BUY')) return 'bg-emerald-400'
  if (u.includes('BULL') || u.includes('BUY') || u.includes('ACCUM')) return 'bg-emerald-600'
  if (u.includes('STRONG_SELL') || u.includes('STRONG SELL')) return 'bg-red-400'
  if (u.includes('BEAR') || u.includes('SELL') || u.includes('DISTRIB')) return 'bg-red-600'
  return 'bg-slate-500'
}

// ─── Tabs config ──────────────────────────────────────────────────────────────
const TABS: { id: ActiveTab; label: string; color: string; bar: string }[] = [
  { id: 'TACTICAL',    label: '⚡ Tactical (Daily)',    color: 'text-gold-400', bar: 'bg-gold-400' },
  { id: 'STRATEGIC',   label: '🛡️ Strategic (Monthly)', color: 'text-gold-400', bar: 'bg-gold-400' },
  { id: 'SMART_SCORE', label: '⭐ Smart Score',          color: 'text-gold-400', bar: 'bg-gold-400' },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function SmartMoneyMatrix() {
  const [activeTab, setActiveTab]           = useState<ActiveTab>('TACTICAL')
  const [searchQuery, setSearchQuery]       = useState('')
  const [searchedStock, setSearchedStock]   = useState<SearchedStock | null>(null)
  const [searchLoading, setSearchLoading]   = useState(false)

  const [tacticalList, setTacticalList]     = useState<TacticalData[]>([])
  const [strategicList, setStrategicList]   = useState<StrategicData[]>([])
  const [smartScoreList, setSmartScoreList] = useState<SmartScoreData[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)

  const [threshold, setThreshold]   = useState(10)
  const [foreignDays, setForeignDays] = useState(5)
  const [sortBy, setSortBy]         = useState<SortField>('net_foreign_7d_miliar')
  const [sortDir, setSortDir]       = useState<SortDir>('desc')

  // ─── Fetches ──────────────────────────────────────────────────────────────
  const fetchStrategic = useCallback(async () => {
    try {
      const data = await mdQuery(`
        SELECT * FROM ksei.vw_ksei_inst_positioning
        ORDER BY mom_change_pct DESC
        LIMIT 50
      `)
      setStrategicList(data as StrategicData[])
    } catch (err: any) {
      console.error('Strategic Error:', err)
    }
  }, [])

  const fetchSmartScore = useCallback(async () => {
    try {
      const data = await mdQuery(`
        SELECT * FROM market.vw_smart_money_score
        ORDER BY smart_money_score DESC
        LIMIT 50
      `)
      setSmartScoreList(data as SmartScoreData[])
    } catch (err: any) {
      console.error('SmartScore Error:', err)
    }
  }, [])

  const fetchTactical = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await mdQuery(`
        SELECT * FROM market.vw_tactical_momentum_smart_money
        WHERE ABS(net_foreign_7d_miliar * 1e9) > CAST($1 AS DOUBLE)
           OR ABS(broker_net_7d_miliar * 1e9)  > CAST($1 AS DOUBLE)
        ORDER BY ABS(net_foreign_7d_miliar) DESC, ABS(broker_net_7d_miliar) DESC
        LIMIT 50
      `, [threshold * 1_000_000_000])
      setTacticalList(data as TacticalData[])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [threshold, foreignDays])

  useEffect(() => { fetchStrategic()  }, [fetchStrategic])
  useEffect(() => { fetchSmartScore() }, [fetchSmartScore])
  useEffect(() => { fetchTactical()   }, [fetchTactical])

  // ─── Computed ─────────────────────────────────────────────────────────────
  const sortedTactical = useMemo(() => {
    return [...tacticalList].sort((a, b) => {
      const av = Number(a[sortBy as keyof TacticalData]) || 0
      const bv = Number(b[sortBy as keyof TacticalData]) || 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
  }, [tacticalList, sortBy, sortDir])

  const kpis = useMemo(() => {
    const bullish    = tacticalList.filter(r => {
      const s = (r.tactical_signal || '').toUpperCase()
      return s.includes('BULL') || s.includes('BUY')
    }).length
    const netForeign = tacticalList.reduce((s, r) => s + Number(r.net_foreign_7d_miliar || 0), 0)
    const netBroker  = tacticalList.reduce((s, r) => s + Number(r.broker_net_7d_miliar  || 0), 0)
    const accum      = strategicList.filter(r => {
      const s = (r.strategic_signal || '').toUpperCase()
      return s.includes('ACCUM') || s.includes('BUY') || s.includes('BULL')
    }).length
    return { bullish, netForeign, netBroker, accum, total: tacticalList.length }
  }, [tacticalList, strategicList])

  const maxAbsForeign = useMemo(() =>
    Math.max(...sortedTactical.map(r => Math.abs(Number(r.net_foreign_7d_miliar || 0))), 1),
  [sortedTactical])

  const tacSignalDist = useMemo(() => {
    const cnt: Record<string, number> = {}
    tacticalList.forEach(r => { const s = r.tactical_signal || 'OTHER'; cnt[s] = (cnt[s] || 0) + 1 })
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])
  }, [tacticalList])

  const strSignalDist = useMemo(() => {
    const cnt: Record<string, number> = {}
    strategicList.forEach(r => { const s = r.strategic_signal || 'OTHER'; cnt[s] = (cnt[s] || 0) + 1 })
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])
  }, [strategicList])

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const toggleSort = (field: SortField) => {
    if (sortBy === field) setSortDir(p => p === 'desc' ? 'asc' : 'desc')
    else { setSortBy(field); setSortDir('desc') }
  }

  const SortArrow = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-20" />
    return sortDir === 'desc'
      ? <ArrowDown className="w-3 h-3 text-gold-400" />
      : <ArrowUp   className="w-3 h-3 text-gold-400" />
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    const code = searchQuery.trim().toUpperCase()
    try {
      // Promise.allSettled — jika 1 query gagal, query lain tetap jalan
      const [tacResult, strResult] = await Promise.allSettled([
        mdQuery(`SELECT * FROM market.vw_tactical_momentum_smart_money WHERE stock_code = $1`, [code]),
        mdQuery(`SELECT * FROM ksei.vw_ksei_inst_positioning WHERE stock_code = $1`, [code]),
      ])
      const tacData = tacResult.status === 'fulfilled' ? tacResult.value : []
      const strData = strResult.status === 'fulfilled' ? strResult.value : []

      if (tacData.length > 0 || strData.length > 0) {
        setSearchedStock({ code, tactical: tacData[0] || null, strategic: strData[0] || null })
      } else {
        setSearchedStock({ code, notFound: true })
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setSearchLoading(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="sidebar-offset space-y-6 animate-fade-in pb-10 max-w-6xl mx-auto px-4 md:px-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
          <Crown className="w-5 h-5 text-gold-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-gold">Smart Money Matrix</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Institutional command center — Tactical Flow · Strategic Positioning · Smart Score
          </p>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
        <div className="metric-card card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bullish Tactical</span>
          </div>
          <div className="text-2xl font-black text-emerald-400">{kpis.bullish}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{kpis.total} stocks scanned</div>
        </div>

        <div className="metric-card card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Foreign 5D</span>
          </div>
          <div className={`text-2xl font-black ${kpis.netForeign >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmtMiliar(kpis.netForeign)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">top {kpis.total} stocks</div>
        </div>

        <div className="metric-card card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Net Broker 5D</span>
          </div>
          <div className={`text-2xl font-black ${kpis.netBroker >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {fmtMiliar(kpis.netBroker)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">prime broker net</div>
        </div>

        <div className="metric-card card-hover p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gold-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Accumulating</span>
          </div>
          <div className="text-2xl font-black text-gold-400">{kpis.accum}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{strategicList.length} strategic tracked</div>
        </div>
      </div>

      {/* ── Stock Validator ── */}
      <div className="glass rounded-2xl p-6 border border-border/30">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <Search className="w-4 h-4 text-gold-400" />
          Stock Intelligence Lookup
        </h2>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Enter ticker — e.g. BBCA"
              className="w-full bg-white/5 border border-border/50 rounded-xl py-2.5 pl-4 pr-10 text-white font-mono uppercase text-sm focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <button type="submit" disabled={searchLoading}
            className="px-4 py-2 bg-gold-400/15 border border-gold-400/30 text-gold-400 rounded-xl text-sm font-bold hover:bg-gold-400/25 transition-all disabled:opacity-50">
            {searchLoading ? '…' : 'Analyze'}
          </button>
          {searchedStock && (
            <button type="button" onClick={() => setSearchedStock(null)}
              className="px-3 py-2 bg-white/[0.04] border border-white/10 text-muted-foreground rounded-xl text-sm hover:text-white transition-all">
              ✕
            </button>
          )}
        </form>

        {searchLoading && <div className="shimmer h-32 rounded-xl" />}

        {searchedStock && !searchLoading && !searchedStock.notFound && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
            {/* Tactical card */}
            <div className="glass p-5 rounded-xl border border-teal-500/20 bg-teal-900/[0.07]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-teal-400 text-sm">⚡ Tactical Momentum (Daily)</h3>
              </div>
              {searchedStock.tactical ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${tacticalBadge(searchedStock.tactical.tactical_signal)}`}>
                      {searchedStock.tactical.tactical_signal}
                    </span>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground uppercase">Price</p>
                      <p className="font-mono font-bold text-sm">{formatRupiah(Number(searchedStock.tactical.close))}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Chg</p>
                      <p className={`text-sm font-bold ${Number(searchedStock.tactical.change_percent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(searchedStock.tactical.change_percent) > 0 ? '+' : ''}{Number(searchedStock.tactical.change_percent).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Foreign 1D</p>
                      <p className={`text-xs font-bold ${Number(searchedStock.tactical.net_foreign_1d) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtMiliar(Number(searchedStock.tactical.net_foreign_1d) / 1e9)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase">Foreign 5D</p>
                      <p className={`text-xs font-bold ${Number(searchedStock.tactical.net_foreign_7d_miliar) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtMiliar(Number(searchedStock.tactical.net_foreign_7d_miliar))}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] text-muted-foreground uppercase mb-1">Broker Net 5D</p>
                    <p className={`text-sm font-bold ${Number(searchedStock.tactical.broker_net_7d_miliar) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmtMiliar(Number(searchedStock.tactical.broker_net_7d_miliar))}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent daily data.</p>
              )}
            </div>

            {/* Strategic card */}
            <div className="glass p-5 rounded-xl border border-emerald-500/20 bg-emerald-900/[0.07]">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-emerald-400 text-sm">🛡️ Strategic Positioning (Monthly)</h3>
              </div>
              {searchedStock.strategic ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded ${strategicBadge(searchedStock.strategic.strategic_signal)}`}>
                      {searchedStock.strategic.strategic_signal}
                    </span>
                    <div className="text-right">
                      <p className="text-[9px] text-muted-foreground uppercase">Inst. Own</p>
                      <p className="font-mono font-bold text-sm">{Number(searchedStock.strategic.total_inst_pct).toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/5">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Prev: {Number(searchedStock.strategic.prev_inst_pct).toFixed(2)}%</span>
                      <span className={`font-bold ${Number(searchedStock.strategic.mom_change_pct) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        MoM: {Number(searchedStock.strategic.mom_change_pct) > 0 ? '+' : ''}{Number(searchedStock.strategic.mom_change_pct).toFixed(2)}%
                      </span>
                    </div>
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Number(searchedStock.strategic.total_inst_pct))}%` }} />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No institutional data found.</p>
              )}
            </div>
          </div>
        )}

        {searchedStock?.notFound && (
          <div className="flex items-center gap-2 text-gold-400 text-sm bg-gold-400/10 border border-gold-400/20 rounded-xl px-4 py-3">
            <span>⚠️</span>
            <span>Stock <strong>{searchedStock.code}</strong> not found in smart money database.</span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/50">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${
              activeTab === tab.id ? tab.color : 'text-muted-foreground hover:text-white'
            }`}>
            {tab.label}
            {activeTab === tab.id && (
              <span className={`absolute bottom-[-1px] left-0 w-full h-0.5 ${tab.bar}`} />
            )}
          </button>
        ))}
      </div>

      {/* ── Filter Bar (Tactical only) ── */}
      {activeTab === 'TACTICAL' && (
        <div className="panel flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-medium">Period:</span>
            {[{ label: '1D', v: 1 }, { label: '3D', v: 3 }, { label: '5D', v: 5 }, { label: '10D', v: 10 }].map(p => (
              <button key={p.v} onClick={() => setForeignDays(p.v)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  foreignDays === p.v
                    ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                    : 'text-muted-foreground hover:text-white bg-white/[0.03] border border-white/[0.06]'
                }`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Min Flow:</span>
            {[1, 5, 10, 50, 100].map(t => (
              <button key={t} onClick={() => setThreshold(t)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  threshold === t
                    ? 'bg-gold-400/20 text-gold-400 border border-gold-400/30'
                    : 'text-muted-foreground hover:text-white bg-white/[0.03] border border-white/[0.06]'
                }`}>
                {t} M
              </button>
            ))}
          </div>

          {tacSignalDist.length > 0 && kpis.total > 0 && (
            <div className="flex items-center gap-2 ml-auto text-xs">
              <BarChart2 className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="flex h-2 w-28 rounded-full overflow-hidden gap-px">
                {tacSignalDist.map(([sig, cnt]) => (
                  <div key={sig} className={`h-full ${sigColor(sig)}`}
                    style={{ width: `${(cnt / kpis.total) * 100}%` }}
                    title={`${sig}: ${cnt}`} />
                ))}
              </div>
              <span className="text-muted-foreground">{kpis.bullish} bullish</span>
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-14 rounded-xl" style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">{error}</div>
      ) : (
        <div className="glass rounded-2xl border border-border/30 overflow-hidden">

          {/* ── TACTICAL ── */}
          {activeTab === 'TACTICAL' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium w-8">#</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Signal</th>
                    <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('close')}>
                      <span className="flex items-center justify-end gap-1">Price <SortArrow field="close" /></span>
                    </th>
                    <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('change_percent')}>
                      <span className="flex items-center justify-end gap-1">Chg% <SortArrow field="change_percent" /></span>
                    </th>
                    <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('net_foreign_1d')}>
                      <span className="flex items-center justify-end gap-1">Foreign 1D <SortArrow field="net_foreign_1d" /></span>
                    </th>
                    <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('net_foreign_7d_miliar')}>
                      <span className="flex items-center justify-end gap-1">
                        Foreign {foreignDays}D <SortArrow field="net_foreign_7d_miliar" />
                      </span>
                    </th>
                    <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white transition-colors"
                        onClick={() => toggleSort('broker_net_7d_miliar')}>
                      <span className="flex items-center justify-end gap-1">Broker Net <SortArrow field="broker_net_7d_miliar" /></span>
                    </th>
                    <th className="px-4 py-3 font-medium w-20">Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {sortedTactical.map((row, i) => {
                    const forVal = Number(row.net_foreign_7d_miliar || 0)
                    const barW   = Math.round((Math.abs(forVal) / maxAbsForeign) * 100)
                    return (
                      <tr key={i} className="tr-hover group">
                        <td className="px-3 py-3 text-xs text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/stock/${row.stock_code}`} prefetch={false}
                            className="font-mono font-black text-gold-400 hover:text-gold-300 transition-colors">
                            {row.stock_code}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap ${tacticalBadge(row.tactical_signal)}`}>
                            {row.tactical_signal}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {formatRupiah(Number(row.close))}
                        </td>
                        <td className={`px-4 py-3 text-right text-xs font-bold ${Number(row.change_percent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(row.change_percent) > 0 ? '+' : ''}{Number(row.change_percent).toFixed(2)}%
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-xs ${Number(row.net_foreign_1d) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtMiliar(Number(row.net_foreign_1d) / 1e9)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${forVal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtMiliar(forVal)}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono text-xs ${Number(row.broker_net_7d_miliar) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtMiliar(Number(row.broker_net_7d_miliar))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${forVal >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {sortedTactical.length === 0 && (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No signals match current threshold. Try lowering Min Flow.
                </div>
              )}
            </div>
          )}

          {/* ── STRATEGIC ── */}
          {activeTab === 'STRATEGIC' && (
            <div>
              {strSignalDist.length > 0 && strategicList.length > 0 && (
                <div className="px-5 py-3 border-b border-border/30 flex items-center gap-3 bg-white/[0.01]">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Distribution:</span>
                  <div className="flex h-2 flex-1 max-w-[200px] rounded-full overflow-hidden gap-px">
                    {strSignalDist.map(([sig, cnt]) => (
                      <div key={sig} className={`h-full ${sigColor(sig)}`}
                        style={{ width: `${(cnt / strategicList.length) * 100}%` }}
                        title={`${sig}: ${cnt}`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">{kpis.accum} accumulating</span>
                  <span className="text-[10px] text-muted-foreground">{strategicList.length} total</span>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/[0.02] border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium w-8">#</th>
                      <th className="px-4 py-3 font-medium">Stock</th>
                      <th className="px-4 py-3 font-medium">Signal</th>
                      <th className="px-4 py-3 font-medium text-right">Inst. Own</th>
                      <th className="px-4 py-3 font-medium text-right">Prev Own</th>
                      <th className="px-4 py-3 font-medium text-right">MoM Δ</th>
                      <th className="px-4 py-3 font-medium w-24">Ownership</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {strategicList.map((row, i) => {
                      const mom    = Number(row.mom_change_pct || 0)
                      const ownPct = Math.min(100, Number(row.total_inst_pct || 0))
                      return (
                        <tr key={i} className="tr-hover">
                          <td className="px-3 py-3 text-xs text-muted-foreground">{i + 1}</td>
                          <td className="px-4 py-3">
                            <Link href={`/stock/${row.stock_code}`} prefetch={false}
                              className="font-mono font-black text-gold-400 hover:text-gold-300 transition-colors">
                              {row.stock_code}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap ${strategicBadge(row.strategic_signal)}`}>
                              {row.strategic_signal}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-white font-bold">
                            {Number(row.total_inst_pct).toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">
                            {Number(row.prev_inst_pct).toFixed(2)}%
                          </td>
                          <td className={`px-4 py-3 text-right font-mono text-xs font-bold ${mom >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {mom > 0 ? '+' : ''}{mom.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${ownPct}%` }} />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {strategicList.length === 0 && (
                  <div className="p-10 text-center text-muted-foreground text-sm">
                    No strategic data available.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SMART SCORE ── */}
          {activeTab === 'SMART_SCORE' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.02] border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3 font-medium w-8">#</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium">Sector</th>
                    <th className="px-4 py-3 font-medium">Signal</th>
                    <th className="px-4 py-3 font-medium text-center">Score</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Chg%</th>
                    <th className="px-4 py-3 font-medium text-right">Foreign 30D</th>
                    <th className="px-4 py-3 font-medium text-center">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {smartScoreList.map((row, i) => (
                    <tr key={i} className="tr-hover">
                      <td className="px-3 py-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3">
                        <Link href={`/stock/${row.stock_code}`} prefetch={false}
                          className="font-mono font-black text-gold-400 hover:text-gold-300 transition-colors">
                          {row.stock_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[90px]">
                        {row.sector}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded whitespace-nowrap ${tacticalBadge(row.signal)}`}>
                          {row.signal}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${scoreBadge(Number(row.smart_money_score))}`}>
                          {row.smart_money_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">
                        {formatRupiah(Number(row.close))}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-bold ${Number(row.change_percent) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(row.change_percent) > 0 ? '+' : ''}{Number(row.change_percent).toFixed(2)}%
                      </td>
                      <td className={`px-4 py-3 text-right font-mono text-xs ${Number(row.foreign_30d) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtMiliar(Number(row.foreign_30d) / 1e9)}
                      </td>
                      <td className="px-4 py-3 text-center text-base">
                        {row.whale_signal      && <span title="Whale Signal">🐋</span>}
                        {row.big_player_anomaly && <span title="Big Player Anomaly" className="ml-0.5">⚡</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {smartScoreList.length === 0 && (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No smart score data available.
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
