'use client'

import React from 'react'
import { formatRupiah, formatShares } from '@/lib/utils'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'
import { Activity, BarChart as BarChartIcon } from 'lucide-react'

interface Props { stockCode: string }

export function TechnicalsWidget({ stockCode }: Props) {
  const { period } = useTerminalStore()
  const { data } = useStockOverview(stockCode, period)

  const volumeSpikes = data?.volumeSpikes || []
  const whaleActivity = data?.whaleActivity

  if (!volumeSpikes.length && !whaleActivity) return (
    <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
      <BarChartIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
      <p className="text-sm text-muted-foreground">Data teknikal tidak tersedia untuk saham ini.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {(volumeSpikes.length > 0 || whaleActivity) && (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-black uppercase tracking-widest">Volume & Whale Activity</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {whaleActivity && (
              <div>
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">
                  Whale Footprint <span className="text-[8px] text-muted-foreground/50 ml-2">{whaleActivity.total_days} days</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { l: 'Whale Days',    v: `${whaleActivity.whale_days}/${whaleActivity.total_days}`, c: 'text-blue-400',   sub: `${(Number(whaleActivity.whale_pct)||0).toFixed(0)}%` },
                    { l: 'Anomaly Days',  v: `${whaleActivity.anomaly_days}`,                           c: 'text-pink-400',   sub: 'Big Player' },
                    { l: 'Total Foreign', v: formatRupiah(Number(whaleActivity.total_foreign)),         c: whaleActivity.total_foreign>=0?'text-emerald-400':'text-red-400', sub: '' },
                    { l: 'Avg Price',     v: formatRupiah(Number(whaleActivity.avg_price)),             c: 'text-purple-400', sub: `AOV: ${Number(whaleActivity.avg_aov_ratio).toFixed(2)}x` },
                  ].map((m, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                      <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                      <p className={`text-sm font-black mt-1 ${m.c}`}>{m.v}</p>
                      {m.sub && <p className="text-[8px] text-muted-foreground mt-0.5">{m.sub}</p>}
                    </div>
                  ))}
                </div>
                {Number(whaleActivity.whale_pct) > 30 && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[10px] text-blue-300/80">
                    High whale presence ({Number(whaleActivity.whale_pct).toFixed(0)}% of days). Institutional footprints suggest active positioning.
                  </div>
                )}
              </div>
            )}
            {volumeSpikes.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Recent Volume Spikes</h4>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {volumeSpikes.map((s: any, i: number) => {
                    const isBull = Number(s.change_percent) >= 0
                    return (
                      <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${s.spike_type==='BREAKOUT'?'bg-emerald-500/[0.05] border-emerald-500/[0.12]':s.spike_type==='BREAKDOWN'?'bg-red-500/[0.05] border-red-500/[0.12]':s.spike_type==='HIGH_VOLUME'?'bg-orange-500/[0.05] border-orange-500/[0.12]':'bg-white/[0.02] border-white/[0.06]'}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">{String(s.trading_date).slice(0,10)}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.spike_type==='BREAKOUT'?'bg-emerald-500/15 text-emerald-400':s.spike_type==='BREAKDOWN'?'bg-red-500/15 text-red-400':s.spike_type==='HIGH_VOLUME'?'bg-orange-500/15 text-orange-400':'bg-slate-500/15 text-slate-400'}`}>{s.spike_type?.replace(/_/g,' ')}</span>
                          </div>
                          <p className="text-[11px] font-medium mt-0.5">Vol {formatShares(s.volume)} · Ratio {Number(s.volume_ratio).toFixed(1)}x</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className={`text-[10px] font-black ${isBull?'text-emerald-400':'text-red-400'}`}>{isBull?'+':''}{Number(s.change_percent).toFixed(2)}%</p>
                          <p className="text-[8px] text-muted-foreground">@{formatRupiah(s.close)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
