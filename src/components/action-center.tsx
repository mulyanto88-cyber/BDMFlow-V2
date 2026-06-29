'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Activity, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface ActionSignal {
  id: string
  stock_code: string
  type: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  title: string
  detail: string
  timestamp: string
}

const SEVERITY_STYLE: Record<string, string> = {
  HIGH: 'border-red-500/20 bg-red-500/5',
  MEDIUM: 'border-amber-500/20 bg-amber-500/5',
  LOW: 'border-blue-500/20 bg-blue-500/5',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  WHALE: <Activity className="w-3 h-3 text-blue-400" />,
  INSIDER: <AlertTriangle className="w-3 h-3 text-red-400" />,
  STEALTH: <BarChart3 className="w-3 h-3 text-purple-400" />,
  DIVERGENCE: <TrendingUp className="w-3 h-3 text-amber-400" />,
  FLOW_SURGE: <Activity className="w-3 h-3 text-emerald-400" />,
}

async function fetchActionSignals(): Promise<ActionSignal[]> {
  // Reuse the SAME cached, prioritized source as the /alerts page — no separate raw-SQL query,
  // so the two alert surfaces stay consistent and we drop the uncached /api/motherduck POST.
  try {
    const res = await fetch('/api/alerts/summary')
    const data = await res.json()
    if (!Array.isArray(data)) return []
    const SEV: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'> = { CRITICAL: 'HIGH', HIGH: 'HIGH', MEDIUM: 'MEDIUM', LOW: 'LOW' }
    return data.slice(0, 10).map((a: any) => {
      const types = String(a.active_alerts ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
      return {
        id: a.stock_code,
        stock_code: a.stock_code,
        type: types[0] || 'WHALE',
        severity: SEV[a.highest_severity] ?? 'LOW',
        title: a.top_notification || `${a.alert_count ?? types.length} sinyal aktif`,
        detail: [types.join(' · '), a.sector].filter(Boolean).join(' · '),
        timestamp: '',
      }
    })
  } catch {
    return []
  }
}

export default function ActionCenter() {
  const [signals, setSignals] = useState<ActionSignal[]>([])
  const [expanded, setExpanded] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const [mounted, setMounted] = useState(false)

  const load = useCallback(async () => {
    const data = await fetchActionSignals()
    if (data.length > 0) {
      setSignals(data)
      setHasNew(true)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    load()
    const interval = setInterval(load, 3 * 60 * 1000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    if (hasNew) {
      const t = setTimeout(() => setHasNew(false), 3000)
      return () => clearTimeout(t)
    }
  }, [hasNew])

  if (!mounted || signals.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Signal list */}
      {expanded && (
        <div className="glass rounded-2xl border border-white/[0.08] shadow-2xl w-80 max-h-[60vh] overflow-y-auto p-3 space-y-2 animate-scale-in">
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Action Center</h4>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
            >
              [ x ]
            </button>
          </div>
          {signals.map((s) => (
            <Link
              key={s.id}
              href={`/stock/${s.stock_code}`}
              onClick={() => setExpanded(false)}
              className={`block rounded-xl border p-2.5 transition-all hover:shadow-lg ${SEVERITY_STYLE[s.severity]}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {TYPE_ICON[s.type]}
                <span className="font-mono text-[10px] font-black text-foreground">{s.stock_code}</span>
                <span className="text-[8px] text-muted-foreground/50 ml-auto">{s.timestamp?.slice(11, 16)}</span>
              </div>
              <p className="text-[10px] font-semibold text-foreground/80 leading-tight">{s.title}</p>
              <p className="text-[8px] text-muted-foreground/60 mt-0.5">{s.detail}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => { setExpanded(!expanded); setHasNew(false) }}
        className={`relative flex items-center gap-2 px-3.5 py-2.5 rounded-full border border-white/[0.1] bg-black/80 backdrop-blur-xl shadow-2xl transition-all hover:scale-105 active:scale-95 ${
          hasNew ? 'ring-2 ring-emerald-400/50 animate-glow-pulse' : ''
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] font-black text-text-foreground uppercase tracking-widest">
          {signals.length} Alert{signals.length !== 1 ? 's' : ''}
        </span>
      </button>
    </div>
  )
}
