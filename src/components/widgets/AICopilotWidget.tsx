'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Bot, Sparkles, RefreshCw, Zap, TrendingUp,
  Shield, CheckCircle2, Copy, Check, AlertTriangle, Send,
  Lock, ArrowUpRight
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'

const ADMIN_EMAILS = ['mulyanto.my88@gmail.com']

interface AICopilotWidgetProps {
  stockCode: string
}

export function AICopilotWidget({ stockCode }: AICopilotWidgetProps) {
  const { user } = useAuth()
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  const [analysis, setAnalysis] = useState<string | null>(null)
  const [snapshot, setSnapshot] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedStyle, setSelectedStyle] = useState<'COMPREHENSIVE' | 'SCALPER' | 'BANDAR' | 'VALUATION'>('COMPREHENSIVE')
  const [customQuestion, setCustomQuestion] = useState('')

  const fetchAnalysis = useCallback(async (style: 'COMPREHENSIVE' | 'SCALPER' | 'BANDAR' | 'VALUATION') => {
    if (!isAdmin) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_code: stockCode,
          prompt_style: style,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memanggil AI Engine.')
      }

      setAnalysis(data.analysis)
      setSnapshot(data.snapshot)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [stockCode, isAdmin])

  useEffect(() => {
    if (isAdmin && stockCode) {
      fetchAnalysis('COMPREHENSIVE')
    }
  }, [fetchAnalysis, isAdmin, stockCode])

  const handleCopy = () => {
    if (!analysis) return
    navigator.clipboard.writeText(analysis)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAskCustom = async () => {
    if (!customQuestion.trim() || isLoading) return
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: customQuestion }],
          current_ticker: stockCode,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal merespons pertanyaan.')

      setAnalysis((prev) => `${prev || ''}\n\n---\n### 💬 Pertanyaan Tambahan: "${customQuestion}"\n\n${data.message}`)
      setCustomQuestion('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Guard: VIP Only ──────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="glass rounded-2xl p-8 sm:p-12 text-center border border-amber-500/20 max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <Lock size={24} />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">BDMFlow AI Intelligence (VIP Early Access)</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Fitur analisa kecerdasan buatan berbasis Bandarmologi & Fundamental ini saat ini sedang dalam masa uji coba eksklusif akun Master.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ══ HEADER BANNER ════════════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-5 sm:p-6 border border-amber-500/30 relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-surface-1 to-surface-2 shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Bot size={120} className="text-amber-400" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-md">
              <Bot size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  AI Deep-Dive Intelligence: <span className="text-amber-400 font-mono">{stockCode}</span>
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/40">
                  GEMINI 1.5 FLASH
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sintesa multi-dimensi Bandarmologi, Foreign Flow semalam, Broksum, dan Fundamental.
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => { setSelectedStyle('COMPREHENSIVE'); fetchAnalysis('COMPREHENSIVE'); }}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                selectedStyle === 'COMPREHENSIVE'
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                  : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-line-3'
              }`}
            >
              <Shield size={13} />
              <span>360° Analisis</span>
            </button>

            <button
              onClick={() => { setSelectedStyle('SCALPER'); fetchAnalysis('SCALPER'); }}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                selectedStyle === 'SCALPER'
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                  : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-line-3'
              }`}
            >
              <Zap size={13} />
              <span>Scalper Plan</span>
            </button>

            <button
              onClick={() => { setSelectedStyle('BANDAR'); fetchAnalysis('BANDAR'); }}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 ${
                selectedStyle === 'BANDAR'
                  ? 'bg-amber-500 text-black font-black shadow-md shadow-amber-500/20'
                  : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-line-3'
              }`}
            >
              <TrendingUp size={13} />
              <span>Bandarmologi</span>
            </button>

            <button
              onClick={() => fetchAnalysis(selectedStyle)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line-3 text-muted-foreground hover:text-foreground transition-all active:scale-95"
              title="Perbarui Analisa"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin text-amber-400' : ''} />
            </button>
          </div>
        </div>

        {/* Live Snapshot Data Chips */}
        {snapshot && (
          <div className="mt-4 pt-3 border-t border-line-3/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-black/30 rounded-xl p-2 border border-line-2">
              <span className="text-[10px] text-muted-foreground">Harga Terakhir:</span>
              <div className="font-mono font-bold text-foreground">
                Rp {snapshot.close_price} ({snapshot.change_percent > 0 ? '+' : ''}{snapshot.change_percent}%)
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-2 border border-line-2">
              <span className="text-[10px] text-muted-foreground">Volume Spike:</span>
              <div className="font-mono font-bold text-amber-400">
                {snapshot.volume_surge_ratio} vs MA20
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-2 border border-line-2">
              <span className="text-[10px] text-muted-foreground">Net Foreign Semalam:</span>
              <div className={`font-mono font-bold ${Number(snapshot.net_foreign_kemarin_miliar) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {Number(snapshot.net_foreign_kemarin_miliar) >= 0 ? '+' : ''}Rp {snapshot.net_foreign_kemarin_miliar} M
              </div>
            </div>
            <div className="bg-black/30 rounded-xl p-2 border border-line-2">
              <span className="text-[10px] text-muted-foreground">Valuasi (PER / PBV):</span>
              <div className="font-mono font-bold text-foreground">
                {snapshot.fundamental?.pe_ratio_ttm}x / {snapshot.fundamental?.pbv_ratio}x
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══ ERROR ALERT ════════════════════════════════════════════════════ */}
      {error && (
        <div className="glass rounded-2xl p-4 border border-red-500/30 bg-red-500/10 flex items-center justify-between text-xs text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchAnalysis(selectedStyle)}
            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg font-bold transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* ══ REPORT CONTENT ═════════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-6 border border-line-3 relative bg-surface-1/90 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-line-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
              Hasil Bedah Kecerdasan Buatan
            </h3>
          </div>
          {analysis && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 border border-line-3 text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? 'Tersalin!' : 'Salin Laporan'}</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-foreground">
              AI sedang menganalisis data Bandarmologi & Fundamental {stockCode}…
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Menghitung probabilitas pergerakan bandar, foreign inflow, dan menyusun trading plan…
            </p>
          </div>
        ) : analysis ? (
          <div className="prose prose-invert prose-sm max-w-none text-foreground/90 font-sans leading-relaxed whitespace-pre-wrap select-text">
            {analysis}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Klik tombol analisa di atas untuk memulai.
          </div>
        )}

        {/* Interactive Follow-up Question */}
        <div className="mt-6 pt-4 border-t border-line-3 flex gap-2">
          <input
            type="text"
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAskCustom()
            }}
            placeholder={`Ada pertanyaan lanjutan tentang ${stockCode}? (misal: "Berapa target exit jika gagal break resisten?")`}
            disabled={isLoading}
            className="flex-1 bg-surface-2 border border-line-3 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={handleAskCustom}
            disabled={isLoading || !customQuestion.trim()}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
          >
            <span>Tanya AI</span>
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
