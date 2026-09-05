'use client'

export const dynamic = 'force-dynamic'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Zap, Flame, ShieldAlert, Sparkles, Check, Copy,
  ArrowUpRight, AlertTriangle, Layers,
  TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Trash2, ArrowRight,
  SlidersHorizontal, EyeOff, Shield, Crown, Building2
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
  val_kemarin_miliar: number
  avg_val_20d_miliar: number
  market_cap_triliun: number
  vol_vs_ma20_ratio: number
  aov_ratio_ma20: number
  max_aov_7d: number
  whale_signal: boolean
  whale_in_7d: boolean
  big_player_anomaly: boolean
  net_foreign_value: number
  net_foreign_7d: number
  vwma_20d: number
  is_above_vwma20: boolean
  sector: string
  smart_money_score: number
  tier_v2: string
  flow_context: string
  liner_tier: 'TIER_1_BLUE_CHIP' | 'SECOND_LINER' | 'THIRD_LINER_SMALL'
  scalper_score: number
  grade: 'SUPER_POTENTIAL' | 'STRONG_BUY' | 'WATCH' | 'AVOID'
  is_gocap: boolean
}

type SortKey =
  | 'scalper_score'
  | 'stock_code'
  | 'sector'
  | 'close'
  | 'change_percent'
  | 'val_kemarin_miliar'
  | 'avg_val_20d_miliar'
  | 'net_foreign_value'
  | 'net_foreign_7d'
  | 'vol_vs_ma20_ratio'
  | 'aov_ratio_ma20'
  | 'max_aov_7d'
  | 'smart_money_score'
  | 'liner_tier'
  | 'grade'

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
SSTM	364.00	364.00	96.00	1,309,725,400.00
RUIS	190.00	190.00	-	600,000,000.00
TOTO	234.00	234.00	-	250,000,000.00
CFIN	350.00	350.00	-	200,000,000.00
RALS	380.00	380.00	-	640,000,000.00
CLEO	1200.00	1200.00	-	5,000,000,000.00
EMTK	444.00	444.00	14.00	21,300,000,000.00
WINS	510.00	510.00	5.00	2,640,000,000.00
KEJU	1100.00	1100.00	-	800,000,000.00
SIMP	610.00	610.00	5.00	3,970,000,000.00
TRIM	630.00	630.00	-	360,000,000.00
CTRA	625.00	625.00	5.00	6,860,000,000.00
MAIN	850.00	850.00	-	1,200,000,000.00
NEST	220.00	220.00	-	900,000,000.00
VICI	520.00	520.00	-	1,500,000,000.00
PGJO	930.00	930.00	-	830,000,000.00
MDIY	1800.00	1800.00	-	4,000,000,000.00
MARK	960.00	960.00	30.00	20,490,000,000.00
BBTN	1220.00	1220.00	15.00	28,350,000,000.00
TUGU	1150.00	1150.00	-	2,100,000,000.00
PANS	1570.00	1570.00	10.00	340,000,000.00
BNGA	1680.00	1680.00	15.00	3,720,000,000.00
ABMM	3830.00	3830.00	110.00	11,800,000,000.00
BBNI	3710.00	3710.00	70.00	180,630,000,000.00
HEXA	6425.00	6425.00	175.00	18,300,000,000.00
BSSR	4530.00	4530.00	10.00	3,560,000,000.00
CMRY	4680.00	4680.00	10.00	43,010,000,000.00
MLBI	6900.00	6900.00	-	380,000,000.00
ADMF	8700.00	8700.00	25.00	340,000,000.00
SINI	9625.00	9625.00	-	207,020,000,000.00
UNIC	15000.00	15000.00	50.00	550,000,000.00`

export default function ScalperCopasPage() {
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  const [rawText, setRawText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScalperResult[]>([])
  const [notFound, setNotFound] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  
  // Filters & Options
  const [activeFilter, setActiveFilter] = useState<
    'ALL' | 'GRADE_A_B' | 'VOL_SURGE' | 'AOV_WHALE' | 'TIER_1' | 'SECOND_LINER' | 'THIRD_LINER'
  >('ALL')
  const [hideGocap, setHideGocap] = useState(true)

  // Interactive Sorting
  const [sortKey, setSortKey] = useState<SortKey>('scalper_score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Auto extract 4-letter unique tickers from raw text
  const extractedCodes = useMemo(() => {
    if (!rawText) return []
    const matches = rawText.toUpperCase().match(/\b[A-Z]{4}\b/g)
    if (!matches) return []
    const blacklist = new Set(['OPEN', 'HIGH', 'DATE', 'TIME', 'DIFF', 'LAST', 'PREV', 'IHSG', 'HOUR', 'TICK', 'CODE'])
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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  // Filter & Sort Pipeline
  const displayedResults = useMemo(() => {
    let filtered = results

    // 1. Gocap Filter
    if (hideGocap) {
      filtered = filtered.filter((r) => !r.is_gocap && r.close > 50)
    }

    // 2. Category Filter Pills
    if (activeFilter === 'GRADE_A_B') {
      filtered = filtered.filter((r) => r.grade === 'SUPER_POTENTIAL' || r.grade === 'STRONG_BUY')
    } else if (activeFilter === 'VOL_SURGE') {
      filtered = filtered.filter((r) => r.vol_vs_ma20_ratio >= 1.5)
    } else if (activeFilter === 'AOV_WHALE') {
      filtered = filtered.filter((r) => r.max_aov_7d >= 1.5 || r.whale_in_7d || r.aov_ratio_ma20 >= 1.5 || r.whale_signal)
    } else if (activeFilter === 'TIER_1') {
      filtered = filtered.filter((r) => r.liner_tier === 'TIER_1_BLUE_CHIP')
    } else if (activeFilter === 'SECOND_LINER') {
      filtered = filtered.filter((r) => r.liner_tier === 'SECOND_LINER')
    } else if (activeFilter === 'THIRD_LINER') {
      filtered = filtered.filter((r) => r.liner_tier === 'THIRD_LINER_SMALL')
    }

    // 3. Sorting
    return [...filtered].sort((a, b) => {
      let valA: any = a[sortKey]
      let valB: any = b[sortKey]

      if (sortKey === 'stock_code' || sortKey === 'sector' || sortKey === 'grade' || sortKey === 'liner_tier') {
        valA = String(valA || '')
        valB = String(valB || '')
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }

      valA = Number(valA) || 0
      valB = Number(valB) || 0
      return sortOrder === 'asc' ? valA - valB : valB - valA
    })
  }, [results, activeFilter, hideGocap, sortKey, sortOrder])

  // Count aggregations
  const nonGocapCount = useMemo(() => results.filter((r) => !r.is_gocap && r.close > 50).length, [results])
  const gradeCountA = useMemo(() => results.filter((r) => r.grade === 'SUPER_POTENTIAL').length, [results])
  const gradeCountB = useMemo(() => results.filter((r) => r.grade === 'STRONG_BUY').length, [results])
  const volSurgeCount = useMemo(() => results.filter((r) => r.vol_vs_ma20_ratio >= 1.5).length, [results])
  const aovWhaleCount = useMemo(() => results.filter((r) => r.max_aov_7d >= 1.5 || r.whale_in_7d || r.aov_ratio_ma20 >= 1.5 || r.whale_signal).length, [results])
  const tier1Count = useMemo(() => results.filter((r) => r.liner_tier === 'TIER_1_BLUE_CHIP').length, [results])
  const tier2Count = useMemo(() => results.filter((r) => r.liner_tier === 'SECOND_LINER').length, [results])
  const tier3Count = useMemo(() => results.filter((r) => r.liner_tier === 'THIRD_LINER_SMALL').length, [results])

  const handleCopyTopCodes = () => {
    const topCodes = displayedResults
      .filter((r) => r.grade === 'SUPER_POTENTIAL' || r.grade === 'STRONG_BUY')
      .map((r) => r.stock_code)

    const textToCopy = (topCodes.length > 0 ? topCodes : displayedResults.slice(0, 10).map((r) => r.stock_code)).join(', ')
    if (!textToCopy) return

    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderSortArrow = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={12} className="opacity-30 group-hover:opacity-70 transition-opacity" />
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className="text-amber-400 font-bold" />
    ) : (
      <ArrowDown size={12} className="text-amber-400 font-bold" />
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <p className="text-xs text-muted-foreground">Memuat Open=Low Lab...</p>
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
            Halaman <strong>Open=Low Lab Analyzer</strong> saat ini masih dalam fase pengujian privat dan hanya dapat diakses oleh akun master administrator.
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
    <div className="max-w-[1720px] w-full mx-auto px-3 sm:px-6 py-6 pb-32 space-y-6">
      
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
                <h1 className="text-lg sm:text-xl font-black text-foreground">Open=Low Lab: Quick-Paste Qualifier</h1>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  👑 Private Admin
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Copas hasil screener Stockbit <em>Open=Low</em> apa adanya. Sistem otomatis mengekstrak ticker, mengeliminasi saham gocap, dan menyortir saham juara berdasarkan likuiditas &amp; volume surge semalam.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSample}
              className="px-3.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs font-bold text-foreground border border-line-2 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-400" />
              <span>Coba Data Contoh (55 Saham)</span>
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
                className="text-[11px] font-bold text-muted-foreground hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
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
            <div className="flex flex-wrap items-center gap-1.5 p-3 rounded-2xl bg-surface-2/60 border border-line-2 max-h-24 overflow-y-auto custom-scrollbar">
              <span className="text-[10px] font-black uppercase text-muted-foreground mr-1 font-mono">
                Ticker ({extractedCodes.length}):
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

          {/* Action Trigger Button & Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
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

              {/* Gocap Checkbox Toggle */}
              <label className="flex items-center gap-2 text-xs font-semibold text-foreground/80 cursor-pointer bg-surface-2/80 px-3 py-2 rounded-xl border border-line-2 hover:bg-surface-3 transition-colors">
                <input
                  type="checkbox"
                  checked={hideGocap}
                  onChange={(e) => setHideGocap(e.target.checked)}
                  className="rounded border-border/80 text-amber-500 focus:ring-amber-500/40 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <EyeOff size={13} className="text-muted-foreground" />
                  <span>Sembunyikan Saham Gocap (Rp 50)</span>
                </span>
              </label>
            </div>

            <span className="text-[11px] text-muted-foreground/70 italic">
              💡 Tip: Klik judul kolom di tabel untuk mengurutkan (Sort) data secara instan.
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-2xl bg-surface-2 border border-line-2 space-y-1">
              <span className="text-[11px] text-muted-foreground">Total Ditampilkan</span>
              <div className="text-lg font-black text-foreground font-mono">
                {displayedResults.length} / {results.length} Saham
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
              <span className="text-[11px] text-amber-400 font-bold">🚀 Super Potential (A)</span>
              <div className="text-lg font-black text-amber-400 font-mono">{gradeCountA} Saham</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
              <span className="text-[11px] text-emerald-400 font-bold">🔥 Vol Surge Kemarin</span>
              <div className="text-lg font-black text-emerald-400 font-mono">{volSurgeCount} Saham</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-1">
              <span className="text-[11px] text-sky-400 font-bold">🐋 AOV Whale Kemarin</span>
              <div className="text-lg font-black text-sky-400 font-mono">{aovWhaleCount} Saham</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-1">
              <span className="text-[11px] text-purple-400 font-bold">🏛️ Blue Chip (Tier 1)</span>
              <div className="text-lg font-black text-purple-400 font-mono">{tier1Count} Saham</div>
            </div>
          </div>

          {/* Table Container & Filter Pills */}
          <div className="glass rounded-3xl p-6 border border-border/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-2 pb-3">
              
              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  Semua ({hideGocap ? nonGocapCount : results.length})
                </button>

                <button
                  onClick={() => setActiveFilter('GRADE_A_B')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'GRADE_A_B'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🚀 Grade A &amp; B ({gradeCountA + gradeCountB})
                </button>

                <button
                  onClick={() => setActiveFilter('VOL_SURGE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'VOL_SURGE'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🔥 Vol Surge ({volSurgeCount})
                </button>

                <button
                  onClick={() => setActiveFilter('AOV_WHALE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'AOV_WHALE'
                      ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🐋 AOV Whale ({aovWhaleCount})
                </button>

                <button
                  onClick={() => setActiveFilter('TIER_1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'TIER_1'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🏛️ Tier 1 ({tier1Count})
                </button>

                <button
                  onClick={() => setActiveFilter('SECOND_LINER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'SECOND_LINER'
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  🚀 2nd Liner ({tier2Count})
                </button>

                <button
                  onClick={() => setActiveFilter('THIRD_LINER')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === 'THIRD_LINER'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'bg-surface-2 hover:bg-surface-3 text-muted-foreground'
                  }`}
                >
                  ⚡ 3rd Liner ({tier3Count})
                </button>
              </div>

              {/* Fast Copy Action Button */}
              <button
                onClick={handleCopyTopCodes}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-bold border border-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                title="Salin kode saham terbaik ke clipboard untuk ditempel di Stockbit"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Copy Saham Terpilih Saja'}</span>
              </button>
            </div>

            {/* Results Table with Clickable Sort Headers */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line-2 text-muted-foreground/70 font-mono text-[11px] uppercase select-none">
                    
                    <th className="py-2.5 px-3">#</th>

                    {/* Sortable: Saham */}
                    <th
                      onClick={() => handleSort('stock_code')}
                      className="py-2.5 px-3 cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Saham</span>
                        {renderSortArrow('stock_code')}
                      </div>
                    </th>

                    {/* Sortable: Liner Tier */}
                    <th
                      onClick={() => handleSort('liner_tier')}
                      className="py-2.5 px-3 cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Klasifikasi Tier</span>
                        {renderSortArrow('liner_tier')}
                      </div>
                    </th>

                    {/* Sortable: Tutup Kemarin */}
                    <th
                      onClick={() => handleSort('close')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Tutup Kemarin</span>
                        {renderSortArrow('close')}
                      </div>
                    </th>

                    {/* Sortable: Likuiditas Kemarin (Turnover) */}
                    <th
                      onClick={() => handleSort('val_kemarin_miliar')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Turnover Kemarin</span>
                        {renderSortArrow('val_kemarin_miliar')}
                      </div>
                    </th>

                    {/* Sortable: Likuiditas Rata-rata 20 Hari (MA20 Value) */}
                    <th
                      onClick={() => handleSort('avg_val_20d_miliar')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Avg 20D (MA20 Val)</span>
                        {renderSortArrow('avg_val_20d_miliar')}
                      </div>
                    </th>

                    {/* Sortable: Net Foreign Flow 7D */}
                    <th
                      onClick={() => handleSort('net_foreign_7d')}
                      className="py-2.5 px-3 text-right cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Net Foreign 7D</span>
                        {renderSortArrow('net_foreign_7d')}
                      </div>
                    </th>

                    {/* Sortable: Vol Surge Kemarin */}
                    <th
                      onClick={() => handleSort('vol_vs_ma20_ratio')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Vol Surge Semalam</span>
                        {renderSortArrow('vol_vs_ma20_ratio')}
                      </div>
                    </th>

                    {/* Sortable: AOV Whale (Max 7D) */}
                    <th
                      onClick={() => handleSort('max_aov_7d')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>AOV Whale (Max 7D)</span>
                        {renderSortArrow('max_aov_7d')}
                      </div>
                    </th>

                    {/* Sortable: Smart Money Score */}
                    <th
                      onClick={() => handleSort('smart_money_score')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Smart Money</span>
                        {renderSortArrow('smart_money_score')}
                      </div>
                    </th>

                    {/* Sortable: Skor Scalper */}
                    <th
                      onClick={() => handleSort('scalper_score')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Skor Scalper</span>
                        {renderSortArrow('scalper_score')}
                      </div>
                    </th>

                    {/* Sortable: Rekomendasi Grade */}
                    <th
                      onClick={() => handleSort('grade')}
                      className="py-2.5 px-3 text-center cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Rekomendasi</span>
                        {renderSortArrow('grade')}
                      </div>
                    </th>

                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-2/50 font-mono">
                  {displayedResults.map((item, idx) => {
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

                        {/* Liner / Market Cap Tier */}
                        <td className="py-3 px-3">
                          {item.liner_tier === 'TIER_1_BLUE_CHIP' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 font-bold text-[10px] border border-purple-500/30">
                              <Building2 size={11} />
                              <span>Tier 1 (Blue Chip)</span>
                            </span>
                          ) : item.liner_tier === 'SECOND_LINER' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 font-bold text-[10px] border border-indigo-500/30">
                              <TrendingUp size={11} />
                              <span>2nd Liner (Mid)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/90 font-bold text-[10px] border border-amber-500/20">
                              <Zap size={11} />
                              <span>3rd Liner (Fast)</span>
                            </span>
                          )}
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

                        {/* Likuiditas Kemarin (Turnover) */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-foreground">
                            Rp {Number(item.val_kemarin_miliar).toFixed(2)} M
                          </div>
                        </td>

                        {/* Likuiditas Rata-rata 20 Hari */}
                        <td className="py-3 px-3 text-right">
                          <div className="text-muted-foreground font-medium">
                            Rp {Number(item.avg_val_20d_miliar).toFixed(2)} M
                          </div>
                        </td>

                        {/* Net Foreign Flow 7D */}
                        <td className="py-3 px-3 text-right font-bold text-[11px]">
                          {item.net_foreign_7d > 0 ? (
                            <span className="text-emerald-400">
                              +Rp {(item.net_foreign_7d / 1e9).toFixed(2)} M
                            </span>
                          ) : item.net_foreign_7d < 0 ? (
                            <span className="text-rose-400">
                              -Rp {Math.abs(item.net_foreign_7d / 1e9).toFixed(2)} M
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">Rp 0 M</span>
                          )}
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

                        {/* AOV Whale Max 7D */}
                        <td className="py-3 px-3 text-center">
                          {item.max_aov_7d >= 1.5 || item.whale_in_7d || item.aov_ratio_ma20 >= 1.5 || item.whale_signal ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-bold text-[11px] border border-sky-500/30" title={`AOV Kemarin: ${Number(item.aov_ratio_ma20 || 0).toFixed(1)}x, Max 7D: ${Number(item.max_aov_7d || 0).toFixed(1)}x`}>
                              <span>🐋 {Number(item.max_aov_7d || item.aov_ratio_ma20).toFixed(1)}x</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50 text-[11px]" title={`AOV Kemarin: ${Number(item.aov_ratio_ma20 || 0).toFixed(1)}x`}>
                              {Number(item.max_aov_7d || item.aov_ratio_ma20 || 0).toFixed(1)}x
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
