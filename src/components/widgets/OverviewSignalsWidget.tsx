'use client'

import React, { useMemo } from 'react'
import { Target, Building2, Globe, ExternalLink, Shield, TrendingUp, TrendingDown, Zap, Hash, Activity } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'
import Link from 'next/link'
import { ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell } from 'recharts'

// ─── Scorecard helpers ──────────────────────────────────────────────────────
function tierCls(t: string): string {
  switch (t) {
    case 'STRONG_BUY': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
    case 'BUY':        return 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.15)]'
    case 'ACCUMULATE': return 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
    case 'WATCH':      return 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
    default:           return 'bg-surface-3 text-muted-foreground border border-white/[0.06]'
  }
}
function ScoreBar({ label, v, max }: { label: string; v: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (Number(v || 0) / max) * 100))
  const isFull = pct >= 100
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[9.5px] font-bold text-muted-foreground/80 w-12 flex-shrink-0 tracking-wide">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-surface-4/80 border border-white/[0.04] overflow-hidden p-0.5">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            isFull 
              ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]' 
              : 'bg-gradient-to-r from-amber-500/80 to-amber-400/90'
          }`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-foreground/90 w-10 text-right tabular-nums">{Number(v || 0)}<span className="text-muted-foreground/50 text-[8.5px]">/{max}</span></span>
    </div>
  )
}
function ScoreKPI({ 
  label, 
  val, 
  pos, 
  sub, 
  badgeColor,
  icon: Icon 
}: { 
  label: string
  val: string
  pos?: boolean
  sub?: string
  badgeColor?: string
  icon?: React.ElementType 
}) {
  const c = pos === undefined 
    ? 'text-foreground' 
    : pos 
      ? 'text-emerald-600 dark:text-emerald-400' 
      : 'text-rose-600 dark:text-rose-400'

  const badgeStyle = badgeColor || (pos === undefined
    ? 'bg-surface-3 text-muted-foreground border-border/40'
    : pos
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25')

  return (
    <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-surface-1/90 dark:bg-surface-2/40 border border-line-2 hover:border-line-4 hover:shadow-xs transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-[8.5px] font-bold text-muted-foreground uppercase tracking-wider truncate">{label}</span>
        {Icon && <Icon className={`w-3.5 h-3.5 ${pos === undefined ? 'text-muted-foreground/60' : pos ? 'text-emerald-500' : 'text-rose-500'}`} />}
      </div>
      <div className="flex items-baseline justify-between gap-1">
        <span className={`text-sm sm:text-base font-black font-mono tracking-tight ${c}`}>{val}</span>
        {sub && (
          <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded border leading-none tracking-wider shrink-0 ${badgeStyle}`}>
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}
function fmtFlow(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? '+' : '-'
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)} T`
  if (abs >= 1e9)  return `${sign}${(abs / 1e9).toFixed(1)} M`
  if (abs >= 1e6)  return `${sign}${(abs / 1e6).toFixed(0)}Jt`
  if (abs === 0)   return '0'
  return `${sign}${abs.toLocaleString('id-ID')}`
}

interface Props { stockCode: string }

export function OverviewSignalsWidget({ stockCode }: Props) {
  const { period } = useTerminalStore()
  const { data } = useStockOverview(stockCode, period)

  const stockData = data?.stockData
  const smartMoneyIndex = data?.smartMoneyIndex
  const brokerData = data?.brokerData || []
  const foreignDivergence = data?.foreignDivergence
  const foreignFlowTrend = useMemo(() => data?.foreignFlowTrend || [], [data?.foreignFlowTrend])
  const scorecard = data?.scorecard
  const scVerdict = data?.verdict

  const smiScore = smartMoneyIndex?.smart_money_score || 0
  const convictionScore = useMemo(() => {
    let s = smiScore
    if (stockData?.whale_signal) s = Math.min(100, s + 10)
    if ((stockData?.aov_ratio_ma20 || 1) >= 1.5) s = Math.min(100, s + 10)
    return Math.round(s)
  }, [smiScore, stockData])

  const flow7d  = useMemo(() => foreignFlowTrend.slice(-7).reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const flow30d = useMemo(() => foreignFlowTrend.slice(-30).reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const flow60d = useMemo(() => foreignFlowTrend.reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const latestTrend = useMemo(() => foreignFlowTrend.length ? foreignFlowTrend[foreignFlowTrend.length - 1] : null, [foreignFlowTrend])
  const miniFlowData = useMemo(() =>
    foreignFlowTrend.slice(-30).map((d: any) => ({
      date: String(d.trading_date).slice(5),
      net: Number(d.net_foreign_value),
    })), [foreignFlowTrend])

  if (!stockData) return null

  return (
    <div className="space-y-4">
      {/* ── Diagnostic Scorecard v2 ─────────────────────────────────────── */}
      {(scorecard || scVerdict) && (
        <div className="rounded-2xl p-4 sm:p-5 border border-line-3 bg-card shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-7 xl:col-span-8 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="text-xl filter drop-shadow">{scVerdict?.emoji}</span>
                <h3 className="font-black text-sm sm:text-base text-foreground tracking-tight">{scVerdict?.headline}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{scVerdict?.detail}</p>
              {scorecard && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 mt-4 pt-3.5 border-t border-line-3">
                  <ScoreKPI 
                    label="Return 5D"   
                    val={`${Number(scorecard.return_5d ?? 0) >= 0 ? '+' : ''}${Number(scorecard.return_5d ?? 0).toFixed(1)}%`}        
                    pos={Number(scorecard.return_5d) >= 0} 
                    sub={Number(scorecard.return_5d) >= 0 ? 'BULL' : 'BEAR'}
                    icon={Number(scorecard.return_5d) >= 0 ? TrendingUp : TrendingDown}
                  />
                  <ScoreKPI 
                    label="Return 20D"  
                    val={`${Number(scorecard.return_20d ?? 0) >= 0 ? '+' : ''}${Number(scorecard.return_20d ?? 0).toFixed(1)}%`}       
                    pos={Number(scorecard.return_20d) >= 0} 
                    sub={Number(scorecard.return_20d) >= 0 ? 'BULL' : 'BEAR'}
                    icon={Number(scorecard.return_20d) >= 0 ? TrendingUp : TrendingDown}
                  />
                  <ScoreKPI 
                    label="AOV Ratio"   
                    val={`${Number(scorecard.aov_ratio_ma20 ?? 0).toFixed(2)}x`}
                    sub={Number(scorecard.aov_ratio_ma20 ?? 0) >= 1.5 ? 'WHALE' : 'NORMAL'}
                    badgeColor={Number(scorecard.aov_ratio_ma20 ?? 0) >= 1.5 ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25' : 'bg-surface-3 text-muted-foreground border-border/40'}
                    icon={Zap}
                  />
                  <ScoreKPI 
                    label="Foreign 20D" 
                    val={`${Number(scorecard.foreign_20d_miliar ?? 0) >= 0 ? '+' : ''}${Number(scorecard.foreign_20d_miliar ?? 0).toFixed(1)} M`} 
                    pos={Number(scorecard.foreign_20d_miliar) >= 0} 
                    sub={Number(scorecard.foreign_20d_miliar) >= 0 ? 'NET BUY' : 'NET SELL'}
                    icon={Globe}
                  />
                  <ScoreKPI 
                    label="Rank v2"     
                    val={`#${scorecard.rank_overall ?? '—'}`} 
                    sub="OVERALL"
                    icon={Hash}
                  />
                </div>
              )}
            </div>
            {scorecard && (
              <div className="lg:col-span-5 xl:col-span-4 border-t lg:border-t-0 lg:border-l border-line-3 lg:pl-6 pt-4 lg:pt-0">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-[0.14em] font-bold">Composite V2</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-amber-500 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-amber-200 dark:to-amber-400 leading-none mt-0.5">
                      {scorecard.v2_score ?? 0}<span className="text-xs text-muted-foreground font-bold">/73</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider backdrop-blur-md ${tierCls(scorecard.tier_v2)}`}>
                    {scorecard.tier_v2}
                  </span>
                </div>
                <div className="space-y-2 bg-surface-1/90 dark:bg-surface-2/50 p-2.5 rounded-xl border border-line-2">
                  <ScoreBar label="AOV"     v={scorecard.aov_pts}     max={40} />
                  <ScoreBar label="VWMA"    v={scorecard.vwma_pts}    max={15} />
                  <ScoreBar label="Whale"   v={scorecard.whale_pts}   max={12} />
                  <ScoreBar label="Foreign" v={scorecard.foreign_pts} max={6} />
                </div>
                <div className="text-[9px] font-mono text-muted-foreground mt-2 truncate">
                  v1: {scorecard.v1_tier} ({scorecard.v1_score}) · flow: {scorecard.flow_context}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Signal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Smart Money Index */}
        <div className="group relative rounded-2xl p-4 sm:p-5 border border-line-3 bg-card shadow-sm hover:border-purple-500/40 hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          <div className="flex items-center gap-2 mb-3.5">
            <div className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.16em]">Smart Money Index</h3>
          </div>
          {smartMoneyIndex ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Score',      v: Math.round(smiScore),                         c: smiScore >= 60 ? 'text-emerald-400' : smiScore >= 30 ? 'text-amber-400' : 'text-red-400' },
                  { l: 'Conviction', v: convictionScore,                               c: convictionScore >= 60 ? 'text-blue-400' : 'text-muted-foreground' },
                  { l: 'Broker Net', v: formatRupiah(smartMoneyIndex.broker_net || 0), c: (smartMoneyIndex.broker_net || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { l: 'Foreign 30D',v: formatRupiah(smartMoneyIndex.foreign_30d || 0),c: (smartMoneyIndex.foreign_30d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map((m, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-surface-2/70 border border-white/[0.04]">
                    <p className="text-[8px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-0.5">{m.l}</p>
                    <p className={`text-xs font-black font-mono tracking-tight ${m.c}`}>{m.v}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 rounded-xl bg-black/20 border border-white/[0.03]">
                <p className="text-[9.5px] text-muted-foreground font-mono leading-relaxed">{smartMoneyIndex.signal || '--'}</p>
              </div>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
        </div>

        {/* Broker Activity */}
        <div className="group relative rounded-2xl p-4 sm:p-5 border border-line-3 bg-card shadow-sm hover:border-blue-500/40 hover:shadow-md transition-all duration-200 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.16em]">Broker Activity</h3>
            </div>
            <Link href={`/broker-tracker?code=${stockCode}`} prefetch={false}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold hover:bg-blue-500/20 transition-all active:scale-95">
              <ExternalLink className="w-3 h-3" /> Full
            </Link>
          </div>
          {brokerData.length > 0 ? (
            <div className="space-y-2">
              {brokerData.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-surface-2/50 border border-white/[0.03] transition-colors hover:bg-surface-2/80">
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold text-foreground font-mono truncate">{b.kode_broker}</p>
                    <p className="text-[8px] text-muted-foreground truncate max-w-[130px]">{b.nama_broker}</p>
                  </div>
                  <span className={`text-[10.5px] font-black font-mono shrink-0 ml-2 ${Number(b.net_value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatRupiah(Number(b.net_value))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-50">
              <Building2 className="w-5 h-5 text-blue-400 mb-2" />
              <p className="text-xs text-foreground font-medium">No Broker Data</p>
            </div>
          )}
        </div>

        {/* Foreign Flow — mini card */}
        <div className="group relative rounded-2xl p-4 sm:p-5 border border-line-3 bg-card shadow-sm hover:border-teal-500/40 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <Globe className="w-3.5 h-3.5 text-teal-400" />
              </div>
              <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-[0.16em]">Foreign Flow</h3>
            </div>
            <Link href={`/foreign-flow?action=stock_chart&code=${stockCode}`} prefetch={false}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[9px] font-bold hover:bg-teal-500/20 transition-all active:scale-95">
              <ExternalLink className="w-3 h-3" /> Intel
            </Link>
          </div>

          {foreignDivergence ? (
            <div className="space-y-2.5 flex-1">
              <div className={`px-3 py-2 rounded-xl text-center border shadow-sm ${
                foreignDivergence.divergence_type?.includes('STEALTH') || foreignDivergence.divergence_type?.includes('BULLISH')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : foreignDivergence.divergence_type?.includes('BEARISH') || foreignDivergence.divergence_type?.includes('DISTRIBUTION')
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-surface-2/70 text-muted-foreground border-white/[0.05]'
              }`}>
                <div className="text-[8px] font-bold uppercase tracking-[0.14em] opacity-70 mb-0.5">Sinyal 30D</div>
                <div className="text-[11px] font-black tracking-wide">{foreignDivergence.divergence_type || 'NEUTRAL'}</div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {([
                  { l: '1D',  v: stockData.net_foreign_value },
                  { l: '7D',  v: flow7d  },
                  { l: '30D', v: flow30d },
                  { l: '60D', v: flow60d },
                ] as { l: string; v: number }[]).map(({ l, v }) => (
                  <div key={l} className="text-center py-1.5 px-1 rounded-xl bg-surface-2/70 border border-white/[0.04]">
                    <div className="text-[8px] font-bold text-muted-foreground uppercase mb-0.5">{l}</div>
                    <div className={`text-[10px] font-black font-mono leading-none ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmtFlow(v)}
                    </div>
                  </div>
                ))}
              </div>

              {miniFlowData.length > 0 && (
                <div className="h-[56px] -mx-0.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={miniFlowData} barCategoryGap="10%" margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                      <ReferenceLine y={0} stroke="rgba(148,163,184,0.3)" />
                      <Bar dataKey="net" radius={[1, 1, 0, 0]}>
                        {miniFlowData.map((d: any, i: number) => (
                          <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-surface-2/70 border border-white/[0.04]">
                  <span className="text-muted-foreground/80 block text-[8px] font-bold tracking-wider mb-0.5">TREND 20D</span>
                  <span className={`font-black font-mono text-[10.5px] ${
                    latestTrend?.trend?.includes('ACCUMULATION') ? 'text-emerald-400' :
                    latestTrend?.trend?.includes('DISTRIBUTION') ? 'text-red-400' : 'text-muted-foreground'
                  }`}>{String(latestTrend?.trend || 'NEUTRAL').replace(/_/g, ' ')}</span>
                </div>
                <div className="p-2 rounded-xl bg-surface-2/70 border border-white/[0.04]">
                  <span className="text-muted-foreground/80 block text-[8px] font-bold tracking-wider mb-0.5">SIGNAL</span>
                  <span className={`font-black text-[10.5px] ${
                    foreignDivergence.signal_strength === 'STRONG' ? 'text-emerald-400' :
                    foreignDivergence.signal_strength === 'MODERATE' ? 'text-amber-400' : 'text-muted-foreground'
                  }`}>{foreignDivergence.signal_strength || 'NEUTRAL'}</span>
                </div>
              </div>

              {latestTrend && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-surface-2/70 border border-white/[0.04] text-[9.5px]">
                  <span className="text-muted-foreground/80 font-bold text-[8.5px] uppercase">MA5 vs MA20</span>
                  <span className={`font-black font-mono ${Number(latestTrend.flow_ma5) >= Number(latestTrend.flow_ma20) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(latestTrend.flow_ma5) >= Number(latestTrend.flow_ma20) ? '↑ Accumulation' : '↓ Distribution'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-surface-1 border border-line-2 text-[9px]">
                <span className="text-muted-foreground">Harga 1D</span>
                <span className={`font-bold ${(foreignDivergence.price_chg_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {Number(foreignDivergence.price_chg_pct || 0) >= 0 ? '+' : ''}{Number(foreignDivergence.price_chg_pct || 0).toFixed(2)}%
                  <span className="text-muted-foreground font-normal ml-1">vs Foreign {stockData.net_foreign_value >= 0 ? '↑' : '↓'}</span>
                </span>
              </div>

              {(() => {
                // The badge/interpretation read the 30-day window; the trend chip reads a
                // 20-day rolling sum. When they disagree, a confident one-sided takeaway
                // ("potensi breakout" beside "DISTRIBUTION") reads as the product
                // contradicting itself — name the disagreement instead.
                const dv = String(foreignDivergence.divergence_type || '')
                const tr = String(latestTrend?.trend || '')
                const bull30 = dv.includes('STEALTH') || dv.includes('BULLISH')
                const bear30 = dv.includes('BEARISH') || dv.includes('DISTRIBUTION')
                const conflict =
                  (bull30 && tr.includes('DISTRIBUTION')) ||
                  (bear30 && tr.includes('ACCUMULATION'))

                if (conflict) return (
                  <div className="p-2.5 rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.18]">
                    <p className="text-[10px] text-amber-700 dark:text-amber-200/85 leading-relaxed flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">⚖️</span>
                      <span>
                        Sinyal 30D ({dv.replace(/_/g, ' ').toLowerCase()}) dan tren 20D ({tr.replace(/_/g, ' ').toLowerCase()}) sedang
                        <span className="font-bold"> berlawanan arah</span> — aliran asing dalam fase transisi. Tunggu konfirmasi, jangan andalkan satu jendela saja.
                      </span>
                    </p>
                  </div>
                )

                return foreignDivergence.interpretation ? (
                  <div className="p-2.5 rounded-lg bg-teal-500/[0.05] border border-teal-500/[0.12]">
                    <p className="text-[10px] text-teal-700 dark:text-teal-200/80 leading-relaxed flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">💡</span>
                      <span>{foreignDivergence.interpretation}</span>
                    </p>
                  </div>
                ) : null
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 opacity-50 flex-1">
              <Globe className="w-5 h-5 text-teal-400 mb-2" />
              <p className="text-xs text-foreground font-medium">No Foreign Data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
