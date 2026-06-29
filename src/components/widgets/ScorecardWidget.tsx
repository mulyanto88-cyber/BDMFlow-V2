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

  const { stockData, smartMoneyIndex } = data || {}

  const smiScore = smartMoneyIndex?.smart_money_score || 0
  const convictionScore = useMemo(() => {
    let s = smiScore
    if (stockData?.whale_signal) s = Math.min(100, s + 10)
    if ((stockData?.aov_ratio_ma20 || 1) >= 1.5) s = Math.min(100, s + 10)
    return Math.round(s)
  }, [smiScore, stockData])

  const verdict = useMemo(() => {
    let score = 0
    const reasons: string[] = []
    if (convictionScore >= 80) { score += 3; reasons.push('Conviction tinggi') }
    else if (convictionScore >= 60) { score += 1.5; reasons.push('Conviction moderat') }
    else reasons.push('Conviction rendah')
    if (smiScore >= 60) { score += 2; reasons.push('Smart Money positif') }
    else if (smiScore < 30) { score -= 1; reasons.push('Smart Money negatif') }
    const netF = stockData?.net_foreign_value || 0
    if (netF > 1e9) { score += 1.5; reasons.push('Foreign net buy besar') }
    else if (netF < -1e9) { score -= 1; reasons.push('Foreign net sell besar') }
    if ((stockData?.aov_ratio_ma20 || 1) >= 1.5) { score += 1; reasons.push('AOV spike (whale aktif)') }
    if (score >= 5) return { label: 'STRONG BUY', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', reasons }
    if (score >= 3) return { label: 'WATCH / ACCUMULATE', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', reasons }
    if (score >= 1) return { label: 'HOLD / MONITOR', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', reasons }
    return { label: 'AVOID / REDUCE', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', reasons }
  }, [convictionScore, smiScore, stockData])

  if (!code) return <div className="glass rounded-2xl p-5 text-center text-muted-foreground border border-white/[0.06]">Pilih saham untuk melihat Scorecard</div>
  if (isLoading) return (
    <div className="glass rounded-2xl p-5 flex items-center justify-center min-h-[160px] border border-white/[0.06]">
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
    <div className="glass rounded-2xl p-4 lg:p-5 border border-white/[0.06] relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row gap-4 justify-between items-stretch">
        {/* Price block */}
        <div className="flex flex-col justify-center min-w-fit">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl lg:text-4xl font-black font-mono tracking-tight gradient-gold">{code}</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground border border-white/[0.08] text-[10px] font-bold uppercase tracking-wider">{stockData.sector || 'Stock'}</span>
          </div>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-4xl lg:text-5xl font-black tracking-tighter">{formatRupiah(stockData.close)}</span>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-sm lg:text-base ${stockData.change_percent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {stockData.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stockData.change_percent).toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-muted-foreground mt-2 font-medium flex gap-2 lg:gap-3 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06] w-fit">
            <span>H: <span className="text-foreground/80">{formatNumber(stockData.high)}</span></span>
            <span>L: <span className="text-foreground/80">{formatNumber(stockData.low)}</span></span>
            <span>O: <span className="text-foreground/80">{formatNumber(stockData.open_price)}</span></span>
            <span className="opacity-30">|</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {String(stockData.trading_date).split('T')[0]}</span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 xl:max-w-[400px]">
          {[
            { l: 'Market Cap', v: formatRupiah(marketCap),           c: 'text-purple-400' },
            { l: 'Float Cap',  v: formatRupiah(floatCap),            c: 'text-purple-400' },
            { l: 'Public Shr', v: formatShares(publicShares),        c: 'text-cyan-400'   },
            { l: 'Volume',     v: formatShares(stockData.volume),    c: 'text-orange-400' },
            { l: 'Value',      v: formatRupiah(stockData.value),     c: 'text-blue-400'   },
          ].map((m, i) => (
            <div key={i} className="metric-card p-2.5 rounded-xl flex flex-col justify-center">
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1 font-medium">{m.l}</p>
              <p className={`text-sm font-black ${m.c} tracking-tight`}>{m.v}</p>
            </div>
          ))}
        </div>

        {/* Verdict panel */}
        <div className={`rounded-2xl p-3.5 ${verdict.bg} border ${verdict.border} xl:min-w-[200px] xl:max-w-[230px] flex flex-col justify-center relative overflow-hidden shrink-0`}>
          <div className="absolute -right-4 -bottom-4 opacity-[0.04]"><Shield className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Shield className={`w-3.5 h-3.5 ${verdict.color}`} />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Verdict</span>
            </div>
            <p className={`text-lg font-black ${verdict.color} mb-2 tracking-tight`}>{verdict.label}</p>
            <div className="space-y-1">
              {verdict.reasons.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-black/10 px-1.5 py-1 rounded">
                  <span className={`text-[9px] ${verdict.color} shrink-0`}>◆</span>
                  <p className="text-[10px] text-foreground/80 font-medium leading-tight">{r}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom KPI strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-white/[0.05]">
        {[
          { l: 'Conviction',   v: `${convictionScore}`,                           c: convictionScore >= 80 ? 'text-emerald-400' : convictionScore >= 60 ? 'text-amber-400' : 'text-red-400' },
          { l: 'Smart Money',  v: `${Math.round(smiScore)}`,                      c: smiScore >= 60 ? 'text-emerald-400' : smiScore >= 30 ? 'text-amber-400' : 'text-red-400' },
          { l: 'Foreign Flow', v: formatRupiah(stockData.net_foreign_value),      c: stockData.net_foreign_value >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { l: 'AOV Ratio',    v: `${(stockData.aov_ratio_ma20||1).toFixed(2)}x`, c: stockData.aov_ratio_ma20 >= 1.5 ? 'text-purple-400' : 'text-muted-foreground' },
          { l: 'Turnover',     v: `${dailyTurnover.toFixed(2)}%`,                 c: dailyTurnover > 5 ? 'text-emerald-400' : dailyTurnover < 1 ? 'text-red-400' : 'text-amber-400' },
          { l: 'Free Float',   v: `${stockData.free_float?.toFixed(1)||'--'}%`,   c: 'text-blue-400' },
        ].map((m, i) => (
          <div key={i} className="py-1.5 px-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
            <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">{m.l}</p>
            <p className={`text-sm font-black ${m.c}`}>{m.v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
