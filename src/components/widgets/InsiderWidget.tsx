'use client'

import React from 'react'
import { useInsiderData } from '@/hooks/use-broker'

interface Props { stockCode: string }

export function InsiderWidget({ stockCode }: Props) {
  const { data, isLoading } = useInsiderData(stockCode)

  if (isLoading) return <div className="h-48 shimmer rounded-xl" />

  const insiderFeed = data?.feed || []
  const insiderScore = data?.score

  return (
    <div className="space-y-4">
      {insiderScore && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Conviction Score', v: insiderScore.conviction_score, c: Number(insiderScore.conviction_score)>=15?'text-emerald-400':Number(insiderScore.conviction_score)<0?'text-red-400':'text-amber-400'},
            {l:'Internal Buy',     v: insiderScore.internal_buy,     c: 'text-emerald-400'},
            {l:'Internal Sell',    v: insiderScore.internal_sell,    c: 'text-red-400'},
          ].map(k => (
            <div key={k.l} className="glass rounded-xl p-3 border border-white/[0.06] text-center metric-card">
              <div className={`text-2xl font-black ${k.c}`}>{k.v}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.l}</div>
            </div>
          ))}
        </div>
      )}
      <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-xs font-bold text-gold-400">Transaksi Insider (Komisaris/Direksi/Pengendali)</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-3 py-2">Tanggal</th>
                <th className="text-left px-3 py-2">Nama</th>
                <th className="text-left px-3 py-2">Role</th>
                <th className="text-center px-3 py-2">Aksi</th>
                <th className="text-right px-3 py-2">% Change</th>
                <th className="text-right px-3 py-2 hidden md:table-cell">Nilai Est.</th>
              </tr>
            </thead>
            <tbody>
              {insiderFeed.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Belum ada data insider untuk saham ini</td></tr>
              ) : insiderFeed.map((ins: any, i:number) => (
                <tr key={i} className="border-b border-white/[0.03] tr-hover transition-colors">
                  <td className="px-3 py-2 text-muted-foreground">{String(ins.transaction_date||'').slice(0,10)}</td>
                  <td className="px-3 py-2 truncate max-w-[140px] font-medium">{ins.insider_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{ins.insider_type}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ins.action_type==='BUY'?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20':'bg-red-500/20 text-red-300 border border-red-500/20'}`}>{ins.action_type}</span>
                  </td>
                  <td className={`px-3 py-2 text-right font-bold ${Number(ins.pct_change)>=0?'text-emerald-400':'text-red-400'}`}>
                    {Number(ins.pct_change)>=0?'+':''}{Number(ins.pct_change).toFixed(3)}%
                  </td>
                  <td className="px-3 py-2 text-right hidden md:table-cell text-muted-foreground">
                    {ins.est_value_miliar ? `${Number(ins.est_value_miliar).toFixed(2)} M` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
