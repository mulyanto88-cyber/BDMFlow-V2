'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/data-table'
import { MetricCard } from '@/components/metric-card'
import { TierBadge } from '@/components/score-gauge'
import { createColumnHelper } from '@tanstack/react-table'
import { Shield, Star, Users, TrendingUp, Search, AlertTriangle, Loader2, ArrowRight } from 'lucide-react'

function fmtM(v: number) { if (v == null) return '—'; const a = Math.abs(v); return a >= 1000 ? `${(v / 1000).toFixed(1)}T` : `${v >= 0 ? '+' : ''}${v.toFixed(1)}M` }
function fmtP(v: number) { if (v == null) return '—'; return `${v >= 0 ? '+' : ''}${v?.toFixed(2) ?? '0.00'}%` }

export default function BandarmologiPage() {
  const [prime, setPrime] = useState<any[]>([])
  const [convergence, setConvergence] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

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

  if (loading) return (
    <div className="sidebar-offset min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )

  const primeLeading = prime.filter((r: any) => r.prime_lead_signal === 'PRIME_LEADING').length
  const strongConv = convergence.filter((r: any) => r.convergence_level === 'STRONG').length

  const primeCol = createColumnHelper<any>()
  const primeColumns = [
    primeCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
    primeCol.accessor('prime_buyers_5d', { header: 'Buyers', cell: r => <span className="font-bold flex items-center gap-1"><Users size={14} className="text-blue-400" />{r.getValue() ?? '0'}</span> }),
    primeCol.accessor('prime_net_5d', { header: 'Net 5D', cell: r => <span className={(Number(r.getValue() ?? 0)) >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400'}>{fmtM(Number(r.getValue() ?? 0))}</span> }),
    primeCol.accessor('prime_lead_signal', { header: 'Lead', cell: r => { const v = String(r.getValue() ?? ''); return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${v === 'PRIME_LEADING' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{v?.replace(/_/g, ' ') || '—'}</span> } }),
    primeCol.accessor('prime_conviction', { header: 'Conviction', cell: r => <span className={String(r.getValue()) === 'HIGH' ? 'text-emerald-400 font-bold' : ''}>{String(r.getValue() ?? '—')}</span> }),
    primeCol.accessor('composite_score', { header: 'Score', cell: r => <span className="font-black">{Math.round(Number(r.getValue() ?? 0))}</span> }),
    primeCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue() ?? 0).toLocaleString('id-ID') }),
    primeCol.accessor('return_5d', { header: '5D%', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(Number(r.getValue() ?? 0))}</span> }),
  ]

  const convCol = createColumnHelper<any>()
  const convColumns = [
    convCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
    convCol.accessor('foreign_buyers_count', { header: 'FGN Buyers', cell: r => <span className="font-bold text-emerald-400">{r.getValue() ?? 0}</span> }),
    convCol.accessor('inst_buyers_count', { header: 'INST Buyers', cell: r => <span className="text-blue-400">{r.getValue() ?? 0}</span> }),
    convCol.accessor('convergence_level', { header: 'Level', cell: r => { const v = String(r.getValue() ?? ''); return <span style={{ color: v === 'STRONG' ? '#22c55e' : '#eab308' }} className="font-bold text-xs">{v}</span> } }),
    convCol.accessor('foreign_net_5d', { header: 'FGN Net 5D', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtM(Number(r.getValue() ?? 0))}</span> }),
    convCol.accessor('composite_score', { header: 'Score', cell: r => <span className="font-black">{Math.round(Number(r.getValue() ?? 0))}</span> }),
    convCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={String(r.getValue() ?? '')} /> }),
    convCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{String(r.getValue() ?? '')}</span> }),
  ]

  const leadCol = createColumnHelper<any>()
  const leaderColumns = [
    leadCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
    leadCol.accessor('broker_score', { header: 'Bandar Score', cell: r => <span className="font-black text-amber-400">{r.getValue() ?? '—'}</span> }),
    leadCol.accessor('composite_score', { header: 'Composite', cell: r => <span className="font-black">{Math.round(Number(r.getValue() ?? 0))}</span> }),
    leadCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={String(r.getValue() ?? '')} /> }),
    leadCol.accessor('prime_net_5d', { header: 'Prime 5D', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtM(Number(r.getValue() ?? 0))}</span> }),
    leadCol.accessor('convergence_level', { header: 'Conv', cell: r => { const v = String(r.getValue() ?? ''); return v ? <span style={{ color: v === 'STRONG' ? '#22c55e' : '#eab308' }} className="text-xs font-bold">{v}</span> : <span className="text-muted-foreground">—</span> } }),
    leadCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue() ?? 0).toLocaleString('id-ID') }),
    leadCol.accessor('change_percent', { header: 'Chg%', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(Number(r.getValue() ?? 0))}</span> }),
    leadCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{String(r.getValue() ?? '')}</span> }),
  ]

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2"><Shield size={22} /> Bandarmologi Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Prime broker tracker · broker convergence map · bandar score leaderboard</p>
          </div>
          <Link href="/composite" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">Composite Command <ArrowRight size={11} /></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Prime Leading" value={primeLeading} sub="Stocks w/ prime broker front-running" trend="up" />
          <MetricCard label="Strong Convergence" value={strongConv} sub="≥3 foreign brokers buying" trend="up" />
          <MetricCard label="Bandar Signals" value={leaderboard.length} sub="By broker score" />
          <MetricCard label="Active Prime Brokers" value="8" sub="RX KZ BB BK GW AK ZP DP" />
        </div>

        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3"><Star size={18} className="text-amber-400" /><h2 className="text-lg font-bold">Prime Broker Tracker</h2></div>
          <DataTable data={prime} columns={primeColumns} pageSize={15} emptyText="No prime broker activity" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3"><Users size={18} className="text-blue-400" /><h2 className="text-lg font-bold">Broker Convergence Map</h2></div>
            <DataTable data={convergence} columns={convColumns} pageSize={12} emptyText="No convergence detected" />
          </div>
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3"><TrendingUp size={18} className="text-amber-400" /><h2 className="text-lg font-bold">Bandar Score Leaderboard</h2></div>
            <DataTable data={leaderboard} columns={leaderColumns} pageSize={10} emptyText="No bandar signals" />
          </div>
        </div>
      </div>
    </div>
  )
}
