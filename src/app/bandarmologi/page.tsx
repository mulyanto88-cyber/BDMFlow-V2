// BDMFlow V2 — Bandarmologi Panel
import React from 'react'
import Link from 'next/link'
import { run } from '@/lib/db'
import { DataTable } from '@/components/data-table'
import { MetricCard } from '@/components/metric-card'
import { TierBadge } from '@/components/score-gauge'
import { createColumnHelper } from '@tanstack/react-table'
import { Shield, Star, Users, TrendingUp, ArrowRight } from 'lucide-react'

export const revalidate = 60

async function getData() {
  const [prime, convergence, leaderboard] = await Promise.all([
    run(`SELECT stock_code, prime_net_5d::DOUBLE, prime_net_20d::DOUBLE, prime_buyers_5d, prime_lead_signal, prime_conviction, prime_is_buyer_5d, composite_score, composite_tier, sector, close::DOUBLE, return_5d::DOUBLE FROM market.vw_d_broker_intel_tab WHERE prime_is_buyer_5d = true OR prime_lead_signal IN ('PRIME_LEADING','ALIGNED_BUY') ORDER BY prime_net_5d DESC LIMIT 25`).catch(() => []),
    run(`SELECT stock_code, foreign_net_5d::DOUBLE, inst_net_5d::DOUBLE, convergence_level, foreign_buyers_count, inst_buyers_count, composite_score, composite_tier, sector, close::DOUBLE, return_5d::DOUBLE FROM market.vw_d_broker_intel_tab WHERE convergence_level IN ('STRONG','MODERATE') ORDER BY foreign_buyers_count DESC, composite_score DESC LIMIT 25`).catch(() => []),
    run(`SELECT stock_code, composite_score, composite_tier, broker_score, foreign_score, whale_score, prime_net_5d::DOUBLE, convergence_level, stealth_quality, sector, group_name, close::DOUBLE, change_percent::DOUBLE, return_5d::DOUBLE FROM market.vw_d_broker_intel_tab WHERE composite_score >= 40 ORDER BY broker_score DESC, composite_score DESC LIMIT 20`).catch(() => []),
  ])
  return { prime: prime as any[], convergence: convergence as any[], leaderboard: leaderboard as any[] }
}

function fmtP(v: number) { return `${v >= 0 ? '+' : ''}${v?.toFixed(2) ?? '0.00'}%` }
function fmtM(v: number) { const abs = Math.abs(v); return `${v >= 0 ? '+' : ''}${abs >= 1000 ? (v / 1000).toFixed(1) + 'T' : v.toFixed(1) + 'M'}` }

const primeCol = createColumnHelper<any>()
const primeColumns = [
  primeCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
  primeCol.accessor('prime_buyers_5d', { header: 'Buyers', cell: r => <span className="font-bold flex items-center gap-1"><Users size={14} className="text-blue-400" />{r.getValue()}</span> }),
  primeCol.accessor('prime_net_5d', { header: 'Net 5D', cell: r => <span className={r.getValue() >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400'}>{fmtM(r.getValue())}</span> }),
  primeCol.accessor('prime_lead_signal', { header: 'Lead', cell: r => { const v = r.getValue() as string; return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${v === 'PRIME_LEADING' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}`}>{v?.replace(/_/g, ' ') ?? '—'}</span> } }),
  primeCol.accessor('prime_conviction', { header: 'Conviction', cell: r => <span className={r.getValue() === 'HIGH' ? 'text-emerald-400 font-bold' : ''}>{r.getValue() ?? '—'}</span> }),
  primeCol.accessor('composite_score', { header: 'Score', cell: r => <span className="font-black">{Math.round(r.getValue() ?? 0)}</span> }),
  primeCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue()).toLocaleString('id-ID') }),
  primeCol.accessor('return_5d', { header: '5D%', cell: r => <span className={r.getValue() >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(r.getValue())}</span> }),
]

const convCol = createColumnHelper<any>()
const convColumns = [
  convCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
  convCol.accessor('foreign_buyers_count', { header: 'FGN Buyers', cell: r => <span className="font-bold text-emerald-400">{r.getValue()}</span> }),
  convCol.accessor('inst_buyers_count', { header: 'INST Buyers', cell: r => <span className="text-blue-400">{r.getValue()}</span> }),
  convCol.accessor('convergence_level', { header: 'Level', cell: r => { const v = r.getValue() as string; return <span style={{ color: v === 'STRONG' ? '#22c55e' : '#eab308' }} className="font-bold text-xs">{v}</span> } }),
  convCol.accessor('foreign_net_5d', { header: 'FGN Net 5D', cell: r => <span className={r.getValue() >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtM(r.getValue())}</span> }),
  convCol.accessor('composite_score', { header: 'Score', cell: r => <span className="font-black">{Math.round(r.getValue() ?? 0)}</span> }),
  convCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={r.getValue()} /> }),
  convCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{r.getValue()}</span> }),
]

const leadCol = createColumnHelper<any>()
const leaderColumns = [
  leadCol.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
  leadCol.accessor('broker_score', { header: 'Bandar Score', cell: r => <span className="font-black text-amber-400">{r.getValue()}</span> }),
  leadCol.accessor('composite_score', { header: 'Composite', cell: r => <span className="font-black">{Math.round(r.getValue() ?? 0)}</span> }),
  leadCol.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={r.getValue()} /> }),
  leadCol.accessor('prime_net_5d', { header: 'Prime 5D', cell: r => <span className={Number(r.getValue() ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtM(r.getValue() ?? 0)}</span> }),
  leadCol.accessor('convergence_level', { header: 'Convergence', cell: r => { const v = r.getValue() as string; return v ? <span style={{ color: v === 'STRONG' ? '#22c55e' : '#eab308' }} className="text-xs font-bold">{v}</span> : <span className="text-muted-foreground">—</span> } }),
  leadCol.accessor('close', { header: 'Price', cell: r => Number(r.getValue()).toLocaleString('id-ID') }),
  leadCol.accessor('change_percent', { header: 'Chg%', cell: r => <span className={r.getValue() >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(r.getValue())}</span> }),
  leadCol.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{r.getValue()}</span> }),
]

export default async function BandarmologiPage() {
  const { prime, convergence, leaderboard } = await getData()
  const primeLeading = prime.filter((r: any) => r.prime_lead_signal === 'PRIME_LEADING').length
  const strongConv = convergence.filter((r: any) => r.convergence_level === 'STRONG').length

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <Shield size={22} /> Bandarmologi Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Prime broker tracker · broker convergence map · bandar score leaderboard</p>
          </div>
          <Link href="/composite" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Composite Command <ArrowRight size={11} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Prime Leading" value={primeLeading} sub="Stocks w/ prime broker front-running" trend="up" />
          <MetricCard label="Strong Convergence" value={strongConv} sub="≥3 foreign brokers buying" trend="up" />
          <MetricCard label="Bandar Signals" value={leaderboard.length} sub="Top 20 by broker score" />
          <MetricCard label="Active Prime Brokers" value="8" sub="RX KZ BB BK GW AK ZP DP" />
        </div>

        {/* Prime Broker Tracker */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Star size={18} className="text-amber-400" />
            <h2 className="text-lg font-bold">Prime Broker Tracker</h2>
            <span className="text-xs text-muted-foreground">What RX, KZ, BB, BK, GW, AK, ZP, DP are buying this week</span>
          </div>
          <DataTable data={prime} columns={primeColumns} pageSize={15} emptyText="No prime broker activity detected" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Convergence Map */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3"><Users size={18} className="text-blue-400" /><h2 className="text-lg font-bold">Broker Convergence Map</h2></div>
            <p className="text-xs text-muted-foreground mb-3">Multiple brokers clustering on same stock = higher conviction. STRONG = ≥3 foreign brokers buying simultaneously.</p>
            <DataTable data={convergence} columns={convColumns} pageSize={12} emptyText="No strong convergence detected" />
          </div>

          {/* Leaderboard */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center gap-2 mb-3"><TrendingUp size={18} className="text-amber-400" /><h2 className="text-lg font-bold">Bandar Score Leaderboard</h2></div>
            <p className="text-xs text-muted-foreground mb-3">Ranked by broker score — measures institutional positioning quality.</p>
            <DataTable data={leaderboard} columns={leaderColumns} pageSize={10} emptyText="No bandar signals" />
          </div>
        </div>
      </div>
    </div>
  )
}
