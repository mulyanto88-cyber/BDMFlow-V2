'use client'

import React, { useMemo } from 'react'
import { formatRupiah } from '@/lib/utils'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'
import { Globe, BarChart as BarChartIcon, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

interface Props { stockCode: string }

export function ForeignFlowWidget({ stockCode }: Props) {
  const { period } = useTerminalStore()
  const { data } = useStockOverview(stockCode, period)

  const stockData = data?.stockData
  const foreignDivergence = data?.foreignDivergence
  const foreignFlowTrend = data?.foreignFlowTrend || []

  const flow7d  = useMemo(() => foreignFlowTrend.slice(-7).reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const flow30d = useMemo(() => foreignFlowTrend.slice(-30).reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const flow60d = useMemo(() => foreignFlowTrend.reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-4 h-4 text-teal-400" />
          <h2 className="text-sm font-black uppercase tracking-widest">Net Foreign — Multi Periode</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { l: '1D', v: Number(stockData?.net_foreign_value) || 0 },
            { l: '7D', v: flow7d }, { l: '30D', v: flow30d }, { l: '60D', v: flow60d },
          ].map(p => (
            <div key={p.l} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
              <p className="text-[9px] text-muted-foreground uppercase">{p.l}</p>
              <p className={`text-sm font-black mt-1 ${p.v>=0?'text-emerald-400':'text-red-400'}`}>{formatRupiah(p.v)}</p>
            </div>
          ))}
        </div>
      </div>

      {foreignDivergence && (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-black uppercase tracking-widest">Divergensi Harga vs Foreign · 30D</h2>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
              {String(foreignDivergence.divergence_type||'NEUTRAL').replace(/_/g,' ')} · {foreignDivergence.signal_strength}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { l:'Foreign 30D', v: formatRupiah(Number(foreignDivergence.foreign_30d_net)||0), c:(Number(foreignDivergence.foreign_30d_net)||0)>=0?'text-emerald-400':'text-red-400' },
              { l:'Harga 30D', v:`${Number(foreignDivergence.price_chg_30d)>=0?'+':''}${Number(foreignDivergence.price_chg_30d||0).toFixed(2)}%`, c:Number(foreignDivergence.price_chg_30d)>=0?'text-emerald-400':'text-red-400' },
              { l:'Harga 1D', v:`${Number(foreignDivergence.price_chg_pct)>=0?'+':''}${Number(foreignDivergence.price_chg_pct||0).toFixed(2)}%`, c:Number(foreignDivergence.price_chg_pct)>=0?'text-emerald-400':'text-red-400' },
            ].map(m => (
              <div key={m.l} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                <p className={`text-sm font-black mt-1 ${m.c}`}>{m.v}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-xl bg-teal-500/[0.05] border border-teal-500/15 text-[11px] text-teal-200/80 flex items-start gap-2">
            <span>💡</span><span>{foreignDivergence.interpretation}</span>
          </div>
        </div>
      )}

      {foreignFlowTrend.length > 0 ? (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <BarChartIcon className="w-4 h-4 text-teal-400" />
            <h2 className="text-sm font-black uppercase tracking-widest">Net Foreign Harian · 60 Hari</h2>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={foreignFlowTrend.map((d:any)=>({date:String(d.trading_date).slice(5), net:Number(d.net_foreign_value)}))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.06}/>
                <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:9}} interval={Math.floor(foreignFlowTrend.length/8)}/>
                <YAxis tick={{fill:'#64748b',fontSize:9}} tickFormatter={(v: any)=>formatRupiah(v)} width={72}/>
                <Tooltip formatter={(v:any)=>formatRupiah(Number(v))} contentStyle={{background:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:10,fontSize:11}}/>
                <Bar dataKey="net" radius={[2,2,0,0]}>
                  {foreignFlowTrend.map((d:any,i:number)=><Cell key={i} fill={Number(d.net_foreign_value)>=0?'#22c55e':'#ef4444'} opacity={0.75}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground/50 text-sm border border-white/[0.06]">Belum ada data aliran foreign untuk saham ini.</div>
      )}

      <div className="text-center">
        <Link href={`/foreign-flow?code=${stockCode}`} prefetch={false} className="inline-flex items-center gap-1.5 text-[11px] text-gold-400 hover:text-gold-300 transition-colors">
          Buka Foreign Flow Intelligence lengkap <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}
