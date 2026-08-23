import React, { useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, Clock, Shield, Loader2, AlertTriangle,
  Coins, PieChart, Users, BarChart3, Wallet
} from 'lucide-react'
import { formatRupiah, formatNumber, formatShares } from '@/lib/utils'
import CompanyLogo from '@/components/company-logo'
import { COMPANY_NAMES } from '@/lib/company-names'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'

interface ScorecardWidgetProps {
  stockCode?: string
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

  const verdict = useMemo(() => {
    const styleFor = (emoji: string) => {
      switch (emoji) {
        case '🟢': return { 
          color: 'text-emerald-600 dark:text-emerald-400', 
          bg: 'bg-emerald-500/10 dark:bg-emerald-950/30', 
          border: 'border-emerald-500/30 dark:border-emerald-500/40',
          glow: 'from-emerald-500/20'
        }
        case '🟡': return { 
          color: 'text-amber-600 dark:text-amber-400',   
          bg: 'bg-amber-500/10 dark:bg-amber-950/30',   
          border: 'border-amber-500/30 dark:border-amber-500/40',
          glow: 'from-amber-500/20'
        }
        case '🔻': return { 
          color: 'text-rose-600 dark:text-rose-400',     
          bg: 'bg-rose-500/10 dark:bg-rose-950/30',     
          border: 'border-rose-500/30 dark:border-rose-500/40',
          glow: 'from-rose-500/20'
        }
        default:   return { 
          color: 'text-blue-600 dark:text-blue-400',    
          bg: 'bg-surface-2 dark:bg-surface-3',   
          border: 'border-border/60 dark:border-white/[0.08]',
          glow: 'from-blue-500/20'
        }
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
      label: serverVerdict?.headline || 'Netral',
      evidence,
      ...s,
    }
  }, [serverVerdict, stockData, scorecard])

  if (!code) return <div className="glass rounded-2xl p-5 text-center text-muted-foreground border border-line-3">Pilih saham untuk melihat Scorecard</div>
  if (isLoading) return (
    <div className="rounded-2xl p-8 border border-border/60 dark:border-white/[0.08] bg-card/80 backdrop-blur-xl flex items-center justify-center gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
      <span className="text-sm font-semibold text-muted-foreground">Memuat data {code}...</span>
    </div>
  )
  if (error || !stockData) return (
    <div className="rounded-2xl p-6 border border-rose-500/30 bg-rose-500/5 text-center">
      <p className="text-rose-500 dark:text-rose-400 text-sm font-semibold">Gagal memuat scorecard</p>
    </div>
  )

  const companyName  = stockData?.company_name || COMPANY_NAMES[code] || ''
  const publicShares  = (stockData.tradeable_shares || 0) * ((stockData.free_float || 0) / 100)
  const floatCap      = publicShares * stockData.close
  const dailyTurnover = publicShares > 0 ? ((stockData.volume || 0) / publicShares) * 100 : 0
  const marketCap     = (stockData.tradeable_shares || 0) * stockData.close
  const volumeLot     = Math.round((stockData.volume || 0) / 100)

  return (
    <div className="rounded-2xl p-4 sm:p-5 lg:p-6 border border-line-3 bg-card shadow-sm relative overflow-hidden">
      {/* Top hairline — satu-satunya aksen, tanpa glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 dark:via-white/[0.08] to-transparent pointer-events-none" />

      {/* Data-quality banner */}
      {dataQuality?.returnsUnreliable && dataQuality.unadjustedAction && (
        <div className="relative z-10 mb-4 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-snug">
            <span className="font-black text-amber-600 dark:text-amber-400">
              {dataQuality.unadjustedAction.kind === 'REVERSE_SPLIT' ? 'Reverse split' : 'Stock split / bonus'} terdeteksi{' '}
              {String(dataQuality.unadjustedAction.date)}
            </span>{' '}
            ({formatNumber(dataQuality.unadjustedAction.priceBefore)} → {formatNumber(dataQuality.unadjustedAction.priceAfter)}, belum disesuaikan di data historis).
            Return 5D/20D dan indikator berbasis harga lintas tanggal itu <span className="font-bold">tidak andal</span>.
          </p>
        </div>
      )}

      {/* TOP SECTION: Price Block + 5 Financial Cards + Verdict Box */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-4 items-stretch">
        
        {/* 1. Left Price Block */}
        <div className="lg:col-span-4 flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-surface-1/80 dark:bg-surface-2/40 border border-border/60 dark:border-white/[0.06]">
          <div>
            <div className="flex items-center gap-3">
              <CompanyLogo code={code} sector={stockData.sector} size={52} eager className="drop-shadow-sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-foreground">{code}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-3 text-muted-foreground border border-border/50 dark:border-white/[0.08] text-[9.5px] font-bold uppercase tracking-wider">
                    {stockData.sector || 'Stock'}
                  </span>
                </div>
                {companyName && (
                  <p className="text-xs font-semibold text-muted-foreground truncate">{companyName}</p>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-3 mt-3">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-foreground font-mono">{formatRupiah(stockData.close)}</span>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm border shadow-sm ${
                stockData.change_percent >= 0 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                {stockData.change_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />}
                {Math.abs(stockData.change_percent).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-muted-foreground mt-3 font-medium flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-surface-2/80 dark:bg-white/[0.04] px-3 py-1.5 rounded-xl border border-border/50 dark:border-white/[0.05] w-fit">
            <span>H: <span className="text-foreground font-mono font-bold">{formatNumber(stockData.high)}</span></span>
            <span>L: <span className="text-foreground font-mono font-bold">{formatNumber(stockData.low)}</span></span>
            <span>O: <span className="text-foreground font-mono font-bold">{formatNumber(stockData.open_price)}</span></span>
            <span className="opacity-30 hidden sm:inline">|</span>
            <span className="flex items-center gap-1 text-muted-foreground/90"><Clock className="w-3 h-3 text-amber-500" /> {String(stockData.trading_date).split('T')[0]}</span>
          </div>
        </div>

        {/* 2. Middle 5 Financial Metric Cards (Organized Grid) */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-2.5">
          {[
            { 
              l: 'Market Cap', 
              v: formatRupiah(marketCap), 
              sub: 'Total Valuasi IDX',
              icon: Coins, 
              color: 'text-purple-600 dark:text-purple-400',
              bgIcon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
              accent: 'border-l-purple-500'
            },
            { 
              l: 'Float Cap', 
              v: formatRupiah(floatCap), 
              sub: `${stockData.free_float?.toFixed(1) || 0}% Free Float`,
              icon: PieChart, 
              color: 'text-indigo-600 dark:text-indigo-400',
              bgIcon: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
              accent: 'border-l-indigo-500'
            },
            { 
              l: 'Public Shr', 
              v: formatShares(publicShares), 
              sub: 'Saham di Publik',
              icon: Users, 
              color: 'text-cyan-600 dark:text-cyan-400',
              bgIcon: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
              accent: 'border-l-cyan-500'
            },
            { 
              l: 'Volume', 
              v: formatShares(stockData.volume), 
              sub: `${formatShares(volumeLot)} Lot`,
              icon: BarChart3, 
              color: 'text-amber-600 dark:text-amber-400',
              bgIcon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
              accent: 'border-l-amber-500'
            },
            { 
              l: 'Value', 
              v: formatRupiah(stockData.value), 
              sub: 'Nilai Transaksi 1D',
              icon: Wallet, 
              color: 'text-emerald-600 dark:text-emerald-400',
              bgIcon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
              accent: 'border-l-emerald-500',
              span: 'col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1'
            },
          ].map((m, i) => {
            const Icon = m.icon
            return (
              <div 
                key={i} 
                className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col justify-between bg-surface-1/90 dark:bg-surface-2/50 border border-border/70 dark:border-white/[0.06] border-l-[3px] ${m.accent} hover:border-border hover:shadow-md transition-all duration-200 ${m.span || ''}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{m.l}</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${m.bgIcon}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                </div>
                <div>
                  <div className={`text-sm sm:text-base font-black font-mono tracking-tight ${m.color}`}>
                    {m.v}
                  </div>
                  <span className="text-[9px] text-muted-foreground/80 font-medium truncate block mt-0.5">
                    {m.sub}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 3. Right Verdict Box */}
        <div className={`lg:col-span-3 rounded-2xl p-4 ${verdict.bg} border ${verdict.border} flex flex-col justify-between relative overflow-hidden shadow-sm`}>
          <div className="absolute -right-3 -bottom-3 opacity-[0.04] pointer-events-none"><Shield className="w-28 h-28" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className={`w-3.5 h-3.5 ${verdict.color}`} />
              <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">Verdict Analysis</span>
            </div>
            <p className={`text-base font-black ${verdict.color} mb-3 tracking-tight leading-snug`}>{verdict.label}</p>
            <div className="space-y-1.5">
              {verdict.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2 bg-card/60 dark:bg-black/30 px-2.5 py-1.5 rounded-xl border border-border/40 dark:border-white/[0.04] shadow-xs">
                  <span className={`text-[11px] font-black shrink-0 ${
                    e.sign === '+' ? 'text-emerald-500 dark:text-emerald-400' : e.sign === '−' ? 'text-rose-500 dark:text-rose-400' : 'text-muted-foreground'
                  }`}>{e.sign}</span>
                  <p className="text-[10.5px] text-foreground/90 font-medium leading-tight">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: 6 Consistent Financial Indicator Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 mt-4 pt-3.5 border-t border-border/60 dark:border-white/[0.06]">
        {[
          { 
            l: 'Conviction',   
            v: `${convictionScore}`,                           
            status: convictionScore >= 80 ? 'High' : convictionScore >= 60 ? 'Moderate' : 'Low',
            color: convictionScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : convictionScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
            dot: convictionScore >= 80 ? 'bg-emerald-500' : convictionScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
          },
          { 
            l: 'Smart Money',  
            v: `${Math.round(smiScore)}`,                      
            status: smiScore >= 60 ? 'Accum' : smiScore >= 30 ? 'Neutral' : 'Distrib',
            color: smiScore >= 60 ? 'text-emerald-600 dark:text-emerald-400' : smiScore >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
            dot: smiScore >= 60 ? 'bg-emerald-500' : smiScore >= 30 ? 'bg-amber-500' : 'bg-rose-500'
          },
          { 
            l: 'Foreign 1D',   
            v: formatRupiah(stockData.net_foreign_value),      
            status: stockData.net_foreign_value >= 0 ? 'Net Buy' : 'Net Sell',
            color: stockData.net_foreign_value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            dot: stockData.net_foreign_value >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
          },
          { 
            l: 'AOV Ratio',    
            v: `${(stockData.aov_ratio_ma20||1).toFixed(2)}x`, 
            status: stockData.aov_ratio_ma20 >= 1.5 ? 'Whale Surge' : 'Normal',
            color: stockData.aov_ratio_ma20 >= 1.5 ? 'text-purple-600 dark:text-purple-400' : 'text-foreground',
            dot: stockData.aov_ratio_ma20 >= 1.5 ? 'bg-purple-500' : 'bg-slate-400'
          },
          { 
            l: 'Turnover',     
            v: `${dailyTurnover.toFixed(2)}%`,                 
            status: dailyTurnover > 5 ? 'High Vol' : dailyTurnover < 1 ? 'Low Vol' : 'Normal',
            color: dailyTurnover > 5 ? 'text-emerald-600 dark:text-emerald-400' : dailyTurnover < 1 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400',
            dot: dailyTurnover > 5 ? 'bg-emerald-500' : dailyTurnover < 1 ? 'bg-rose-500' : 'bg-amber-500'
          },
          { 
            l: 'Free Float',   
            v: `${stockData.free_float?.toFixed(1)||'--'}%`,   
            status: (stockData.free_float || 0) > 30 ? 'Liquid' : 'Concentrated',
            color: 'text-cyan-600 dark:text-cyan-400',
            dot: 'bg-cyan-500'
          },
        ].map((m, i) => (
          <div key={i} className="p-2.5 rounded-xl bg-surface-1/90 dark:bg-surface-2/40 border border-border/60 dark:border-white/[0.05] hover:border-border transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider truncate">{m.l}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${m.dot} shrink-0`} />
            </div>
            <div className="flex items-baseline justify-between gap-1 mt-0.5">
              <span className={`text-xs sm:text-sm font-black font-mono truncate ${m.color}`}>{m.v}</span>
              <span className="text-[8.5px] font-semibold text-muted-foreground/80 shrink-0">{m.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
