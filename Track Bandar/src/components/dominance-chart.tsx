'use client'

import React from 'react'

interface DominanceChartProps {
  topBuyerCode?: string
  topBuyerPct?: number
  netMiliar?: number
}

export const DominanceChart: React.FC<DominanceChartProps> = ({
  topBuyerCode = 'N/A',
  topBuyerPct = 0,
  netMiliar = 0,
}) => {
  const pct = Math.min(Math.max(topBuyerPct, 0), 100)
  
  let category = 'Distributed / Low'
  let barColor = 'bg-slate-500'
  if (pct >= 60) {
    category = 'Monopolistic Dominator'
    barColor = 'bg-gradient-to-r from-cyan-500 to-amber-500'
  } else if (pct >= 40) {
    category = 'Consolidated Group'
    barColor = 'bg-gradient-to-r from-teal-500 to-cyan-500'
  } else if (pct >= 25) {
    category = 'Moderate Accumulation'
    barColor = 'bg-teal-500'
  }

  return (
    <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400">
          Dominant Broker: <span className="text-cyan-400 font-extrabold">{topBuyerCode}</span>
        </span>
        <span className="text-xs font-bold text-slate-200">{pct.toFixed(1)}%</span>
      </div>

      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>Status: <strong className="text-slate-200">{category}</strong></span>
        {netMiliar !== 0 && (
          <span>Net: <strong className={netMiliar > 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {netMiliar > 0 ? '+' : ''}{netMiliar.toFixed(2)} M
          </strong></span>
        )}
      </div>
    </div>
  )
}
