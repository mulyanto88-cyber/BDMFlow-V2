'use client'

import React from 'react'
import { useKSEITrend } from '@/hooks/use-broker'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line } from 'recharts'

interface Props { stockCode: string }

export function KSEIIntelWidget({ stockCode }: Props) {
  const { data: kseiTrend = [], isLoading } = useKSEITrend(stockCode)

  if (isLoading) return <div className="h-48 shimmer rounded-xl" />

  if (kseiTrend.length === 0) return (
    <div className="glass rounded-2xl p-12 text-center text-muted-foreground/50 text-sm border border-white/[0.06]">Belum ada data KSEI untuk saham ini.</div>
  )

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl border border-white/[0.06] p-4">
        <div className="text-sm font-bold mb-3">Net Smart Money Bulanan (CP+PF+IB) — 12 bulan</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={kseiTrend} margin={{top:4,bottom:4,left:0,right:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)"/>
            <XAxis dataKey="month" tickFormatter={(v: string)=>v?.slice(2,7)} tick={{fontSize:9}}/>
            <YAxis tick={{fontSize:9}}/>
            <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:8,fontSize:11}}
              formatter={(v: number)=>[`${Number(v).toFixed(2)} M`]}/>
            <Bar dataKey="net_smart" name="Net Smart">
              {kseiTrend.map((e: any,i: number)=><Cell key={i} fill={Number(e.net_smart)>=0?'#10b981':'#ef4444'}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl border border-white/[0.06] p-4">
          <div className="text-sm font-bold mb-3">Breakdown Institusi Bulan Terakhir</div>
          {kseiTrend.slice(-1).map((d: any) => (
            <div key={d.month} className="space-y-2">
              {[
                {l:'Corporate (CP)',      v: d.cp_flow},
                {l:'Pension Fund (PF)',   v: d.pf_flow},
                {l:'Investment Bank (IB)',v: d.ib_flow},
                {l:'Retail (ID)',         v: d.retail},
                {l:'Foreign Smart',       v: d.foreign_smart},
              ].map(item => (
                <div key={item.l} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0">
                  <span className="text-muted-foreground">{item.l}</span>
                  <span className={`font-bold ${Number(item.v)>=0?'text-emerald-400':'text-red-400'}`}>
                    {Number(item.v)>=0?'+':''}{Number(item.v||0).toFixed(2)} M
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="glass rounded-2xl border border-white/[0.06] p-4">
          <div className="text-sm font-bold mb-3">Trend Retail vs Smart 3 Bulan</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={kseiTrend.slice(-6)} margin={{top:4,bottom:4,left:0,right:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)"/>
              <XAxis dataKey="month" tickFormatter={(v: string)=>v?.slice(2,7)} tick={{fontSize:9}}/>
              <YAxis tick={{fontSize:9}}/>
              <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:8,fontSize:11}}/>
              <Line dataKey="net_smart" name="Smart Money" stroke="#10b981" strokeWidth={2} dot={false}/>
              <Line dataKey="retail" name="Retail" stroke="#f59e0b" strokeWidth={1.5} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
