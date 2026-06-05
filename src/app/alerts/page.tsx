'use client'
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TierBadge } from '@/components/score-gauge'
import { Bell, TrendingUp, Eye, AlertTriangle, ArrowRightLeft, Shield, Loader2 } from 'lucide-react'

const ICONS: Record<string, React.ReactNode> = {
  WHALE: <TrendingUp size={13} />, STEALTH: <Eye size={13} />, INSIDER: <Shield size={13} />,
  DISTRIBUTION: <AlertTriangle size={13} />, REVERSAL: <ArrowRightLeft size={13} />,
  PRIME_LEAD: <TrendingUp size={13} />, VOLUME_SPIKE: <TrendingUp size={13} />,
  KSEI_ENTRY: <Shield size={13} />,
}
const SEV: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#6b7280' }

export default function AlertCenter() {
  const [summary, setSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/alerts/summary')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setSummary(Array.isArray(d) ? d : []) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (error) return (
    <div className="sidebar-offset min-h-screen flex items-center justify-center">
      <div className="text-center glass rounded-2xl p-12 border border-white/5">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <p className="text-muted-foreground font-bold text-lg">Alert data unavailable</p>
        <p className="text-xs text-muted-foreground/60 mt-2 mb-4">{error}</p>
        <Link href="/dashboard" className="text-xs text-blue-400">Back to Market →</Link>
      </div>
    </div>
  )
  if (loading) return <div className="sidebar-offset min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2"><Bell size={22} /> Alert Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Layer 5 threshold-based alerts · 6 alert types aggregated per stock</p>
        </div>

        {summary.length === 0 ? (
          <div className="glass rounded-2xl p-20 border border-white/5 text-center">
            <Bell size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg font-bold">No Active Alerts</p>
            <p className="text-xs text-muted-foreground/60 mt-2">All clear — no threshold breaches detected. Run Phase A views if this persists.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {summary.map((alert: any) => {
              const alerts = String(alert.active_alerts ?? '').split(',').map((a: string) => a.trim()).filter(Boolean)
              return (
                <Link key={alert.stock_code} href={`/stock/${alert.stock_code}`} className="glass rounded-2xl p-5 border border-white/5 card-hover group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gold-400">{alert.stock_code}</span>
                      <TierBadge tier={String(alert.composite_tier ?? '')} />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-black counter">{Math.round(Number(alert.composite_score ?? 0))}</span>
                      <span className="text-[10px] text-muted-foreground">{Number(alert.close ?? 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {alerts.map((a: string) => (
                      <span key={a} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: (SEV[alert.highest_severity] ?? '#6b7280') + '18', color: SEV[alert.highest_severity] ?? '#6b7280', borderColor: (SEV[alert.highest_severity] ?? '#6b7280') + '30' }}>
                        {ICONS[a] ?? null}{a}
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

        <div className="glass rounded-xl p-4 border border-white/5 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Alert Severity:</span>{' '}
          <span style={{ color: '#ef4444' }}>CRITICAL</span> · <span style={{ color: '#f97316' }}>HIGH</span> · <span style={{ color: '#eab308' }}>MEDIUM</span> · <span style={{ color: '#6b7280' }}>LOW</span>
          {' | '}
          <span className="font-bold text-foreground">Types:</span> WHALE · STEALTH · INSIDER · DISTRIBUTION · REVERSAL · KSEI_ENTRY
        </div>
      </div>
    </div>
  )
}
