import React, { useMemo } from 'react'
import { TrendingUp, TrendingDown, Clock, Shield, Loader2, AlertTriangle } from 'lucide-react'
import { formatRupiah, formatNumber, formatShares } from '@/lib/utils'
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

  const publicShares  = (stockData.tradeable_shares || 0) * ((stockData.free_float || 0) / 100)
  const floatCap      = publicShares * stockData.close
  const dailyTurnover = publicShares > 0 ? ((stockData.volume || 0) / publicShares) * 100 : 0
  const marketCap     = (stockData.tradeable_shares || 0) * stockData.close

  return (
    <div className="glass rounded-2xl p-4 lg:p-5 border border-line-3 relative overflow-hidden">
      {/* Data-quality banner: an unadjusted split/bonus inside the window means every
          return spanning that date (including the v2 scorecard's) is fiction. */}
      {dataQuality?.returnsUnreliable && dataQuality.unadjustedAction && (
        <div className="relative z-10 mb-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25">
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
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Price block */}
        <div className="lg:col-span-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl lg:text-4xl font-black font-mono tracking-tight gradient-gold">{code}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-4 text-muted-foreground border border-line-4 text-[10px] font-bold uppercase tracking-wider">{stockData.sector || 'Stock'}</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl lg:text-5xl font-black tracking-tighter">{formatRupiah(stockData.close)}</span>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-sm lg:text-base ${stockData.change_percent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {stockData.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stockData.change_percent).toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-medium flex gap-2 lg:gap-3 bg-surface-2 px-2.5 py-1.5 rounded-lg border border-line-3 w-fit">
            <span>H: <span className="text-foreground/80">{formatNumber(stockData.high)}</span></span>
            <span>L: <span className="text-foreground/80">{formatNumber(stockData.low)}</span></span>
            <span>O: <span className="text-foreground/80">{formatNumber(stockData.open_price)}</span></span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {String(stockData.trading_date).split('T')[0]}</span>
          </div>
        </div>

        {/* Metrics grid — fluid columns */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-2 items-center">
          {[
            { l: 'Market Cap', v: formatRupiah(marketCap),           c: 'text-purple-400' },
            { l: 'Float Cap',  v: formatRupiah(floatCap),            c: 'text-purple-400' },
            { l: 'Public Shr', v: formatShares(publicShares),        c: 'text-cyan-400'   },
            { l: 'Volume',     v: formatShares(stockData.volume),    c: 'text-orange-400' },
            { l: 'Value',      v: formatRupiah(stockData.value),     c: 'text-blue-400'   },
          ].map((m, i) => (
            <div key={i} className="metric-card p-3 rounded-xl flex flex-col justify-center bg-surface-2 border border-line-3 hover:border-line-6 transition-all">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1 font-medium">{m.l}</p>
              <p className={`text-sm font-black font-mono ${m.c} tracking-tight`}>{m.v}</p>
            </div>
          ))}
        </div>

        {/* Verdict panel — fluid column */}
        <div className={`lg:col-span-3 rounded-2xl p-4 ${verdict.bg} border ${verdict.border} flex flex-col justify-center relative overflow-hidden`}>
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]"><Shield className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className={`w-3.5 h-3.5 ${verdict.color}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Verdict</span>
            </div>
            <p className={`text-base font-black ${verdict.color} mb-2 tracking-tight leading-snug`}>{verdict.label}</p>
            <div className="space-y-1">
              {verdict.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-black/10 px-2 py-1 rounded">
                  <span className={`text-[10px] font-black shrink-0 ${
                    e.sign === '+' ? 'text-emerald-400' : e.sign === '−' ? 'text-red-400' : 'text-muted-foreground'
                  }`}>{e.sign}</span>
                  <p className="text-[10px] text-foreground/80 font-medium leading-tight">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom KPI strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-line-2">
        {[
          { l: 'Conviction',   v: `${convictionScore}`,                           c: convictionScore >= 80 ? 'text-emerald-400' : convictionScore >= 60 ? 'text-amber-400' : 'text-red-400' },
          { l: 'Smart Money',  v: `${Math.round(smiScore)}`,                      c: smiScore >= 60 ? 'text-emerald-400' : smiScore >= 30 ? 'text-amber-400' : 'text-red-400' },
          { l: 'Foreign 1D',   v: formatRupiah(stockData.net_foreign_value),      c: stockData.net_foreign_value >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { l: 'AOV Ratio',    v: `${(stockData.aov_ratio_ma20||1).toFixed(2)}x`, c: stockData.aov_ratio_ma20 >= 1.5 ? 'text-purple-400' : 'text-muted-foreground' },
          { l: 'Turnover',     v: `${dailyTurnover.toFixed(2)}%`,                 c: dailyTurnover > 5 ? 'text-emerald-400' : dailyTurnover < 1 ? 'text-red-400' : 'text-amber-400' },
          { l: 'Free Float',   v: `${stockData.free_float?.toFixed(1)||'--'}%`,   c: 'text-blue-400' },
        ].map((m, i) => (
          <div key={i} className="py-1.5 px-2 rounded-lg bg-surface-2 border border-line-2 text-center">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">{m.l}</p>
            <p className={`text-sm font-black ${m.c}`}>{m.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
