'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ScoreGauge, TierBadge } from '@/components/score-gauge'
import { DataTable } from '@/components/data-table'
import { MetricCard } from '@/components/metric-card'
import { createColumnHelper } from '@tanstack/react-table'
import { BarChart3, Activity, Shield, AlertTriangle, Loader2 } from 'lucide-react'

function fmtM(v: number) { if (v == null) return '—'; const a = Math.abs(v); return a >= 1000 ? `${(v / 1000).toFixed(1)}T` : `${v >= 0 ? '+' : ''}${v.toFixed(0)}M` }
function fmtP(v: number) { if (v == null) return '—'; return `${v >= 0 ? '+' : ''}${v?.toFixed(2) ?? '0.00'}%` }

const col = createColumnHelper<any>()
const columns = [
  col.accessor('rank_overall', { header: '#', size: 40, cell: r => r.getValue() }),
  col.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
  col.accessor('composite_score', { header: 'Score', cell: r => { const s = Number(r.getValue() ?? 0); return <span className="font-black counter" style={{ color: s >= 80 ? '#22c55e' : s >= 65 ? '#16a34a' : s >= 50 ? '#84cc16' : s >= 35 ? '#eab308' : 'inherit' }}>{Math.round(s)}</span> } }),
  col.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={String(r.getValue() ?? '')} /> }),
  col.accessor('close', { header: 'Close', cell: r => { const v = Number(r.getValue() ?? 0); return v.toLocaleString('id-ID') } }),
  col.accessor('change_percent', { header: 'Chg%', cell: r => <span className={(Number(r.getValue() ?? 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(Number(r.getValue() ?? 0))}</span> }),
  col.accessor('return_5d', { header: '5D', cell: r => <span className={(Number(r.getValue() ?? 0)) >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(Number(r.getValue() ?? 0))}</span> }),
  col.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{String(r.getValue() ?? '')}</span> }),
  col.accessor('foreign_score', { header: 'FGN', cell: r => String(r.getValue() ?? '—') }),
  col.accessor('broker_score', { header: 'BKR', cell: r => String(r.getValue() ?? '—') }),
  col.accessor('whale_score', { header: 'WHL', cell: r => String(r.getValue() ?? '—') }),
]

export default function CompositePage() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/composite?page=${page}&pageSize=30`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setData(d.data ?? []); setTotal(d.total ?? 0) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [page])

  if (error) return (
    <div className="sidebar-offset min-h-screen flex items-center justify-center">
      <div className="text-center glass rounded-2xl p-12 border border-white/5">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <p className="text-muted-foreground font-bold text-lg">Composite data unavailable</p>
        <p className="text-xs text-muted-foreground/60 mt-2 mb-4">{error}</p>
        <Link href="/dashboard" className="text-xs text-blue-400">Back to Market →</Link>
      </div>
    </div>
  )
  if (loading) return <div className="sidebar-offset min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Composite Command Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Multi-source convergence scoring · {total} stocks ranked 0-100</p>
          </div>
          <Link href="/bandarmologi" className="px-4 py-2 rounded-xl glass card-hover text-xs font-bold border border-amber-500/20 text-amber-400 flex items-center gap-2"><Shield size={14} /> Bandarmologi</Link>
        </div>

        {/* Top 3 Score Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.slice(0, 3).map((s: any, i: number) => (
            <Link key={s.stock_code} href={`/stock/${s.stock_code}`} className="glass rounded-xl p-5 border border-white/5 card-hover flex items-center gap-4">
              <ScoreGauge score={Number(s.composite_score ?? 0)} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg text-gold-400">{s.stock_code}</span>
                  {i === 0 && <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">#1</span>}
                </div>
                <p className="text-xs text-muted-foreground">{s.sector} · {s.group_name}</p>
                <p className="text-xs mt-1">FGN:{s.foreign_score} BKR:{s.broker_score} WHL:{s.whale_score} KSEI:{s.ksei_score} INS:{s.insider_score}</p>
                <div className="flex gap-3 mt-2">
                  <span className={Number(s.change_percent ?? 0) >= 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>{fmtP(Number(s.change_percent ?? 0))}</span>
                  <span className={Number(s.return_5d ?? 0) >= 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>5D: {fmtP(Number(s.return_5d ?? 0))}</span>
                  <span className={Number(s.return_20d ?? 0) >= 0 ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>20D: {fmtP(Number(s.return_20d ?? 0))}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Composite Leaderboard Table */}
        <div className="glass rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-2 mb-4"><BarChart3 size={18} className="text-purple-400" /><h2 className="text-lg font-bold">Composite Leaderboard</h2><span className="text-xs text-muted-foreground ml-auto">Ranked by convergence score</span></div>
          <DataTable data={data} columns={columns} pageSize={20} emptyText="No composite data. Run Phase A views in MotherDuck." />
        </div>

        {/* Legend */}
        <div className="glass rounded-xl p-4 border border-white/5 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Score (0-100):</span> Foreign 25 + Broker 20 + Whale 15 + Price 10 + KSEI 20 + Insider 10.{' '}
          <span className="text-gold-400 font-semibold">STRONG BUY ≥80</span> · <span className="text-emerald-400 font-semibold">BUY 65-79</span> · <span className="text-lime-400 font-semibold">ACCUMULATE 50-64</span> · <span className="text-amber-400 font-semibold">WATCH 35-49</span> · <span className="text-red-400 font-semibold">AVOID &lt;20</span>
        </div>
      </div>
    </div>
  )
}
