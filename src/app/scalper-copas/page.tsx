'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Zap, Flame, ShieldAlert, Sparkles, Check, Copy,
  ArrowUpRight, AlertTriangle, RefreshCw, Layers,
  TrendingUp, BarChart3, Search, Trash2, ArrowRight
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { authFetch } from '@/lib/api'

const ADMIN_EMAILS = ['mulyanto.my88@gmail.com']

interface ScalperResult {
  stock_code: string
  trading_date: string
  close: number
  previous: number
  change_percent: number
  volume: number
  value: number
  vol_vs_ma20_ratio: number
  aov_ratio_ma20: number
  whale_signal: boolean
  big_player_anomaly: boolean
  net_foreign_value: number
  vwma_20d: number
  is_above_vwma20: boolean
  sector: string
  smart_money_score: number
  tier_v2: string
  flow_context: string
  scalper_score: number
  grade: 'SUPER_POTENTIAL' | 'STRONG_BUY' | 'WATCH' | 'AVOID'
}

const SAMPLE_STOCKBIT_TEXT = `WINR	20.00	20.00	-	571,408,000.00
GOTO	50.00	50.00	-	760,605,000.00
BSBK	50.00	50.00	-	619,170,500.00
HOKI	55.00	55.00	2.00	725,106,300.00
KRYA	62.00	62.00	8.00	28,384,359,600.00
ACRO	64.00	64.00	1.00	2,257,252,700.00
LAPD	69.00	69.00	1.00	1,700,322,500.00
SMGA	81.00	81.00	1.00	547,996,900.00
GRPH	91.00	91.00	6.00	34,602,511,900.00
LABA	96.00	96.00	33.00	46,602,008,300.00
MPIX	103.00	103.00	15.00	20,144,042,500.00
CAKK	151.00	151.00	6.00	552,900,600.00
GRPM	175.00	175.00	17.00	2,523,042,800.00
GZCO	178.00	178.00	6.00	11,386,182,100.00
DMAS	180.00	180.00	20.00	230,318,987,200.00
NIKL	198.00	198.00	4.00	807,759,800.00
AMMS	212.00	212.00	20.00	862,117,600.00
OILS	218.00	218.00	8.00	760,331,400.00
KRAS	224.00	224.00	4.00	889,080,000.00
PYFA	230.00	230.00	34.00	25,151,779,000.00
BBYB	248.00	248.00	6.00	14,638,305,600.00
BAJA	260.00	260.00	6.00	1,265,168,200.00
RMKO	272.00	272.00	26.00	13,126,274,000.00
SMRA	314.00	314.00	2.00	2,261,497,200.00
SSTM	364.00	364.00	96.00	1,309,725,400.00`

export default function ScalperCopasPage() {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScalperResult[]>([])
  const [notFound, setNotFound] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'GRADE_A_B' | 'VOL_SURGE' | 'AOV_WHALE'>('ALL')

  // Auto extract 4-letter unique tickers from raw text
  const extractedCodes = useMemo(() => {
    if (!rawText) return []
    // Match 4 capital letters word boundary
    const matches = rawText.toUpperCase().match(/\b[A-Z]{4}\b/g)
    if (!matches) return []
    // Ignore common words that happen to be 4 letters
    const blacklist = new Set(['OPEN', 'HIGH', 'DATE', 'TIME', 'DIFF', 'LAST', 'PREV', 'IHSG', 'HOUR', 'TICK'])
    return Array.from(new Set(matches.filter((c) => !blacklist.has(c))))
  }, [rawText])

  const handleAnalyze = useCallback(async (codesToAnalyze?: string[]) => {
    const codes = codesToAnalyze || extractedCodes
    if (codes.length === 0) {
      setError('Silakan paste data hasil screener Stockbit terlebih dahulu.')
      return
    }

    setLoading(true)
    setError(null)
    setNotFound([])

    try {
      const res = await authFetch('/api/scalper/qualify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Gagal memproses data.')
      }

      const data = await res.json()
      setResults(data.results || [])
      setNotFound(data.notFoundCodes || [])
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat menganalisis.')
    } finally {
      setLoading(false)
    }
  }, [extractedCodes])

  const handleSample = () => {
    setRawText(SAMPLE_STOCKBIT_TEXT)
    const matches = SAMPLE_STOCKBIT_TEXT.toUpperCase().match(/\b[A-Z]{4}\b/g) || []
    const clean = Array.from(new Set(matches))
    handleAnalyze(clean)
  }

  const handleClear = () => {
    setRawText('')
    setResults([])
    setError(null)
    setNotFound([])
  }

  const filteredResults = useMemo(() => {
    if (activeFilter === 'GRADE_A_B') {
      return results.filter((r) => r.grade === 'SUPER_POTENTIAL' || r.grade === 'STRONG_BUY')
    }
    if (activeFilter === 'VOL_SURGE') {
      return results.filter((r) => r.vol_vs_ma20_ratio >= 1.5)
    }
    if (activeFilter === 'AOV_WHALE') {
      return results.filter((r) => r.aov_ratio_ma20 >= 1.5 || r.whale_signal)
    }
    return results
  }, [results, activeFilter])

  const gradeCountA = useMemo(() => results.filter((r) => r.grade === 'SUPER_POTENTIAL').length, [results])
  const gradeCountB = useMemo(() => results.filter((r) => r.grade === 'STRONG_BUY').length, [results])
  const volSurgeCount = useMemo(() => results.filter((r) => r.vol_vs_ma20_ratio >= 1.5).length, [results])
  const aovWhaleCount = useMemo(() => results.filter((r) => r.aov_ratio_ma20 >= 1.5 || r.whale_signal).length, [results])

  const handleCopyTopCodes = () => {
    const topCodes = results
      .filter((r) => r.grade === 'SUPER_POTENTIAL' || r.grade === 'STRONG_BUY')
      .map((r) => r.stock_code)

    const textToCopy = (topCodes.length > 0 ? topCodes : results.slice(0, 5).map((r) => r.stock_code)).join(', ')
    if (!textToCopy) return

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <p className="text-xs text-muted-foreground">Memuat Scalper Lab...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass rounded-3xl p-8 border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-lg font-black text-foreground">Akses Terbatas (Private Admin Tool)</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Halaman <strong>Scalper Lab Copas Analyzer</strong> saat ini masih dalam fase pengujian privat dan hanya dapat diakses oleh akun master administrator.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-bold text-foreground border border-line-2 transition-all"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="glass rounded-3xl p-6 border border-border/40 space-y-3 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Zap size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-foreground">Fast Scalper: Quick-Paste Qualifier</h1>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  👑 Private Admin
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Copas hasil screener Stockbit <em>Open=Low</em> apa adanya. Sistem otomatis mengekstrak ticker &amp; menyortir saham juara berdasarkan data bandarmologi semalam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSample}
              className="px-3.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-bold text-foreground border border-line-2 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Coba Data Contoh Stockbit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Input Section: Smart Paste Box */}
      <div className="glass rounded-3xl p-6 border border-border/40 space-y-4">
        <div className="flex items-center justify-between border-b border-line-2 pb-3">
          <label htmlFor="rawText" className="text-xs font-bold text-foreground flex items-center gap-2">
            <Layers size={14} className="text-primary" />
            <span>Kotak Copas Mentah (Stockbit / Excel / Teks Apapun)</span>
          </label>
          <div className="flex items-center gap-2">
            {extractedCodes.length > 0 && (
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                {extractedCodes.length} Saham Terdeteksi
              </span>
            )}
            {rawText && (
              <button
                onClick={handleClear}
                className="text-[11px] font-bold text-muted-foreground hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="Bersihkan Teks"
              >
                <Trash2 size={12} />
                <span>Bersihkan</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            id="rawText"
            rows={4}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Klik di sini, lalu Paste (Ctrl + V) seluruh baris tabel dari Stockbit Screener... Contoh: KRYA 62.00 62.00 - 28,384,359,600.00 LABA 96.00 ..."
            className="w-full bg-surface-1 rounded-2xl p-4 border border-line-2 text-xs font-mono text-foreground focus:outline-none focus:border-amber-500/50 transition-colors custom-scrollbar placeholder:text-muted-foreground/40"
          />

          {/* Detected Tickers Pills Preview */}
          {extractedCodes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-surface-2/60 border border-line-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground mr-1 font-mono">
                Ticker:
              </span>
              {extractedCodes.map((code) => (
                <span
                  key={code}
                  className="px-2 py-0.5 rounded-md bg-surface-3 text-[11px] font-mono font-bold text-foreground border border-line-2"
                >
                  {code}
                </span>
              ))}
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || extractedCodes.length === 0}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                  <span>Menganalisis {extractedCodes.length} Saham...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Analisis &amp; Urutkan {extractedCodes.length > 0 ? `(${extractedCodes.length} Saham)` : ''}</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-muted-foreground/70 italic">
              💡 Tip: Analisis memproses Volume Surge, AOV Whale, &amp; Smart Money Score semalam.
            </span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="space-y-4">
          
          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-surface-2 border border-line-2 space-y-1">
              <span className="text-[11px] text-muted-foreground">Total Dianalisis</span>
              <div className="text-xl font-black text-foreground font-mono">{results.length} Saham</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="text-[11px] text-amber-400 font-bold">🚀 Super Potential (Grade A)</span>
              <div className="text-xl font-black text-amber-400 font-mono">{gradeCountA} Saham</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] text-emerald-400 font-bold">🔥 Kemarin Vol Surge</span>
              <div className="text-xl font-black text-emerald-400 font-mono">{volSurgeCount} Saham</div>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-1">
              <span className="text-[11px] text-sky-400 font-bold">🐋 Kemarin AOV Whale</span>
              <div className="text-xl font-black text-sky-400 font-mono">{aovWhaleCount} Saham</div>
            </div>
          </div>

          {/* Table Container & Filter Pills */}
          <div className="glass rounded-3xl p-6 border border-border/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 pb-3">
              
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  Semua ({results.length})
                </button>

                <button
                  onClick={() => setActiveFilter('GRADE_A_B')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'GRADE_A_B'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🚀 Grade A &amp; B ({gradeCountA + gradeCountB})
                </button>

                <button
                  onClick={() => setActiveFilter('VOL_SURGE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'VOL_SURGE'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🔥 Vol Surge ({volSurgeCount})
                </button>

                <button
                  onClick={() => setActiveFilter('AOV_WHALE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'AOV_WHALE'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🐋 AOV Whale ({aovWhaleCount})
                </button>
              </div>

              {/* Fast Copy Action Button */}
              <button
                onClick={handleCopyTopCodes}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                title="Salin kode saham terbaik ke clipboard untuk ditempel di Stockbit"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Copy Saham Grade A Saja'}</span>
              </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line-2 text-muted-foreground/70 font-mono text-[11px] uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Saham</th>
                    <th className="py-2.5 px-3 text-right">Tutup Kemarin</th>
                    <th className="py-2.5 px-3 text-center">Vol Surge Kemarin</th>
                    <th className="py-2.5 px-3 text-center">AOV Whale Kemarin</th>
                    <th className="py-2.5 px-3 text-center">Smart Money Score</th>
                    <th className="py-2.5 px-3">Status Konteks</th>
                    <th className="py-2.5 px-3 text-center">Skor Scalper</th>
                    <th className="py-2.5 px-3 text-center">Rekomendasi</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2/50 font-mono">
                  {filteredResults.map((item, idx) => {
                    const isSuper = item.grade === 'SUPER_POTENTIAL'
                    const isStrong = item.grade === 'STRONG_BUY'
                    const isWatch = item.grade === 'WATCH'

                    return (
                      <tr
                        key={item.stock_code}
                        className={`hover:bg-surface-2/60 transition-colors ${
                          isSuper ? 'bg-amber-500/[0.04]' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                              idx === 0
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950 font-black'
                                : idx === 2
                                ? 'bg-amber-700/60 text-amber-200 font-bold'
                                : 'bg-surface-2 text-muted-foreground'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        {/* Stock Code */}
                        <td className="py-3 px-3">
                          <Link
                            href={`/stock/${item.stock_code}`}
                            target="_blank"
                            className="font-black text-sm text-foreground hover:text-amber-400 transition-colors flex items-center gap-1 group"
                          >
                            <span>{item.stock_code}</span>
                            <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-amber-400" />
                          </Link>
                          <span className="text-[10px] text-muted-foreground/60 block truncate max-w-[120px]">
                            {item.sector}
                          </span>
                        </td>

                        {/* Close & Change */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-foreground">Rp {item.close?.toLocaleString('id-ID')}</div>
                          <div
                            className={`text-[10px] font-bold ${
                              item.change_percent > 0
                                ? 'text-emerald-400'
                                : item.change_percent < 0
                                ? 'text-rose-400'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {item.change_percent > 0 ? '+' : ''}
                            {Number(item.change_percent || 0).toFixed(1)}%
                          </div>
                        </td>

                        {/* Vol Surge */}
                        <td className="py-3 px-3 text-center">
                          {item.vol_vs_ma20_ratio >= 1.5 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 font-bold text-[11px] border border-emerald-500/30">
                              <Flame size={12} className="text-emerald-400" />
                              <span>{Number(item.vol_vs_ma20_ratio).toFixed(1)}x MA20</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-[11px]">
                              {Number(item.vol_vs_ma20_ratio || 0).toFixed(1)}x
                            </span>
                          )}
                        </td>

                        {/* AOV Whale */}
                        <td className="py-3 px-3 text-center">
                          {item.aov_ratio_ma20 >= 1.5 || item.whale_signal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-bold text-[11px] border border-sky-500/30">
                              <span>🐋 {Number(item.aov_ratio_ma20).toFixed(1)}x</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-[11px]">
                              {Number(item.aov_ratio_ma20 || 0).toFixed(1)}x
                            </span>
                          )}
                        </td>

                        {/* Smart Money Score */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-black text-xs px-2 py-0.5 rounded-md ${
                              item.smart_money_score >= 70
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : item.smart_money_score >= 45
                                ? 'bg-surface-3 text-foreground'
                                : 'text-muted-foreground/50'
                            }`}
                          >
                            {item.smart_money_score} / 100
                          </span>
                        </td>

                        {/* Context Flow */}
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-bold text-muted-foreground block truncate max-w-[140px]">
                            {item.flow_context?.replace(/_/g, ' ') || 'NORMAL'}
                          </span>
                          <span className="text-[9px] text-muted-foreground/50">
                            {item.is_above_vwma20 ? '🟢 Di Atas VWMA20' : '⚪ Di Bawah VWMA20'}
                          </span>
                        </td>

                        {/* Scalper Score */}
                        <td className="py-3 px-3 text-center">
                          <div className="text-sm font-black text-foreground">{item.scalper_score}</div>
                          <div className="w-16 bg-surface-3 h-1.5 rounded-full mx-auto overflow-hidden mt-0.5">
                            <div
                              className={`h-full rounded-full ${
                                item.scalper_score >= 80
                                  ? 'bg-amber-500'
                                  : item.scalper_score >= 65
                                  ? 'bg-emerald-500'
                                  : 'bg-muted-foreground/40'
                              }`}
                              style={{ width: `${item.scalper_score}%` }}
                            />
                          </div>
                        </td>

                        {/* Recommendation Grade */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                              isSuper
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/10'
                                : isStrong
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : isWatch
                                ? 'bg-surface-3 text-muted-foreground border-line-2'
                                : 'bg-rose-500/10 text-rose-400/80 border-rose-500/20'
                            }`}
                          >
                            {isSuper
                              ? '🚀 SUPER POTENTIAL'
                              : isStrong
                              ? '🟢 STRONG BUY'
                              : isWatch
                              ? '👀 WATCH'
                              : '⛔ WEAK'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          <Link
                            href={`/stock/${item.stock_code}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-surface-2 hover:bg-amber-500 hover:text-slate-950 text-muted-foreground transition-all inline-flex items-center justify-center"
                            title="Buka Analisis Lengkap Saham Ini"
                          >
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Not Found warning if any */}
            {notFound.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-2 border border-line-2 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                <span>⚠️ {notFound.length} kode tidak ditemukan di database: {notFound.join(', ')}</span>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  )
}
