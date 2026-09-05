import React, { useState, useEffect, useCallback } from 'react'
import {
  Activity, TrendingUp, AlertTriangle, BarChart3,
  Zap, Shield, Bot, Sparkles, X, Lock, CheckCircle2, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/auth-context'
import AICopilotModal from '@/components/ai-copilot'

const ADMIN_EMAILS = ['mulyanto.my88@gmail.com']

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
  const { user } = useAuth()
  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))

  const [signals, setSignals] = useState<ActionSignal[]>([])
  const [expanded, setExpanded] = useState(false)
  const [hasNew, setHasNew] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [previewModal, setPreviewModal] = useState<'ai' | 'openlow' | null>(null)

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

  // Close preview modal on Escape
  useEffect(() => {
    if (!previewModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewModal(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [previewModal])

  if (!mounted) return null

  return (
    <>
      <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] md:bottom-5 right-3 sm:right-5 z-40 md:z-50 flex flex-col items-end gap-2 pointer-events-auto">
        
        {/* Floating AI & Open=Low Lab Dock (Visible to ALL users) */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-black/90 backdrop-blur-xl p-1 rounded-full border border-amber-500/35 shadow-2xl shadow-amber-500/10 animate-fade-in">
          
          {/* AI Copilot Button */}
          <button
            onClick={() => {
              if (isAdmin) {
                setAiOpen(true)
              } else {
                setPreviewModal('ai')
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black text-amber-300 bg-gradient-to-r from-amber-500/30 to-amber-600/30 hover:from-amber-500/40 hover:to-amber-600/40 border border-amber-500/50 transition-all active:scale-95 shadow-sm group"
            title={isAdmin ? "Buka BDMFlow AI Intelligence (VIP Copilot)" : "BDMFlow AI Copilot (Private Beta)"}
          >
            <Bot size={13} className="text-amber-400 animate-pulse group-hover:scale-110 transition-transform" />
            <span>AI Copilot</span>
            <span className="text-[8px] font-black px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 tracking-wider">
              {isAdmin ? 'VIP' : 'BETA'}
            </span>
          </button>

          {/* Open=Low Lab Button */}
          {isAdmin ? (
            <Link
              href="/scalper-copas"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-amber-400/90 hover:text-amber-400 hover:bg-amber-500/15 transition-all active:scale-95"
              title="Buka Open=Low Lab (Master Tool)"
            >
              <Zap size={12} className="text-amber-400" />
              <span>Open=Low Lab</span>
            </Link>
          ) : (
            <button
              onClick={() => setPreviewModal('openlow')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/15 transition-all active:scale-95"
              title="Open=Low Lab (Private Beta • Coming Soon)"
            >
              <Zap size={12} className="text-amber-400" />
              <span>Open=Low Lab</span>
              <span className="text-[7.5px] font-black px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                SOON
              </span>
            </button>
          )}

          {/* Master Admin Live Tracker */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold text-foreground/80 hover:text-foreground hover:bg-white/10 transition-all active:scale-95"
              title="Buka Admin Live Activity Tracker"
            >
              <Shield size={12} className="text-amber-400" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Signal list */}
        {expanded && signals.length > 0 && (
          <div className="glass rounded-2xl border border-line-4 shadow-2xl w-[calc(100vw-24px)] max-w-xs sm:w-80 max-h-[55vh] overflow-y-auto p-3 space-y-2 animate-scale-in">
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Action Center</h4>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-[10px] font-bold text-muted-foreground hover:text-foreground p-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>
            {signals.map((s) => (
              <Link
                key={s.id}
                href={`/stock/${s.stock_code}`}
                onClick={() => setExpanded(false)}
                className={`block rounded-xl border p-2.5 transition-all hover:shadow-lg active:scale-[0.98] ${SEVERITY_STYLE[s.severity]}`}
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

        {/* Toggle Alerts button */}
        {signals.length > 0 && (
          <button
            onClick={() => { setExpanded(!expanded); setHasNew(false) }}
            className={`relative flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full border border-line-5 bg-black/85 backdrop-blur-xl shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              hasNew ? 'ring-2 ring-emerald-400/50 animate-glow-pulse' : ''
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black text-foreground uppercase tracking-wider sm:tracking-widest">
              {signals.length} Alert{signals.length !== 1 ? 's' : ''}
            </span>
          </button>
        )}
      </div>

      {/* VIP AI Copilot Modal (Full functional access for Master Admin) */}
      <AICopilotModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Exclusive Preview / Coming Soon Modal for Non-Admin Members */}
      {previewModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-gradient-to-b from-[#14161f] to-[#0d0e14] border border-amber-500/35 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-amber-500/10 overflow-hidden animate-scale-in space-y-5"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Header with Icon & Close */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border flex items-center justify-center shadow-lg ${
                  previewModal === 'ai'
                    ? 'bg-gradient-to-br from-purple-500/20 via-amber-500/20 to-transparent border-amber-500/40 text-amber-300'
                    : 'bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-transparent border-amber-500/40 text-amber-400'
                }`}>
                  {previewModal === 'ai' ? (
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  ) : (
                    <Zap className="w-6 h-6 animate-pulse" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Private Beta
                    </span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      v2.8-preview
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground tracking-tight mt-0.5">
                    {previewModal === 'ai' ? 'BDMFlow AI Copilot' : 'Open=Low Momentum Lab'}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setPreviewModal(null)}
                className="text-muted-foreground/60 hover:text-foreground p-1.5 rounded-xl hover:bg-white/5 transition-colors"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtitle tag */}
            <div className="text-[11px] font-semibold text-amber-400/90 flex items-center gap-1.5 relative z-10">
              <Bot size={13} className="text-amber-400" />
              <span>
                {previewModal === 'ai'
                  ? 'Powered by Gemini AI • IDX Specialist Engine'
                  : '09:00 WIB High-Frequency Opening Breakout Scanner'}
              </span>
            </div>

            {/* Description (Cool English) */}
            <p className="text-xs text-muted-foreground leading-relaxed relative z-10">
              {previewModal === 'ai'
                ? 'Our next-generation AI Copilot synthesizes multi-timeframe order flow, broker accumulation, and real-time smart money dynamics using Google Gemini neural architecture. This engine is currently in closed private beta undergoing institutional latency calibration.'
                : 'The Open=Low Lab algorithm monitors 09:00 WIB opening price anomalies, whale AOV accumulation ratios, and institutional liquidity surges before retail participants react. Algorithmic calibration is currently restricted to master research accounts.'}
            </p>

            {/* Feature Highlights Grid */}
            <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                Engine Capabilities
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {previewModal === 'ai' ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-foreground/90">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Sub-second Bandarmologi & Foreign Flow Synthesis</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-foreground/90">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Real-time Fake-Bid & Distribution Detection</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-foreground/90">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Automated Risk-Reward & Scalping Playbooks</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-foreground/90">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Instant 09:00 WIB Open=Low Breakout Scanner</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-foreground/90">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>AOV Whale Accumulation Ratio vs MA20 Volume</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-foreground/90">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span>Dynamic Scalper Scoring & Liner Qualification</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status Footer Banner */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 relative z-10">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-amber-400 shrink-0" />
                <div className="text-[10px] text-amber-300/90 leading-tight">
                  <span className="font-black uppercase block">Under Active Development</span>
                  <span className="text-[9px] text-muted-foreground">Full public release rolling out soon</span>
                </div>
              </div>
              <span className="text-[8px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                STAGE 2 ALPHA
              </span>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => setPreviewModal(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 relative z-10"
            >
              <span>Got It • Stay Tuned</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

