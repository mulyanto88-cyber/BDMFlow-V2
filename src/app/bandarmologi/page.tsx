'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { MetricCard } from '@/components/metric-card'
import { TierBadge } from '@/components/score-gauge'
import { createColumnHelper } from '@tanstack/react-table'
import { Shield, Star, TrendingUp, Users, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'

function fmtP(v: number) { if (v == null) return '—'; return `${v >= 0 ? '+' : ''}${v?.toFixed(2) ?? '0.00'}%` }

export default function BandarmologiPage() {
  const [prime, setPrime] = useState<any[]>([])
  const [convergence, setConvergence] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/bandarmologi?action=prime').then(r => r.json()).catch(() => []),
      fetch('/api/bandarmologi?action=convergence').then(r => r.json()).catch(() => []),
      fetch('/api/bandarmologi?action=leaderboard').then(r => r.json()).catch(() => []),
    ]).then(([p, c, l]) => {
      setPrime(Array.isArray(p) ? p : p.data ?? [])
      setConvergence(Array.isArray(c) ? c : c.data ?? [])
      setLeaderboard(Array.isArray(l) ? l : l.data ?? [])
    }).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  if (error) return (
    <div className="sidebar-offset min-h-screen flex items-center justify-center">
      <div className="text-center glass rounded-2xl p-12 border border-white/5">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <p className="text-muted-foreground font-bold text-lg">Bandarmologi data unavailable</p>
        <p className="text-xs text-muted-foreground/60 mt-2 mb-4">{error}</p>
        <Link href="/dashboard" className="text-xs text-blue-400">Back to Market →</Link>
      </div>
    </div>
  )
  if (loading) return <div className="sidebar-offset min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  // KPIs from data
  const allData = [...prime, ...convergence, ...leaderboard]
  const highBroker = allData.filter((r: any) => (r.broker_score ?? 0) >= 10).length
  const highForeign = allData.filter((r: any) => (r.foreign_score ?? 0) >= 15).length
  const totalSignals = leaderboard.length

  const primeCol = createColumnHelper<any>()
  const primeColumns = [
    primeCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
    primeCol.accessor('broker_score', { header: 'Broker', cell: r => <span className="font-bold text-amber-400">{r.getValue() ?? '—'}</span> }),
    primeCol.accessor('foreign_score', { header: 'Foreign', cell: r => <span className="font-bold text-blue-400">{r.getValue() ?? '—'}</span> }),
    primeCol.accessor('whale_score', { header: 'Whale', cell: r => <span>{r.getValue() ?? '—'}</span> }),
    primeCol.accessor('composite_score', { header: 'Score', cell: r => <span className="font-black">{Math.round(Number(r.getValue() ?? 0))}</span> }),
    primeCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={String(r.getValue() ?? '')} /> }),
    primeCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue() ?? 0).toLocaleString('id-ID') }),
    primeCol.accessor('return_5d', { header: '5D%', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(Number(r.getValue() ?? 0))}</span> }),
    primeCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{String(r.getValue() ?? '')}</span> }),
  ]

  const convCol = createColumnHelper<any>()
  const convColumns = [
    convCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
    convCol.accessor('foreign_score', { header: 'Foreign Score', cell: r => <span className="font-bold text-blue-400">{r.getValue() ?? '—'}</span> }),
    convCol.accessor('broker_score', { header: 'Broker Score', cell: r => <span className="font-bold text-amber-400">{r.getValue() ?? '—'}</span> }),
    convCol.accessor('composite_score', { header: 'Composite', cell: r => <span className="font-black">{Math.round(Number(r.getValue() ?? 0))}</span> }),
    convCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={String(r.getValue() ?? '')} /> }),
    convCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue() ?? 0).toLocaleString('id-ID') }),
    convCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{String(r.getValue() ?? '')}</span> }),
  ]

  const leaderCol = createColumnHelper<any>()
  const leaderColumns = [
    leaderCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
    leaderCol.accessor('broker_score', { header: 'Bandar Score', cell: r => <span className="font-black text-amber-400">{r.getValue() ?? '—'}</span> }),
    leaderCol.accessor('foreign_score', { header: 'Foreign', cell: r => <span>{r.getValue() ?? '—'}</span> }),
    leaderCol.accessor('whale_score', { header: 'Whale', cell: r => <span>{r.getValue() ?? '—'}</span> }),
    leaderCol.accessor('composite_score', { header: 'Composite', cell: r => <span className="font-black">{Math.round(Number(r.getValue() ?? 0))}</span> }),
    leaderCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={String(r.getValue() ?? '')} /> }),
    leaderCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue() ?? 0).toLocaleString('id-ID') }),
    leaderCol.accessor('change_percent', { header: 'Chg%', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(Number(r.getValue() ?? 0))}</span> }),
    leaderCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{String(r.getValue() ?? '')}</span> }),
  ]

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2"><Shield size={22} /> Bandarmologi Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Broker intelligence · composite scoring · sector breakdown</p>
          </div>
          <Link href="/composite" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">Composite Command <ArrowRight size={11} /></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="High Broker Score" value={highBroker} sub="broker_score ≥12" trend="up" />
          <MetricCard label="High Foreign Score" value={highForeign} sub="foreign_score ≥18" trend="up" />
          <MetricCard label="Total Signals" value={totalSignals} sub="Stocks tracked" />
          <MetricCard label="Composite Coverage" value="959" sub="All stocks scored" />
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3"><Star size={18} className="text-amber-400" /><h2 className="text-lg font-bold">Broker Score Tracker</h2></div>
          <p className="text-xs text-muted-foreground mb-3">Top stocks ranked by broker score — measures institutional broker positioning strength across all sources.</p>
          <DataTable data={prime} columns={primeColumns} pageSize={15} emptyText="No data. Run Phase A views in MotherDuck." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3"><Users size={18} className="text-blue-400" /><h2 className="text-lg font-bold">Foreign Score Leaders</h2></div>
            <p className="text-xs text-muted-foreground mb-3">Stocks with strongest foreign flow signals — ranked by foreign_score component.</p>
            <DataTable data={convergence} columns={convColumns} pageSize={12} emptyText="No data" />
          </div>
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3"><TrendingUp size={18} className="text-amber-400" /><h2 className="text-lg font-bold">Bandar Leaderboard</h2></div>
            <p className="text-xs text-muted-foreground mb-3">Ranked by broker score — combines foreign, institutional, and whale positioning signals.</p>
            <DataTable data={leaderboard} columns={leaderColumns} pageSize={10} emptyText="No data" />
          </div>
        </div>
      </div>
    </div>
  )
}
