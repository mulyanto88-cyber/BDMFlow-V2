'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Activity, Building2, RefreshCw, TrendingUp, TrendingDown,
  AlertTriangle, X, Zap, BarChart3, Globe, ArrowRight,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { SectorHeatmap } from '../../../components/sector-heatmap'

// ─── API Helper ───────────────────────────────────────────────────────────────
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
interface SectorData {
  sector: string
  stock_count: number
  avg_change_pct: number
  avg_change_30d: number
  total_value: number
  total_volume: number
  foreign_flow: number
  foreign_30d: number
  avg_aov: number
  max_aov: number
  aov_spike_count: number
  whale_count: number
  anomaly_count: number
  above_vwma_count: number
  volume_spike_count: number
  gainers: number
  losers: number
  momentum_score: number
  signal: string
  flow_intensity: string
  top_stock_code: string
  top_stock_price: number
  top_stock_change: number
}

interface SectorStock {
  stock_code: string
  close: number
  change_percent: number
  net_foreign_value: number
  value: number
  whale_signal: boolean
  big_player_anomaly: boolean
  aov_ratio_ma20: number
  volume: number
  ma20_volume: number
}

type SortKey = 'momentum_score' | 'foreign_flow' | 'breadth' | 'whale_count' | 'avg_change_pct'
type FilterSignal = 'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmtMiliar(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? '+' : '-'
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)} T`
  if (abs >= 1e9)  return `${sign}${(abs / 1e9).toFixed(1)} M`
  if (abs >= 1e6)  return `${sign}${(abs / 1e6).toFixed(0)}Jt`
  return `${sign}${abs.toLocaleString('id-ID')}`
}

// ─── Signal badge styling ─────────────────────────────────────────────────────
function signalStyle(signal: string) {
  if (signal.includes('STRONG BULLISH')) return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
  if (signal.includes('BULLISH'))        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
  if (signal.includes('STRONG BEARISH')) return 'bg-red-500/25 text-red-300 border-red-500/40'
  if (signal.includes('BEARISH'))        return 'bg-red-500/15 text-red-400 border-red-500/25'
  return 'bg-slate-500/15 text-slate-400 border-slate-500/25'
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SectorPage() {
  const [sectors, setSectors]           = useState<SectorData[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [selectedSector, setSelectedSector] = useState<string | null>(null)
  const [sectorStocks, setSectorStocks] = useState<SectorStock[]>([])
  const [stocksLoading, setStocksLoading] = useState(false)
  const [sortBy, setSortBy]             = useState<SortKey>('momentum_score')
  const [sortDir, setSortDir]           = useState<'desc' | 'asc'>('desc')
  const [filterSignal, setFilterSignal] = useState<FilterSignal>('ALL')

  const fetchSectors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await mdQuery(`SELECT * FROM market.vw_sector_analytics ORDER BY momentum_score DESC`)
      setSectors(data.map((d: Record<string, any>) => ({
        sector:           d.sector,
        stock_count:      Number(d.stock_count   || 0),
        avg_change_pct:   Number(d.avg_change_pct  || 0),
        avg_change_30d:   Number(d.avg_change_30d  || 0),
        total_value:      Number(d.total_value    || 0),
        total_volume:     Number(d.total_volume   || 0),
        foreign_flow:     Number(d.foreign_flow   || 0),
        foreign_30d:      Number(d.foreign_30d    || 0),
        avg_aov:          Number(d.avg_aov        || 0),
        max_aov:          Number(d.max_aov        || 0),
        aov_spike_count:  Number(d.aov_spike_count|| 0),
        whale_count:      Number(d.whale_count    || 0),
        anomaly_count:    Number(d.anomaly_count  || 0),
        above_vwma_count: Number(d.above_vwma_count || 0),
        volume_spike_count: Number(d.volume_spike_count || 0),
        gainers:          Number(d.gainers        || 0),
        losers:           Number(d.losers         || 0),
        momentum_score:   Number(d.momentum_score || 0),
        signal:           d.signal       || 'NEUTRAL',
        flow_intensity:   d.flow_intensity || 'LOW',
        top_stock_code:   d.top_stock_code || '',
        top_stock_price:  Number(d.top_stock_price || 0),
        top_stock_change: Number(d.top_stock_change || 0),
      })))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSectors() }, [fetchSectors])

  const fetchSectorStocks = useCallback(async (sector: string) => {
    setStocksLoading(true)
    try {
      const data = await mdQuery(`
        SELECT stock_code, close, change_percent, net_foreign_value, value,
               whale_signal, big_player_anomaly, aov_ratio_ma20, volume, ma20_volume
        FROM market.vw_stock_latest
        WHERE sector = $1
        ORDER BY value DESC LIMIT 50
      `, [sector])
      setSectorStocks(data as SectorStock[])
    } catch (err: any) {
      console.error(err)
    } finally {
      setStocksLoading(false)
    }
  }, [])

  const handleSectorClick = useCallback((sector: string) => {
    if (selectedSector === sector) { setSelectedSector(null); setSectorStocks([]) }
    else { setSelectedSector(sector); fetchSectorStocks(sector) }
  }, [selectedSector, fetchSectorStocks])

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalValue    = sectors.reduce((s, sec) => s + sec.total_value, 0)
  const totalFlow     = sectors.reduce((s, sec) => s + sec.foreign_flow, 0)
  const totalStocks   = sectors.reduce((s, sec) => s + sec.stock_count, 0)
  const avgMomentum   = sectors.length ? Math.round(sectors.reduce((s, sec) => s + sec.momentum_score, 0) / sectors.length) : 0
  const bullishCount  = sectors.filter(s => s.signal.includes('BULLISH')).length
  const bearishCount  = sectors.filter(s => s.signal.includes('BEARISH')).length
  const maxForeignAbs = Math.max(...sectors.map(s => Math.abs(s.foreign_flow)), 1)

  // ── Filtered + sorted sectors ───────────────────────────────────────────────
  const displayed = useMemo(() => {
    let d = [...sectors]
    if (filterSignal !== 'ALL') {
      d = d.filter(s =>
        filterSignal === 'BULLISH' ? s.signal.includes('BULLISH') :
        filterSignal === 'BEARISH' ? s.signal.includes('BEARISH') :
        !s.signal.includes('BULLISH') && !s.signal.includes('BEARISH')
      )
    }
    d.sort((a, b) => {
      let av = 0, bv = 0
      if (sortBy === 'breadth') {
        av = a.stock_count > 0 ? a.gainers / a.stock_count : 0
        bv = b.stock_count > 0 ? b.gainers / b.stock_count : 0
      } else {
        av = Number(a[sortBy]) || 0
        bv = Number(b[sortBy]) || 0
      }
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return d
  }, [sectors, filterSignal, sortBy, sortDir])

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(key); setSortDir('desc') }
  }

  function SortBtn({ k, label }: { k: SortKey; label: string }) {
    const active = sortBy === k
    return (
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
          active
            ? 'bg-gold-400/20 text-gold-400 border-gold-400/35'
            : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
        }`}
      >
        {label}
        {active && (sortDir === 'desc' ? <ChevronDown size={9} /> : <ChevronUp size={9} />)}
      </button>
    )
  }

  return (
    <div className="sidebar-offset space-y-5 animate-fade-in pb-10">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}
          >
            <Building2 className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-gold">Sector Analytics</h1>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {sectors.length} sektor · {totalStocks} saham · Net Foreign: {fmtMiliar(totalFlow)}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSectors}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass card-hover text-xs font-semibold disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {([
          {
            label: 'Total Nilai',
            value: fmtMiliar(totalValue),
            sub: 'Rp hari ini',
            color: 'text-foreground',
            icon: BarChart3 as React.ElementType,
          },
          {
            label: 'Net Foreign',
            value: fmtMiliar(totalFlow),
            sub: totalFlow >= 0 ? 'Inflow dominan' : 'Outflow dominan',
            color: totalFlow >= 0 ? 'text-emerald-400' : 'text-red-400',
            icon: Globe as React.ElementType,
          },
          {
            label: 'Bullish Sektors',
            value: `${bullishCount}`,
            sub: `${bearishCount} bearish · ${sectors.length - bullishCount - bearishCount} neutral`,
            color: bullishCount > bearishCount ? 'text-emerald-400' : 'text-amber-400',
            icon: TrendingUp as React.ElementType,
          },
          {
            label: 'Avg Momentum',
            value: `${avgMomentum}`,
            sub: 'Score 0–100',
            color: avgMomentum >= 50 ? 'text-emerald-400' : avgMomentum >= 30 ? 'text-amber-400' : 'text-red-400',
            icon: Activity as React.ElementType,
          },
        ]).map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="glass metric-card card-hover">
              <div className="metric-label flex items-center gap-1.5">
                <Icon className="w-3 h-3 opacity-60" />
                {k.label}
              </div>
              <div className={`metric-value text-3xl mt-1 counter ${k.color}`}>{k.value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{k.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-xs">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Heatmap ─────────────────────────────────────────────────── */}
      {!loading && sectors.length > 0 && (
        <div>
          <h2 className="section-heading mb-3">Heatmap Momentum</h2>
          <SectorHeatmap
            sectors={sectors}
            onSectorClick={handleSectorClick}
            selectedSector={selectedSector}
          />
        </div>
      )}

      {/* ── Filter + Sort Bar ────────────────────────────────────────── */}
      {!loading && sectors.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-3 panel rounded-xl">
          {/* Signal filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['ALL', 'BULLISH', 'BEARISH', 'NEUTRAL'] as FilterSignal[]).map(f => (
              <button
                key={f}
                onClick={() => setFilterSignal(f)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  filterSignal === f
                    ? f === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35' :
                      f === 'BEARISH' ? 'bg-red-500/20 text-red-300 border-red-500/35' :
                      'bg-gold-400/20 text-gold-400 border-gold-400/35'
                    : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {f === 'ALL' ? `Semua (${sectors.length})` :
                 f === 'BULLISH' ? `Bullish (${bullishCount})` :
                 f === 'BEARISH' ? `Bearish (${bearishCount})` :
                 `Neutral (${sectors.length - bullishCount - bearishCount})`}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border/50 hidden sm:block" />

          {/* Sort buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider hidden sm:block">Sort:</span>
            <SortBtn k="momentum_score" label="Momentum" />
            <SortBtn k="foreign_flow" label="Foreign" />
            <SortBtn k="avg_change_pct" label="Change" />
            <SortBtn k="breadth" label="Breadth" />
            <SortBtn k="whale_count" label="Whale" />
          </div>

          <div className="ml-auto text-[10px] text-muted-foreground">
            {displayed.length} sektor
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-52 rounded-2xl" />
          ))}
        </div>
      )}

      {/* ── Sector Cards ─────────────────────────────────────────────── */}
      {!loading && (
        <>
          <h2 className="section-heading">Detail per Sektor</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayed.map((sec) => {
              const flowBar   = Math.min((Math.abs(sec.foreign_flow) / maxForeignAbs) * 100, 100)
              const vwmaPct   = sec.stock_count > 0 ? (sec.above_vwma_count / sec.stock_count * 100) : 0
              const breadthPct = sec.stock_count > 0 ? (sec.gainers / sec.stock_count * 100) : 0
              const trendDiff = sec.avg_change_pct - sec.avg_change_30d
              const isOpen    = selectedSector === sec.sector

              return (
                <div key={sec.sector}>
                  {/* Card */}
                  <div
                    onClick={() => handleSectorClick(sec.sector)}
                    className={`glass rounded-2xl p-5 cursor-pointer transition-all duration-300 ${
                      isOpen
                        ? 'ring-2 ring-gold-400/40 border-gold-400/25'
                        : 'border-border/30 card-hover'
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black uppercase tracking-wider truncate">{sec.sector}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-foreground">{sec.stock_count} saham</span>
                          {sec.top_stock_code && (
                            <Link
                              href={`/stock/${sec.top_stock_code}`}
                              prefetch={false}
                              onClick={e => e.stopPropagation()}
                              className="text-[9px] text-gold-400/70 hover:text-gold-400 font-mono transition-colors"
                            >
                              ↑ {sec.top_stock_code}
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${signalStyle(sec.signal)}`}>
                          {sec.signal}
                        </span>
                        <Link
                          href={`/radar?sector=${encodeURIComponent(sec.sector)}`}
                          prefetch={false}
                          onClick={e => e.stopPropagation()}
                          title={`Radar ${sec.sector}`}
                          className="text-gold-400/60 hover:text-gold-400 transition-colors"
                        >
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>

                    {/* KPI mini grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {/* Momentum */}
                      <div className="panel p-2 rounded-xl text-center">
                        <p className="text-[8px] text-muted-foreground uppercase mb-0.5">Momentum</p>
                        <p className={`text-xl font-black counter ${
                          sec.momentum_score >= 50 ? 'text-emerald-400' :
                          sec.momentum_score >= 30 ? 'text-amber-400' : 'text-red-400'
                        }`}>{sec.momentum_score}</p>
                      </div>

                      {/* Today vs 30d */}
                      <div className="panel p-2 rounded-xl text-center">
                        <p className="text-[8px] text-muted-foreground uppercase mb-0.5">Avg Chg</p>
                        <p className={`text-xl font-black counter ${sec.avg_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {sec.avg_change_pct >= 0 ? '+' : ''}{sec.avg_change_pct.toFixed(2)}%
                        </p>
                        {sec.avg_change_30d !== 0 && (
                          <p className={`text-[8px] mt-0.5 ${trendDiff >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
                            vs 30d {trendDiff >= 0 ? '▲' : '▼'} {Math.abs(trendDiff).toFixed(2)}%
                          </p>
                        )}
                      </div>

                      {/* Foreign */}
                      <div className="panel p-2 rounded-xl text-center">
                        <p className="text-[8px] text-muted-foreground uppercase mb-0.5">Foreign</p>
                        <p className={`text-sm font-black counter leading-tight ${sec.foreign_flow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtMiliar(sec.foreign_flow)}
                        </p>
                      </div>
                    </div>

                    {/* Foreign flow bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-[8px] text-muted-foreground mb-1">
                        <span>Flow Intensity: <span className="font-bold text-foreground/60">{sec.flow_intensity}</span></span>
                        <span>{fmtMiliar(sec.foreign_30d)} 30d</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${sec.foreign_flow >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                          style={{
                            width: `${flowBar}%`,
                            boxShadow: sec.foreign_flow >= 0 ? '0 0 6px rgba(34,197,94,0.5)' : '0 0 6px rgba(239,68,68,0.5)',
                          }}
                        />
                      </div>
                    </div>

                    {/* Bottom stats */}
                    <div className="grid grid-cols-4 gap-2 pt-2.5 border-t border-white/[0.04] text-center">
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase">VWMA</p>
                        <p className={`text-xs font-bold counter ${vwmaPct >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {vwmaPct.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase">Breadth</p>
                        <p className={`text-xs font-bold counter ${breadthPct >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {breadthPct.toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase">AOV Spike</p>
                        <p className={`text-xs font-bold ${sec.aov_spike_count > 0 ? 'text-gold-400' : 'text-muted-foreground'}`}>
                          {sec.aov_spike_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground uppercase">🐋 Whale</p>
                        <p className={`text-xs font-bold ${sec.whale_count > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                          {sec.whale_count}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Drill-down stocks ──────────────────────────────────── */}
                  {isOpen && (
                    <div className="mt-2 glass rounded-2xl border-gold-400/20 overflow-hidden animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-white/[0.05] bg-gold-400/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gold-400" />
                          <p className="text-xs font-black text-gold-400 uppercase tracking-wider">
                            {sec.sector} — Top Saham
                          </p>
                        </div>
                        <Link
                          href={`/radar?sector=${encodeURIComponent(sec.sector)}`}
                          prefetch={false}
                          className="inline-flex items-center gap-1 text-[10px] text-gold-400/70 hover:text-gold-400 transition-colors font-semibold"
                          onClick={e => e.stopPropagation()}
                        >
                          Full Radar <ArrowRight size={10} />
                        </Link>
                      </div>

                      {stocksLoading ? (
                        <div className="p-4 space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="shimmer h-10 rounded-lg" />
                          ))}
                        </div>
                      ) : sectorStocks.length > 0 ? (
                        <div className="divide-y divide-white/[0.03] max-h-[320px] overflow-y-auto">
                          {sectorStocks.map((stock) => {
                            const chg      = Number(stock.change_percent)
                            const netFg    = Number(stock.net_foreign_value)
                            const aov      = Number(stock.aov_ratio_ma20)
                            const maxVal   = Math.max(...sectorStocks.map(s => Number(s.value)), 1)
                            const barW     = Math.min((Number(stock.value) / maxVal) * 100, 100)

                            return (
                              <Link
                                key={stock.stock_code}
                                href={`/stock/${stock.stock_code}`}
                                prefetch={false}
                                className="flex items-center gap-3 px-4 py-2.5 tr-hover group"
                              >
                                {/* Code + badges */}
                                <div className="w-16 flex-shrink-0">
                                  <p className="font-mono font-black text-xs group-hover:text-gold-400 transition-colors">
                                    {stock.stock_code}
                                  </p>
                                  <div className="flex gap-1 mt-0.5">
                                    {stock.whale_signal && <span className="text-[8px]">🐋</span>}
                                    {stock.big_player_anomaly && <span className="text-[8px]">⚡</span>}
                                  </div>
                                </div>

                                {/* Price + change */}
                                <div className="w-20 flex-shrink-0 text-right">
                                  <p className="text-xs font-semibold counter">
                                    {Number(stock.close).toLocaleString('id-ID')}
                                  </p>
                                  <p className={`text-[10px] font-bold ${chg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {chg >= 0 ? '+' : ''}{chg.toFixed(2)}%
                                  </p>
                                </div>

                                {/* Net foreign */}
                                <div className="w-16 flex-shrink-0 text-right hidden sm:block">
                                  <p className={`text-[10px] font-semibold ${netFg >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {fmtMiliar(netFg)}
                                  </p>
                                  <p className="text-[8px] text-muted-foreground">asing</p>
                                </div>

                                {/* AOV ratio */}
                                {aov >= 1.5 && (
                                  <span className="text-[9px] text-gold-400 font-bold flex-shrink-0">
                                    <Zap size={9} className="inline" />{aov.toFixed(1)}x
                                  </span>
                                )}

                                {/* Value bar (flex-fill) */}
                                <div className="flex-1 min-w-0 hidden md:block">
                                  <div className="h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gold-400/35 rounded-full"
                                      style={{ width: `${barW}%` }}
                                    />
                                  </div>
                                </div>
                              </Link>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="p-4 text-center text-muted-foreground text-xs">
                          Tidak ada saham ditemukan
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
