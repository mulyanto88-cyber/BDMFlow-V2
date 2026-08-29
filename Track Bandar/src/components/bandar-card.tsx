'use client'

import React from 'react'
import { ShieldCheck, TrendingUp, TrendingDown, Target, Activity } from 'lucide-react'

interface BandarCardProps {
  stockCode: string
  companyName?: string
  currentPrice: number
  /** Value-weighted price the smart cohort actually paid (broker avg_price × value). */
  bandarCost: number
  /** Current price vs that cost. Negative = the cohort is still underwater. */
  vsCostPct: number
  /** Net value of that cohort over the 5-day window, in miliar. */
  netBn: number
  /** Days out of 5 the cohort was a net buyer. */
  upDays?: number
  topBroker?: string
  whaleSignal: boolean
}

export const BandarCard: React.FC<BandarCardProps> = ({
  stockCode,
  companyName,
  currentPrice,
  bandarCost,
  vsCostPct,
  netBn,
  upDays,
  topBroker,
  whaleSignal,
}) => {
  // "Profitable" here means the bandar is above their own cost — not that the
  // stock rose today. The previous version passed the daily change here, which
  // made every card read the same.
  const isProfitable = vsCostPct >= 0

  return (
    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
      {/* Background Accent Glow */}
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-20 pointer-events-none ${isProfitable ? 'bg-emerald-500' : 'bg-rose-500'}`} />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-wide text-cyan-400">{stockCode}</span>
            {whaleSignal && (
              <span className="badge-gold text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 animate-pulse" /> WHALE
              </span>
            )}
          </div>
          {/* The old composite_signal badge came from a different scoring model
              (tb_radar) than the cost basis shown below — two verdicts on one card.
              Replaced with the setup this card actually measures. */}
          {!isProfitable && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
              Bandar nyangkut
            </span>
          )}
        </div>

        {companyName && <p className="text-xs text-slate-400 mb-4 line-clamp-1">{companyName}</p>}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" /> Current Price
            </span>
            <span className="text-lg font-extrabold text-slate-100 block mt-0.5">
              Rp {currentPrice.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" /> Bandar Est. Cost
            </span>
            <span className="text-lg font-extrabold text-amber-400 block mt-0.5">
              Rp {Math.round(bandarCost).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span className="text-slate-400">Posisi bandar:</span>
          <span className={`font-bold flex items-center gap-0.5 ${isProfitable ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isProfitable ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {vsCostPct > 0 ? '+' : ''}{vsCostPct.toFixed(1)}%
            <span className="font-medium">{isProfitable ? 'untung' : 'nyangkut'}</span>
          </span>
        </div>

        <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
          {topBroker && <span className="text-slate-300 font-bold">{topBroker}</span>}
          <span>
            Net: <span className="text-cyan-400 font-bold">{netBn >= 0 ? '+' : ''}{netBn.toFixed(1)} M</span>
          </span>
          {upDays != null && <span className="text-slate-500">{upDays}/5</span>}
        </div>
      </div>
    </div>
  )
}
