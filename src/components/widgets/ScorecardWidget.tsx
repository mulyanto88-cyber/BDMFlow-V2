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
    <div className="rounded-3xl p-4 sm:p-5 lg:p-6 border border-border/70 dark:border-white/[0.08] bg-gradient-to-b from-card via-card/95 to-surface-1/90 dark:from-[#111118] dark:via-[#0d0d14] dark:to-[#09090e] shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] relative overflow-hidden">
      {/* Top Hairline Accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 dark:via-amber-400/40 to-transparent pointer-events-none" />

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
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 items-stretch">
        
        {/* 1. Left Price Block (Sculpted Glass Pod) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-surface-2/90 via-surface-2/40 to-surface-1/30 dark:from-white/[0.045] dark:via-white/[0.015] dark:to-transparent border border-border/60 dark:border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] relative overflow-hidden group">
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div>
            <div className="flex items-center gap-3.5">
              <div className="relative p-1 rounded-2xl bg-surface-2/80 dark:bg-white/[0.04] border border-border/40 dark:border-white/[0.06] shadow-sm shrink-0">
                <CompanyLogo code={code} sector={stockData.sector} size={48} eager className="drop-shadow-md rounded-xl" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">{code}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-3 text-muted-foreground/90 border border-line-2 text-[9px] font-black uppercase tracking-widest shadow-2xs">
                    {stockData.sector || 'Stock'}
                  </span>
                </div>
                {companyName && (
                  <p className="text-xs font-semibold text-muted-foreground/80 truncate leading-snug">{companyName}</p>
                )}
              </div>
            </div>

            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-foreground font-mono leading-none">
                {formatRupiah(stockData.close)}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-black font-mono text-xs border shadow-xs ${
                stockData.change_percent >= 0 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                {stockData.change_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" /> : <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />}
                {stockData.change_percent >= 0 ? '+' : ''}{stockData.change_percent.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="text-[10.5px] text-muted-foreground mt-4 font-mono flex flex-wrap items-center gap-x-3 gap-y-1.5 bg-surface-2/80 dark:bg-black/30 px-3 py-1.5 rounded-xl border border-border/40 dark:border-white/[0.06] w-fit shadow-2xs">
            <span><span className="text-muted-foreground/60">H:</span> <strong className="text-foreground">{formatNumber(stockData.high)}</strong></span>
            <span><span className="text-muted-foreground/60">L:</span> <strong className="text-foreground">{formatNumber(stockData.low)}</strong></span>
            <span><span className="text-muted-foreground/60">O:</span> <strong className="text-foreground">{formatNumber(stockData.open_price)}</strong></span>
            <span className="opacity-20 hidden sm:inline">|</span>
            <span className="flex items-center gap-1 text-muted-foreground/80 font-sans text-[10px] font-medium">
              <Clock className="w-3 h-3 text-amber-500/80" /> {String(stockData.trading_date).split('T')[0]}
            </span>
          </div>
        </div>

        {/* 2. Middle 5 Financial Metric Cards (High-Precision Jewel-Toned Stat Tiles) */}
        <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {[
            { 
              l: 'Market Cap', 
              v: formatRupiah(marketCap), 
              sub: 'Total Valuasi IDX',
              icon: Coins, 
              color: 'text-amber-600 dark:text-amber-300',
              iconStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
              glowBorder: 'hover:border-amber-500/40'
            },
            { 
              l: 'Float Cap', 
              v: formatRupiah(floatCap), 
              sub: `${stockData.free_float?.toFixed(1) || 0}% Free Float`,
              icon: PieChart, 
              color: 'text-sky-600 dark:text-sky-300',
              iconStyle: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25',
              glowBorder: 'hover:border-sky-500/40'
            },
            { 
              l: 'Public Shr', 
              v: formatShares(publicShares), 
              sub: 'Saham di Publik',
              icon: Users, 
              color: 'text-indigo-600 dark:text-indigo-300',
              iconStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
              glowBorder: 'hover:border-indigo-500/40'
            },
            { 
              l: 'Volume', 
              v: formatShares(stockData.volume), 
              sub: `${formatShares(volumeLot)} Lot`,
              icon: BarChart3, 
              color: 'text-teal-600 dark:text-teal-300',
              iconStyle: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25',
              glowBorder: 'hover:border-teal-500/40'
            },
            { 
              l: 'Value', 
              v: formatRupiah(stockData.value), 
              sub: 'Nilai Transaksi 1D',
              icon: Wallet, 
              color: 'text-emerald-600 dark:text-emerald-300',
              iconStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
              glowBorder: 'hover:border-emerald-500/40',
              span: 'col-span-2 sm:col-span-1 lg:col-span-2 xl:col-span-1'
            },
          ].map((m, i) => {
            const Icon = m.icon
            return (
              <div 
                key={i} 
                className={`group relative p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between bg-gradient-to-b from-surface-1/90 via-surface-1/60 to-surface-2/40 dark:from-white/[0.035] dark:via-white/[0.02] dark:to-transparent border border-border/60 dark:border-white/[0.07] ${m.glowBorder} hover:shadow-md transition-all duration-200 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${m.span || ''}`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/75">{m.l}</span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border shadow-2xs ${m.iconStyle}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className={`text-base sm:text-[17px] font-black font-mono tracking-tight ${m.color}`}>
                    {m.v}
                  </div>
                  <span className="text-[9.5px] text-muted-foreground/70 font-medium font-mono truncate block mt-0.5">
                    {m.sub}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 3. Right Verdict Box (Decision Intelligence Pod) */}
        <div className="lg:col-span-3 rounded-2xl p-4 sm:p-4.5 bg-gradient-to-br from-amber-500/[0.08] via-amber-500/[0.02] to-transparent dark:from-amber-500/[0.06] dark:via-transparent border border-amber-500/35 dark:border-amber-500/30 flex flex-col justify-between relative overflow-hidden shadow-[0_4px_24px_-4px_rgba(245,158,11,0.1)]">
          <div className="absolute -right-4 -bottom-4 opacity-[0.04] pointer-events-none"><Shield className="w-32 h-32 text-amber-500" /></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Verdict Analysis</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            </div>
            <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-300 mb-3 tracking-tight leading-snug">
              {verdict.label}
            </p>
            <div className="space-y-1.5">
              {verdict.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2 bg-card/80 dark:bg-black/40 px-2.5 py-1.5 rounded-xl border border-border/50 dark:border-white/[0.06] shadow-2xs">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    e.sign === '+' 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                      : e.sign === '−' 
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                        : 'bg-surface-3 text-muted-foreground border border-border/40'
                  }`}>
                    {e.sign}
                  </span>
                  <p className="text-[10.5px] text-foreground/90 font-mono font-medium leading-tight truncate">{e.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: 6 Executive Financial KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-border/50 dark:border-white/[0.06]">
        {[
          { 
            l: 'Conviction',   
            v: `${convictionScore}`,                           
            status: convictionScore >= 80 ? 'HIGH' : convictionScore >= 60 ? 'MED' : 'LOW',
            valColor: convictionScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : convictionScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
            badgeBg: convictionScore >= 80 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : convictionScore >= 60 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
            barPct: Math.min(100, convictionScore),
            barColor: convictionScore >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : convictionScore >= 60 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
          },
          { 
            l: 'Smart Money',  
            v: `${Math.round(smiScore)}`,                      
            status: smiScore >= 60 ? 'ACCUM' : smiScore >= 30 ? 'NEUTRAL' : 'DISTRIB',
            valColor: smiScore >= 60 ? 'text-emerald-600 dark:text-emerald-400' : smiScore >= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400',
            badgeBg: smiScore >= 60 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : smiScore >= 30 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
            barPct: Math.min(100, Math.round(smiScore)),
            barColor: smiScore >= 60 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : smiScore >= 30 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
          },
          { 
            l: 'Foreign 1D',   
            v: formatRupiah(stockData.net_foreign_value),      
            valColor: stockData.net_foreign_value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            status: stockData.net_foreign_value >= 0 ? 'NET BUY' : 'NET SELL',
            badgeBg: stockData.net_foreign_value >= 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
            barPct: stockData.net_foreign_value >= 0 ? 80 : 30,
            barColor: stockData.net_foreign_value >= 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
          },
          { 
            l: 'AOV Ratio',    
            v: `${(stockData.aov_ratio_ma20||1).toFixed(2)}x`, 
            status: stockData.aov_ratio_ma20 >= 1.5 ? 'WHALE' : 'NORMAL',
            valColor: stockData.aov_ratio_ma20 >= 1.5 ? 'text-purple-600 dark:text-purple-300' : 'text-amber-600 dark:text-amber-300',
            badgeBg: stockData.aov_ratio_ma20 >= 1.5 ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]' : 'bg-surface-3 text-muted-foreground/80 border-border/40',
            barPct: Math.min(100, (stockData.aov_ratio_ma20 || 1) * 50),
            barColor: stockData.aov_ratio_ma20 >= 1.5 ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-muted-foreground/30'
          },
          { 
            l: 'Turnover',     
            v: `${dailyTurnover.toFixed(2)}%`,                 
            status: dailyTurnover > 5 ? 'HIGH VOL' : dailyTurnover < 1 ? 'LOW VOL' : 'NORMAL',
            valColor: 'text-teal-600 dark:text-teal-300',
            badgeBg: dailyTurnover > 5 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : dailyTurnover < 1 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30' : 'bg-surface-3 text-muted-foreground/80 border-border/40',
            barPct: Math.min(100, dailyTurnover * 10),
            barColor: dailyTurnover > 5 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : dailyTurnover < 1 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-muted-foreground/30'
          },
          { 
            l: 'Free Float',   
            v: `${stockData.free_float?.toFixed(1)||'--'}%`,   
            status: (stockData.free_float || 0) > 30 ? 'LIQUID' : 'TIGHT',
            valColor: 'text-sky-600 dark:text-sky-300',
            badgeBg: (stockData.free_float || 0) > 30 ? 'bg-surface-3 text-muted-foreground/80 border-border/40' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
            barPct: Math.min(100, stockData.free_float || 0),
            barColor: (stockData.free_float || 0) > 30 ? 'bg-muted-foreground/30' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
          },
        ].map((m, i) => (
          <div key={i} className="p-3 rounded-2xl bg-gradient-to-b from-surface-1/90 via-surface-1/60 to-surface-2/40 dark:from-white/[0.035] dark:via-white/[0.02] dark:to-transparent border border-border/60 dark:border-white/[0.07] hover:border-border/90 hover:shadow-xs transition-all duration-200 flex flex-col justify-between shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/75 truncate">{m.l}</span>
              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border leading-none tracking-wider shadow-2xs ${m.badgeBg}`}>
                {m.status}
              </span>
            </div>
            <div>
              <div className={`text-base sm:text-[17px] font-black font-mono tracking-tight ${m.valColor}`}>
                {m.v}
              </div>
              {/* Sleek pill progress track */}
              <div className="w-full h-1.5 bg-surface-3/60 dark:bg-black/40 rounded-full mt-2 overflow-hidden p-[1px] border border-border/30 dark:border-white/[0.04]">
                <div className={`h-full rounded-full transition-all duration-500 ${m.barColor}`} style={{ width: `${m.barPct}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
