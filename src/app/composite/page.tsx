// BDMFlow V2 — Composite Command Center
import React from 'react'
import Link from 'next/link'
import { run } from '@/lib/db'
import { ScoreGauge, TierBadge } from '@/components/score-gauge'
import { DataTable } from '@/components/data-table'
import { MetricCard } from '@/components/metric-card'
import { createColumnHelper } from '@tanstack/react-table'
import { TrendingUp, TrendingDown, Globe, Activity, BarChart3, Shield, ArrowRight } from 'lucide-react'

export const revalidate = 60

async function getData() {
  const [pulse, composite, alerts] = await Promise.all([
    run(`SELECT trading_date::VARCHAR AS date, stock_count::BIGINT, (total_value/1e12)::DOUBLE AS val_triliun, (total_foreign_flow/1e9)::DOUBLE AS foreign_miliar, whale_count::BIGINT, gainers::BIGINT, losers::BIGINT, avg_change_pct::DOUBLE, breadth_score::INTEGER, market_phase, foreign_stance, market_timing_signal, is_accumulation_day FROM market.vw_market_pulse_tab WHERE trading_date=(SELECT MAX(trading_date) FROM market.vw_market_pulse_tab) LIMIT 1`).catch(() => []),
    run(`SELECT rank_overall, stock_code, composite_score, composite_tier, daily_trigger_score, monthly_confirm_score, foreign_score, broker_score, whale_score, ksei_score, insider_score, stealth_quality, foreign_flow_direction, sector, group_name, close::DOUBLE, change_percent::DOUBLE, return_5d::DOUBLE, return_20d::DOUBLE FROM market.vw_d_composite_tab ORDER BY rank_overall ASC LIMIT 30`).catch(() => []),
    run(`SELECT stock_code, alert_count, highest_severity, active_alerts, top_notification, composite_score, composite_tier, sector, close::DOUBLE, change_percent::DOUBLE, badge_color, alert_rank_score FROM market.vw_a_alert_summary ORDER BY highest_severity DESC, alert_rank_score DESC LIMIT 10`).catch(() => []),
  ])
  return { pulse: (pulse as any[])[0] ?? null, composite: composite as any[], alerts: alerts as any[] }
}

function fmtM(v: number) { const a = Math.abs(v); if (a >= 1000) return `${(v / 1000).toFixed(1)}T`; return `${v >= 0 ? '+' : ''}${v.toFixed(0)}M` }
function fmtP(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

const col = createColumnHelper<any>()
const columns = [
  col.accessor('rank_overall', { header: '#', size: 40, cell: r => r.getValue() }),
  col.accessor('stock_code', { header: 'Stock', cell: r => <Link href={`/stock/${r.getValue()}`} className="font-mono font-bold text-sm text-gold-400 hover:underline">{r.getValue()}</Link> }),
  col.accessor('composite_score', { header: 'Score', cell: r => { const s = r.getValue(); return <span className="font-black counter" style={{ color: s >= 80 ? '#22c55e' : s >= 65 ? '#16a34a' : s >= 50 ? '#84cc16' : s >= 35 ? '#eab308' : 'inherit' }}>{Math.round(s)}</span> } }),
  col.accessor('composite_tier', { header: 'Signal', cell: r => <TierBadge tier={r.getValue()} /> }),
  col.accessor('close', { header: 'Close', cell: r => Number(r.getValue()).toLocaleString('id-ID') }),
  col.accessor('change_percent', { header: 'Chg%', cell: r => <span className={r.getValue() >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(r.getValue())}</span> }),
  col.accessor('return_5d', { header: '5D', cell: r => <span className={r.getValue() >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtP(r.getValue())}</span> }),
  col.accessor('sector', { header: 'Sector', cell: r => <span className="text-xs text-muted-foreground">{r.getValue()}</span> }),
  col.accessor('foreign_score', { header: 'FGN', cell: r => r.getValue() }),
  col.accessor('broker_score', { header: 'BKR', cell: r => r.getValue() }),
  col.accessor('whale_score', { header: 'WHL', cell: r => r.getValue() }),
]

const SEV_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#6b7280' }

export default async function CompositeDashboard() {
  const { pulse, composite, alerts } = await getData()

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              BDMFlow V2 — Composite Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{pulse?.date ?? ''} · 959 stocks · Multi-source convergence scoring</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/bandarmologi" className="px-4 py-2 rounded-xl glass card-hover text-xs font-bold border border-amber-500/20 text-amber-400 flex items-center gap-2">
              <Shield size={14} /> Bandarmologi
            </Link>
            <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Morning Brief <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        {/* Market KPIs */}
        {pulse && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <MetricCard label="Market Phase" value={pulse.market_phase?.replace(/_/g, ' ') ?? '—'} sub={pulse.market_timing_signal} trend={pulse.market_phase?.includes('BULL') ? 'up' : pulse.market_phase?.includes('BEAR') ? 'down' : 'neutral'} />
            <MetricCard label="Foreign Flow" value={fmtM(pulse.foreign_miliar)} trend={pulse.foreign_miliar >= 0 ? 'up' : 'down'} />
            <MetricCard label="Breadth" value={pulse.breadth_score ?? '—'} sub={`${pulse.gainers}G / ${pulse.losers}L`} />
            <MetricCard label="Whale Events" value={pulse.whale_count} />
            <MetricCard label="Foreign Stance" value={pulse.foreign_stance?.replace(/_/g, ' ') ?? '—'} />
            <MetricCard label="Avg Change" value={fmtP(pulse.avg_change_pct)} trend={pulse.avg_change_pct >= 0 ? 'up' : 'down'} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Composite Leaderboard */}
          <div className="lg:col-span-2 glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-purple-400" />
                <h2 className="text-lg font-bold">Composite Leaderboard</h2>
              </div>
              <span className="text-xs text-muted-foreground">{composite.length} stocks · Ranked 0-100</span>
            </div>
            <DataTable data={composite} columns={columns} pageSize={15} emptyText="No composite data available" />
          </div>

          {/* Right panel: Top 3 + Alerts */}
          <div className="space-y-4">
            {/* Top 3 Score Gauges */}
            {composite.slice(0, 3).map((s: any, i: number) => (
              <Link key={s.stock_code} href={`/stock/${s.stock_code}`} className="glass rounded-xl p-4 border border-white/5 card-hover flex items-center gap-4 block">
                <ScoreGauge score={s.composite_score} size="sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gold-400">{s.stock_code}</span>
                    {i === 0 && <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Top Pick</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{s.sector} · {s.group_name}</p>
                  <p className="text-xs mt-0.5">{fmtP(s.change_percent)} | 5D: {fmtP(s.return_5d)} | FGN:{s.foreign_score} BKR:{s.broker_score}</p>
                </div>
              </Link>
            ))}

            {/* Active Alerts */}
            <div className="glass rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <Activity size={14} className="text-red-400" /> Active Alerts
              </h3>
              {alerts.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {alerts.map((a: any) => (
                    <Link key={a.stock_code} href={`/stock/${a.stock_code}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.04] transition-colors">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: a.badge_color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-blue-400">{a.stock_code}</span>
                          <span className="text-[10px] text-muted-foreground">{a.active_alerts}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{a.top_notification}</p>
                      </div>
                      <span className="text-xs font-bold">{Math.round(a.composite_score)}</span>
                    </Link>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground py-4 text-center">No active alerts</p>}
            </div>
          </div>
        </div>

        {/* Score Breakdown Legend */}
        <div className="glass rounded-xl p-4 border border-white/5 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Composite Score (0-100):</span>{' '}
          Foreign 25% + Broker 20% + Whale 15% + Price 10% + KSEI 20% + Insider 10%.{' '}
          Daily sources (70%) serve as triggers; monthly KSEI (30%) as confirmation.{' '}
          <span className="text-gold-400 font-semibold">STRONG BUY ≥80</span> ·{' '}
          <span className="text-emerald-400 font-semibold">BUY 65-79</span> ·{' '}
          <span className="text-lime-400 font-semibold">ACCUMULATE 50-64</span> ·{' '}
          <span className="text-amber-400 font-semibold">WATCH 35-49</span> ·{' '}
          <span className="text-slate-400 font-semibold">NEUTRAL 20-34</span> ·{' '}
          <span className="text-red-400 font-semibold">AVOID &lt;20</span>
        </div>
      </div>
    </div>
  )
}
