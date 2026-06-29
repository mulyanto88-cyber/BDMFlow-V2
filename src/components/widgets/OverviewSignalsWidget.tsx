'use client'

import React, { useMemo } from 'react'
import { Target, Building2, Globe, ExternalLink, Shield } from 'lucide-react'
import { formatRupiah } from '@/lib/utils'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'
import Link from 'next/link'
import { ResponsiveContainer, BarChart, Bar, ReferenceLine, Cell } from 'recharts'

// ─── Scorecard helpers ──────────────────────────────────────────────────────
function tierCls(t: string): string {
  switch (t) {
    case 'STRONG_BUY': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
    case 'BUY':        return 'bg-green-500/15 text-green-400 border border-green-500/30'
    case 'ACCUMULATE': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'WATCH':      return 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
    default:           return 'bg-slate-500/10 text-muted-foreground border border-white/10'
  }
}
function ScoreBar({ label, v, max }: { label: string; v: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (Number(v || 0) / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-gold-400/70" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground w-9 text-right">{Number(v || 0)}/{max}</span>
    </div>
  )
}
function ScoreKPI({ label, val, pos }: { label: string; val: string; pos?: boolean }) {
  const c = pos === undefined ? 'text-foreground' : pos ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="flex flex-col">
      <span className="text-[8px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`font-bold ${c}`}>{val}</span>
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
  const foreignFlowTrend = data?.foreignFlowTrend || []
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
        <div className="glass rounded-2xl p-4 border border-white/[0.06]">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{scVerdict?.emoji}</span>
                <h3 className="font-black text-sm">{scVerdict?.headline}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{scVerdict?.detail}</p>
              {scorecard && (
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-[11px]">
                  <ScoreKPI label="Return 5D"   val={`${Number(scorecard.return_5d ?? 0).toFixed(1)}%`}        pos={Number(scorecard.return_5d) >= 0} />
                  <ScoreKPI label="Return 20D"  val={`${Number(scorecard.return_20d ?? 0).toFixed(1)}%`}       pos={Number(scorecard.return_20d) >= 0} />
                  <ScoreKPI label="AOV"         val={`${Number(scorecard.aov_ratio_ma20 ?? 0).toFixed(2)}x`} />
                  <ScoreKPI label="Foreign 20D" val={`${Number(scorecard.foreign_20d_miliar ?? 0).toFixed(1)} M`} pos={Number(scorecard.foreign_20d_miliar) >= 0} />
                  <ScoreKPI label="Rank v2"     val={`#${scorecard.rank_overall ?? '—'}`} />
                </div>
              )}
            </div>
            {scorecard && (
              <div className="lg:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] lg:pl-4 pt-3 lg:pt-0">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Composite v2</div>
                    <div className="text-2xl font-black leading-none">{scorecard.v2_score ?? 0}<span className="text-xs text-muted-foreground font-bold">/73</span></div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${tierCls(scorecard.tier_v2)}`}>{scorecard.tier_v2}</span>
                </div>
                <div className="space-y-1">
                  <ScoreBar label="AOV"     v={scorecard.aov_pts}     max={40} />
                  <ScoreBar label="VWMA"    v={scorecard.vwma_pts}    max={15} />
                  <ScoreBar label="Whale"   v={scorecard.whale_pts}   max={12} />
                  <ScoreBar label="Foreign" v={scorecard.foreign_pts} max={6} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-2">
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
        <div className="glass rounded-2xl p-4 border border-white/[0.06] card-hover">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Smart Money Index</h3>
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
                  <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <p className="text-[8px] text-muted-foreground uppercase">{m.l}</p>
                    <p className={`text-xs font-black ${m.c}`}>{m.v}</p>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground font-mono leading-relaxed">{smartMoneyIndex.signal || '--'}</p>
            </div>
          ) : <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
        </div>

        {/* Broker Activity */}
        <div className="glass rounded-2xl p-4 border border-white/[0.06] card-hover">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Broker Activity</h3>
            </div>
            <Link href={`/broker-tracker?code=${stockCode}`} prefetch={false}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold hover:bg-blue-500/20 transition-all">
              <ExternalLink className="w-3 h-3" /> Full
            </Link>
          </div>
          {brokerData.length > 0 ? (
            <div className="space-y-1.5">
              {brokerData.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-foreground truncate">{b.kode_broker}</p>
                    <p className="text-[8px] text-muted-foreground truncate max-w-[120px]">{b.nama_broker}</p>
                  </div>
                  <span className={`text-[10px] font-black shrink-0 ml-2 ${Number(b.net_value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
        <div className="glass rounded-2xl p-4 border border-white/[0.06] card-hover flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-400" />
              <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Foreign Flow</h3>
            </div>
            <Link href={`/foreign-flow?action=stock_chart&code=${stockCode}`} prefetch={false}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[9px] font-bold hover:bg-teal-500/20 transition-all">
              <ExternalLink className="w-3 h-3" /> Intelligence
            </Link>
          </div>

          {foreignDivergence ? (
            <div className="space-y-2.5 flex-1">
              <div className={`px-3 py-2 rounded-xl text-[11px] font-black text-center border ${
                foreignDivergence.divergence_type?.includes('STEALTH') || foreignDivergence.divergence_type?.includes('BULLISH')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : foreignDivergence.divergence_type?.includes('BEARISH') || foreignDivergence.divergence_type?.includes('DISTRIBUTION')
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-white/[0.03] text-muted-foreground border-white/[0.06]'
              }`}>
                {foreignDivergence.divergence_type || 'NEUTRAL'}
              </div>

              <div className="grid grid-cols-4 gap-1">
                {([
                  { l: '1D',  v: stockData.net_foreign_value },
                  { l: '7D',  v: flow7d  },
                  { l: '30D', v: flow30d },
                  { l: '60D', v: flow60d },
                ] as { l: string; v: number }[]).map(({ l, v }) => (
                  <div key={l} className="text-center py-1.5 px-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                    <div className="text-[8px] text-muted-foreground uppercase mb-0.5">{l}</div>
                    <div className={`text-[10px] font-black leading-none ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmtFlow(v)}
                    </div>
                  </div>
                ))}
              </div>

              {miniFlowData.length > 0 && (
                <div className="h-[56px] -mx-0.5">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={miniFlowData} barCategoryGap="10%" margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                      <Bar dataKey="net" radius={[1, 1, 0, 0]}>
                        {miniFlowData.map((d: any, i: number) => (
                          <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-muted-foreground block text-[8px] mb-0.5">TREND 60D</span>
                  <span className={`font-bold ${
                    latestTrend?.trend?.includes('ACCUMULATION') ? 'text-emerald-400' :
                    latestTrend?.trend?.includes('DISTRIBUTION') ? 'text-red-400' : 'text-muted-foreground'
                  }`}>{String(latestTrend?.trend || 'NEUTRAL').replace(/_/g, ' ')}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-muted-foreground block text-[8px] mb-0.5">SIGNAL</span>
                  <span className={`font-bold ${
                    foreignDivergence.signal_strength === 'STRONG' ? 'text-emerald-400' :
                    foreignDivergence.signal_strength === 'MODERATE' ? 'text-amber-400' : 'text-muted-foreground'
                  }`}>{foreignDivergence.signal_strength || 'WEAK'}</span>
                </div>
              </div>

              {latestTrend && (
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[9px]">
                  <span className="text-muted-foreground">MA5 vs MA20</span>
                  <span className={`font-black ${Number(latestTrend.flow_ma5) >= Number(latestTrend.flow_ma20) ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(latestTrend.flow_ma5) >= Number(latestTrend.flow_ma20) ? '↑ Accumulation' : '↓ Distribution'}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[9px]">
                <span className="text-muted-foreground">Harga 1D</span>
                <span className={`font-bold ${(foreignDivergence.price_chg_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {Number(foreignDivergence.price_chg_pct || 0) >= 0 ? '+' : ''}{Number(foreignDivergence.price_chg_pct || 0).toFixed(2)}%
                  <span className="text-muted-foreground font-normal ml-1">vs Foreign {stockData.net_foreign_value >= 0 ? '↑' : '↓'}</span>
                </span>
              </div>

              {foreignDivergence.interpretation && (
                <div className="p-2.5 rounded-lg bg-teal-500/[0.05] border border-teal-500/[0.12]">
                  <p className="text-[10px] text-teal-200/80 leading-relaxed flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">💡</span>
                    <span>{foreignDivergence.interpretation}</span>
                  </p>
                </div>
              )}
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
