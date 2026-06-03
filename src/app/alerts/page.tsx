// BDMFlow V2 — Alert Center
import React from 'react'
import Link from 'next/link'
import { run } from '@/lib/db'
import { TierBadge } from '@/components/score-gauge'
import { Bell, TrendingUp, Eye, AlertTriangle, ArrowRightLeft, Shield } from 'lucide-react'

export const revalidate = 60

const ALERT_ICONS: Record<string, React.ReactNode> = {
  WHALE: <TrendingUp size={13} />, STEALTH: <Eye size={13} />, INSIDER: <Shield size={13} />,
  DISTRIBUTION: <AlertTriangle size={13} />, REVERSAL: <ArrowRightLeft size={13} />,
  PRIME_LEAD: <TrendingUp size={13} />, VOLUME_SPIKE: <TrendingUp size={13} />,
  KSEI_ENTRY: <Shield size={13} />, SCORE_BREAKOUT: <Bell size={13} />,
}

const SEV_COLORS: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#6b7280' }

async function getData() {
  const [summary] = await Promise.all([
    run(`SELECT stock_code, alert_count, highest_severity, active_alerts, top_notification, composite_score, composite_tier, sector, close::DOUBLE, change_percent::DOUBLE, badge_color, alert_rank_score FROM market.vw_a_alert_summary ORDER BY highest_severity DESC, alert_rank_score DESC`).catch(() => []),
  ])
  return { summary: summary as any[] }
}

export default async function AlertCenter() {
  const { summary } = await getData()

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
              <Bell size={22} /> Alert Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Layer 5 threshold-based alerts · 15 alert types · institutional-grade notification engine</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{summary.length} stocks with active alerts</span>
          </div>
        </div>

        {summary.length === 0 ? (
          <div className="glass rounded-2xl p-20 border border-white/5 text-center">
            <Bell size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg font-bold">No Active Alerts</p>
            <p className="text-xs text-muted-foreground/60 mt-2">All clear — no threshold breaches detected in the latest data</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {summary.map((alert: any) => {
              const alerts = (alert.active_alerts as string)?.split(',').map((a: string) => a.trim()) ?? []
              return (
                <Link key={alert.stock_code} href={`/stock/${alert.stock_code}`} className="glass rounded-2xl p-5 border border-white/5 card-hover group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gold-400">{alert.stock_code}</span>
                      <TierBadge tier={alert.composite_tier} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black counter">{Math.round(alert.composite_score)}</span>
                      <span className="text-[10px] text-muted-foreground">{Number(alert.close).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  {/* Alert type badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {alerts.map((a: string) => (
                      <span key={a} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: (SEV_COLORS[alert.highest_severity] ?? '#6b7280') + '18', color: SEV_COLORS[alert.highest_severity] ?? '#6b7280', borderColor: (SEV_COLORS[alert.highest_severity] ?? '#6b7280') + '30' }}>
                        {ALERT_ICONS[a] ?? null}{a}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{alert.top_notification}</p>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: alert.badge_color }} />
                      <span className="text-[10px] font-bold">{alert.highest_severity} · {alert.alert_count} alert{alert.alert_count > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{alert.sector}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Legend */}
        <div className="glass rounded-xl p-4 border border-white/5 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Alert Severity:</span>{' '}
          <span style={{ color: '#ef4444' }}>CRITICAL</span> · <span style={{ color: '#f97316' }}>HIGH</span> · <span style={{ color: '#eab308' }}>MEDIUM</span> · <span style={{ color: '#6b7280' }}>LOW</span>
          {' | '}
          <span className="font-bold text-foreground">Alert Types:</span>{' '}
          WHALE · STEALTH · INSIDER · DISTRIBUTION · REVERSAL · PRIME_LEAD · VOLUME_SPIKE · KSEI_ENTRY · SCORE_BREAKOUT
        </div>
      </div>
    </div>
  )
}
