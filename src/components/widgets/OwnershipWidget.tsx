'use client'

import React, { useMemo } from 'react'
import { formatShares } from '@/lib/utils'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'
import { PieChart as PieChartIcon, Users, Target } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

const INVESTOR_TYPE_COLORS: Record<string, string> = {
  'Corporate': '#10b981', 'Individual': '#3b82f6',
  'Fund Manager': '#f59e0b', 'Financial Institutional': '#8b5cf6',
  'Insurance': '#ec4899', 'Pension Fund': '#06b6d4',
  'Securities': '#f97316', 'Others': '#6b7280',
}

interface Props { stockCode: string }

export function OwnershipWidget({ stockCode }: Props) {
  const { period } = useTerminalStore()
  const { data } = useStockOverview(stockCode, period)

  const ownershipDetails = data?.ownershipDetails || []
  const whaleMovement = data?.whaleMovement || []
  const concentrationIndex = data?.concentrationIndex
  const institutionalChange = data?.institutionalChange || []

  const ownershipPieData = useMemo(() => {
    if (!ownershipDetails.length) return []
    const groupMap: Record<string, { totalPct: number; totalShares: number; count: number }> = {}
    ownershipDetails.forEach((d: any) => {
      const type = d.investor_type || 'Others'
      if (!groupMap[type]) groupMap[type] = { totalPct: 0, totalShares: 0, count: 0 }
      groupMap[type].totalPct += d.percentage
      groupMap[type].totalShares += d.shares
      groupMap[type].count += 1
    })
    return Object.entries(groupMap).map(([name, data]) => ({ name, value: data.totalPct, shares: data.totalShares, count: data.count }))
  }, [ownershipDetails])

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <PieChartIcon className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-black uppercase tracking-widest">Ownership Structure</h2>
          <span className="text-[9px] text-muted-foreground/40 hidden sm:inline">· KSEI Scripless</span>
        </div>
        {ownershipPieData.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="w-full lg:w-2/5 flex flex-col items-center">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={ownershipPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                      {ownershipPieData.map((entry, i) => <Cell key={i} fill={INVESTOR_TYPE_COLORS[entry.name] || '#6b7280'} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                      labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(v: any, n: any) => [`${Number(v).toFixed(1)}%`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {ownershipPieData.map((entry, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: INVESTOR_TYPE_COLORS[entry.name] || '#6b7280' }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-bold text-foreground">{entry.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-[9px] text-muted-foreground uppercase border-b border-white/[0.05]">
                  <th className="p-2 text-left">Investor</th><th className="p-2 text-left">Type</th>
                  <th className="p-2 text-center">L/F</th><th className="p-2 text-right">%</th><th className="p-2 text-right">Shares</th>
                </tr></thead>
                <tbody>
                  {ownershipDetails.map((d: any, i: number) => (
                    <tr key={i} className="border-b border-white/[0.03] tr-hover">
                      <td className="p-2 font-bold text-[10px] text-foreground truncate max-w-[120px]">{d.investor_name}</td>
                      <td className="p-2 text-[10px] text-muted-foreground">{d.investor_type}</td>
                      <td className="p-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${d.local_foreign==='FOREIGN'||d.local_foreign==='F'?'bg-blue-500/10 text-blue-400 border border-blue-500/20':'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                          {d.local_foreign==='FOREIGN'||d.local_foreign==='F'?'Foreign':'Local'}
                        </span>
                      </td>
                      <td className="p-2 text-right font-black">{d.percentage.toFixed(2)}%</td>
                      <td className="p-2 text-right text-muted-foreground">{formatShares(d.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 opacity-60">
            <PieChartIcon className="w-8 h-8 text-purple-400 mb-4" />
            <p className="text-sm font-bold">No Ownership Data</p>
          </div>
        )}
      </div>

      {whaleMovement.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-widest">Whale Position Tracking</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-[9px] text-muted-foreground uppercase border-b border-white/[0.05]">
                <th className="p-2 text-left">Investor</th><th className="p-2 text-center">Type</th>
                <th className="p-2 text-right">%</th><th className="p-2 text-right">Shares</th>
                <th className="p-2 text-center">Trend</th><th className="p-2 text-center">Verdict</th>
              </tr></thead>
              <tbody>
                {whaleMovement.map((w: any, i: number) => (
                  <tr key={i} className="border-b border-white/[0.03] tr-hover">
                    <td className="p-2 font-bold text-[10px]">{w.investor_name}</td>
                    <td className="p-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${w.local_foreign==='F'?'bg-blue-500/10 text-blue-400':'bg-emerald-500/10 text-emerald-400'}`}>{w.local_foreign==='F'?'FOREIGN':'LOCAL'}</span></td>
                    <td className="p-2 text-right font-black">{Number(w.latest_percentage).toFixed(2)}%</td>
                    <td className="p-2 text-right text-muted-foreground">{formatShares(w.latest_shares)}</td>
                    <td className="p-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${w.position_trend==='INCREASING'?'bg-emerald-500/10 text-emerald-400':w.position_trend==='DECREASING'?'bg-red-500/10 text-red-400':'bg-blue-500/10 text-blue-400'}`}>{w.position_trend}</span></td>
                    <td className="p-2 text-center text-[9px] font-bold text-purple-400">{w.whale_verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(concentrationIndex || institutionalChange.length > 0) && (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-widest">Concentration & Institutional</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {concentrationIndex && (
              <div>
                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Concentration Index</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { l: 'HHI Score', v: Number(concentrationIndex.hhi_score)?.toFixed(0) || '--',          c: 'text-purple-400' },
                    { l: 'Top 5 %',   v: `${Number(concentrationIndex.top5_pct)?.toFixed(1) || '--'}%`,     c: 'text-purple-400' },
                    { l: 'Top 10 %',  v: `${Number(concentrationIndex.top10_pct)?.toFixed(1) || '--'}%`,    c: 'text-blue-400'   },
                    { l: 'Investors', v: concentrationIndex.total_investor_count || '--',                    c: 'text-cyan-400'   },
                  ].map((m, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                      <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                      <p className={`text-sm font-black mt-1 ${m.c}`}>{m.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                  <span className="text-[10px] font-bold">{concentrationIndex.concentration_label}</span>
                </div>
              </div>
            )}
            {institutionalChange.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Institutional Changes</h4>
                <div className="flex gap-3 mb-3 text-[9px]">
                  <span className="text-emerald-400 font-bold">{institutionalChange.filter((i: any) => i.action==='BUYING').length} buying</span>
                  <span className="text-red-400 font-bold">{institutionalChange.filter((i: any) => i.action==='SELLING').length} selling</span>
                </div>
                <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                  {institutionalChange.slice(0, 15).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate">{item.investor_name}</p>
                        <p className="text-[8px] text-muted-foreground">{String(item.report_date).slice(0, 10)}</p>
                      </div>
                      <span className={`text-[9px] font-black ml-2 shrink-0 px-1.5 py-0.5 rounded ${item.action==='BUYING'?'bg-emerald-500/15 text-emerald-400':item.action==='SELLING'?'bg-red-500/15 text-red-400':'bg-slate-500/15 text-slate-400'}`}>
                        {Number(item.pct_point_change)>=0?'+':''}{Number(item.pct_point_change)?.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
