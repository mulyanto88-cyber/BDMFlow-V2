'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TierBadge } from '@/components/score-gauge'
import { Bell, TrendingUp, Eye, AlertTriangle, ArrowRightLeft, Shield, Loader2 } from 'lucide-react'

const ICONS: Record<string, React.ReactNode> = {
  WHALE: <TrendingUp size={13} />, STEALTH: <Eye size={13} />, INSIDER: <Shield size={13} />,
  DISTRIBUTION: <AlertTriangle size={13} />, REVERSAL: <ArrowRightLeft size={13} />,
  PRIME_LEAD: <TrendingUp size={13} />, VOLUME_SPIKE: <TrendingUp size={13} />,
}
const SEV: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#6b7280' }

export default function AlertCenter() {
  const [summary, setSummary] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/radar?action=signals').then(r => r.json()).then(d => setSummary(Array.isArray(d) ? d : d.data ?? []))
      .catch((e) => setError(e.message)).finally(() => setLoading(false))
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

  if (loading) return (
    <div className="sidebar-offset min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="sidebar-offset min-h-screen">
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2"><Bell size={22} /> Alert Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Threshold-based alert engine · institutional-grade notification</p>
        </div>

        {summary.length === 0 ? (
          <div className="glass rounded-2xl p-20 border border-white/5 text-center">
            <Bell size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground text-lg font-bold">No Active Alerts</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
            {summary.map((a: any) => (
              <Link key={a.composite_signal || a.stock_code} href={`/screener`} className="glass rounded-2xl p-5 border border-white/5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border" style={{ backgroundColor: (SEV.HIGH ?? '#6b7280') + '18', color: '#f97316' }}>{a.composite_signal || 'SIGNAL'}</span>
                  <span className="text-lg font-black counter">{a.count}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <span className="text-[10px] text-muted-foreground">{a.count} stocks</span>
                  <span className="text-[10px] font-bold">Avg Score: {a.avg_score}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
