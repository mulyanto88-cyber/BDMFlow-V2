import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, Clock, Shield, Loader2, AlertTriangle } from 'lucide-react'
import { formatRupiah, formatNumber, formatShares } from '@/lib/utils'
import CompanyLogo from '@/components/company-logo'
import { COMPANY_NAMES } from '@/lib/company-names'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'

interface ScorecardWidgetProps {
  stockCode?: string // Optional, if not provided it uses activeTicker from store
}

export function ScorecardWidget({ stockCode: propCode }: ScorecardWidgetProps) {
  const { activeTicker, period } = useTerminalStore()
  const code = propCode || activeTicker
  
  const { data, isLoading, error } = useStockOverview(code, period)

  const { stockData, smartMoneyIndex, scorecard, verdict: serverVerdict, dataQuality } = (data || {}) as any

  const smiScore = smartMoneyIndex?.smart_money_score || 0
  const convictionScore = useMemo(() => {
    let s = smiScore
    if (stockData?.whale_signal) s = Math.min(100, s + 10)
    if ((stockData?.aov_ratio_ma20 || 1) >= 1.5) s = Math.min(100, s + 10)
    return Math.round(s)
  }, [smiScore, stockData])

  // ── Verdict panel ──────────────────────────────────────────────────────────
  // Single authority: the server's buildVerdict (v2 scorecard + flow context).
  // This widget used to run its OWN scoring engine on 1-day foreign flow, so the
  // header could say AVOID while the overview below said Netral — one screen,
  // two verdicts. Evidence chips are signed and window-scoped so mixed evidence
  // reads as mixed, never as a contradiction.
  const verdict = useMemo(() => {
    const styleFor = (emoji: string) => {
      switch (emoji) {
        case '🟢': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' }
        case '🟡': return { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30' }
        case '🔻': return { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30' }
        default:   return { color: 'text-blue-300',    bg: 'bg-surface-3',   border: 'border-line-5' }
      }
    }
    const s = styleFor(serverVerdict?.emoji || '⚪')

    const fmtM = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(1)} M`
    const evidence: { sign: '+' | '−' | '·'; text: string }[] = []

    const f1d = (stockData?.net_foreign_value || 0) / 1e9
    if (Math.abs(f1d) >= 0.05) evidence.push({ sign: f1d >= 0 ? '+' : '−', text: `Asing 1D ${fmtM(f1d)}` })

    if (scorecard) {
      const f20 = Number(scorecard.foreign_20d_miliar ?? 0)
      evidence.push({ sign: f20 >= 0 ? '+' : '−', text: `Asing 20D ${fmtM(f20)}` })
      evidence.push({
        sign: ['STRONG_BUY', 'BUY', 'ACCUMULATE'].includes(scorecard.tier_v2) ? '+' : '·',
        text: `Skor v2 ${scorecard.v2_score ?? 0}/73 · ${scorecard.tier_v2 ?? '—'}`,
      })
    } else {
      evidence.push({ sign: '·', text: 'Di luar universe v2' })
    }

    return {
      label: serverVerdict?.headline || 'Belum ada verdict',
      detail: serverVerdict?.detail || '',
      ...s,
      evidence,
    }
  }, [serverVerdict, scorecard, stockData])

  if (!code) return <div className="glass rounded-2xl p-5 text-center text-muted-foreground border border-line-3">Pilih saham untuk melihat Scorecard</div>
  if (isLoading) return (
    <div className="glass rounded-2xl p-5 flex items-center justify-center min-h-[160px] border border-line-3">
      <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
    </div>
  )
  if (error || !stockData) return (
    <div className="glass rounded-2xl p-5 text-center border border-red-500/20">
      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
      <p className="text-red-400 text-sm">Gagal memuat scorecard</p>
    </div>
  )

  const companyName  = stockData?.company_name || COMPANY_NAMES[code] || ''
  const publicShares  = (stockData.tradeable_shares || 0) * ((stockData.free_float || 0) / 100)
  const floatCap      = publicShares * stockData.close
  const dailyTurnover = publicShares > 0 ? ((stockData.volume || 0) / publicShares) * 100 : 0
  const marketCap     = (stockData.tradeable_shares || 0) * stockData.close

  return (
    <div className="rounded-2xl p-4 sm:p-5 lg:p-6 border border-white/[0.08] bg-gradient-to-b from-surface-2/90 via-surface-1/95 to-background/95 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 -mt-20 w-80 h-80 bg-amber-500/[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 bg-primary/[0.04] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.15] to-transparent pointer-events-none" />

      {/* Data-quality banner */}
      {dataQuality?.returnsUnreliable && dataQuality.unadjustedAction && (
        <div className="relative z-10 mb-4 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-snug">
            <span className="font-black text-amber-400">
              {dataQuality.unadjustedAction.kind === 'REVERSE_SPLIT' ? 'Reverse split' : 'Stock split / bonus'} terdeteksi{' '}
              {String(dataQuality.unadjustedAction.date)}
            </span>{' '}
            ({formatNumber(dataQuality.unadjustedAction.priceBefore)} → {formatNumber(dataQuality.unadjustedAction.priceAfter)}, belum disesuaikan di data historis).
            Return 5D/20D dan indikator berbasis harga lintas tanggal itu <span className="font-bold">tidak andal</span>.
          </p>
        </div>
      )}

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {/* Price block */}
        <div className="lg:col-span-4 flex flex-col justify-between py-1">
          <div>
            <div className="flex items-center gap-3.5">
              <CompanyLogo code={code} sector={stockData.sector} size={52} eager className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">{code}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-3/80 text-muted-foreground border border-white/[0.08] text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                    {stockData.sector || 'Stock'}
                  </span>
                </div>
                {companyName && (
                  <p className="text-xs font-semibold text-muted-foreground/90 -mt-0.5 leading-snug truncate max-w-[240px] sm:max-w-none">{companyName}</p>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-foreground font-mono">{formatRupiah(stockData.close)}</span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm lg:text-base border shadow-sm ${
                stockData.change_percent >= 0 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                  : 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
              }`}>
                {stockData.change_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />}
                {Math.abs(stockData.change_percent).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-muted-foreground mt-3 font-medium flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-surface-2/70 px-3 py-1.5 rounded-xl border border-white/[0.06] w-fit backdrop-blur-md">
            <span>H: <span className="text-foreground font-mono font-bold">{formatNumber(stockData.high)}</span></span>
            <span>L: <span className="text-foreground font-mono font-bold">{formatNumber(stockData.low)}</span></span>
            <span>O: <span className="text-foreground font-mono font-bold">{formatNumber(stockData.open_price)}</span></span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <span className="flex items-center gap-1 text-muted-foreground/80"><Clock className="w-3 h-3 text-amber-400/80" /> {String(stockData.trading_date).split('T')[0]}</span>
          </div>
        </div>

        {/* Metrics grid — luxury elevated cards with accent borders */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-stretch">
          {[
            { l: 'Market Cap', v: formatRupiah(marketCap),           c: 'text-purple-300', glow: 'from-purple-500/20 to-transparent', border: 'hover:border-purple-500/40' },
            { l: 'Float Cap',  v: formatRupiah(floatCap),            c: 'text-indigo-300', glow: 'from-indigo-500/20 to-transparent', border: 'hover:border-indigo-500/40' },
            { l: 'Public Shr', v: formatShares(publicShares),        c: 'text-cyan-300',   glow: 'from-cyan-500/20 to-transparent', border: 'hover:border-cyan-500/40'   },
            { l: 'Volume',     v: formatShares(stockData.volume),    c: 'text-amber-300',  glow: 'from-amber-500/20 to-transparent', border: 'hover:border-amber-500/40' },
            { l: 'Value',      v: formatRupiah(stockData.value),     c: 'text-emerald-300', glow: 'from-emerald-500/20 to-transparent', border: 'hover:border-emerald-500/40', span: 'col-span-2 sm:col-span-1 lg:col-span-1' },
          ].map((m, i) => (
            <div 
              key={i} 
              className={`group relative p-3 rounded-2xl flex flex-col justify-between bg-gradient-to-b from-surface-2/90 to-surface-1/90 border border-white/[0.07] ${m.border} transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 overflow-hidden ${m.span || ''}`}
            >
              {/* Top ambient highlight */}
              <div className={`absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r ${m.glow} opacity-70 group-hover:opacity-100 transition-opacity`} />
              
              <p className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-[0.14em] mb-1.5">{m.l}</p>
              <p className={`text-xs sm:text-[13px] font-black font-mono ${m.c} tracking-tight leading-tight`}>{m.v}</p>
            </div>
          ))}
        </div>

        {/* Verdict panel — sleek glowing insight card */}
        <div className={`lg:col-span-3 rounded-2xl p-4 ${verdict.bg} border ${verdict.border} flex flex-col justify-center relative overflow-hidden shadow-sm`}>
          <div className="absolute -right-3 -bottom-3 opacity-[0.05] pointer-events-none"><Shield className="w-28 h-28" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className={`w-3.5 h-3.5 ${verdict.color}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/90">Verdict Analysis</span>
            </div>
            <p className={`text-sm sm:text-base font-black ${verdict.color} mb-2.5 tracking-tight leading-snug`}>{verdict.label}</p>
            <div className="space-y-1.5">
              {verdict.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2 bg-black/25 dark:bg-black/35 px-2.5 py-1.5 rounded-xl border border-white/[0.04]">
                  <span className={`text-[11px] font-black shrink-0 ${
                    e.sign === '+' ? 'text-emerald-400' : e.sign === '−' ? 'text-red-400' : 'text-muted-foreground'
                  }`}>{e.sign}</span>
                  <p className="text-[10px] text-foreground/90 font-medium leading-tight">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom KPI strip — luxury badge bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 pt-3.5 border-t border-white/[0.06]">
        {[
          { l: 'Conviction',   v: `${convictionScore}`,                           c: convictionScore >= 80 ? 'text-emerald-400' : convictionScore >= 60 ? 'text-amber-400' : 'text-red-400', bg: convictionScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : convictionScore >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20' },
          { l: 'Smart Money',  v: `${Math.round(smiScore)}`,                      c: smiScore >= 60 ? 'text-emerald-400' : smiScore >= 30 ? 'text-amber-400' : 'text-red-400', bg: smiScore >= 60 ? 'bg-emerald-500/10 border-emerald-500/20' : smiScore >= 30 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20' },
          { l: 'Foreign 1D',   v: formatRupiah(stockData.net_foreign_value),      c: stockData.net_foreign_value >= 0 ? 'text-emerald-400' : 'text-red-400', bg: stockData.net_foreign_value >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20' },
          { l: 'AOV Ratio',    v: `${(stockData.aov_ratio_ma20||1).toFixed(2)}x`, c: stockData.aov_ratio_ma20 >= 1.5 ? 'text-purple-400' : 'text-muted-foreground', bg: 'bg-surface-2/90 border-white/[0.05]' },
          { l: 'Turnover',     v: `${dailyTurnover.toFixed(2)}%`,                 c: dailyTurnover > 5 ? 'text-emerald-400' : dailyTurnover < 1 ? 'text-red-400' : 'text-amber-400', bg: 'bg-surface-2/90 border-white/[0.05]' },
          { l: 'Free Float',   v: `${stockData.free_float?.toFixed(1)||'--'}%`,   c: 'text-cyan-400', bg: 'bg-surface-2/90 border-white/[0.05]' },
        ].map((m, i) => (
          <div key={i} className={`py-2 px-2.5 rounded-xl border text-center transition-all ${m.bg}`}>
            <p className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-[0.12em] mb-0.5 truncate">{m.l}</p>
            <p className={`text-xs sm:text-[13px] font-black font-mono ${m.c} truncate`}>{m.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
