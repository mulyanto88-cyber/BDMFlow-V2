'use client'

import React from 'react'
import { formatRupiah } from '@/lib/utils'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'
import { Building2, Eye, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface Props { stockCode: string }

export function BroksumWidget({ stockCode }: Props) {
  const { period } = useTerminalStore()
  const { data } = useStockOverview(stockCode, period)

  const brokerData = data?.brokerData || []
  const brokerConsistency = data?.brokerConsistency || []

  return (
    <div className="space-y-4">
      {brokerData.length > 0 && (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-black uppercase tracking-widest">Broker Dominan · Net 90 Hari</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-emerald-400 font-bold uppercase mb-2 tracking-widest">Akumulator (Net Beli)</p>
              <div className="space-y-1.5">
                {brokerData.filter((b:any)=>Number(b.net_value)>0).sort((a:any,b:any)=>Number(b.net_value)-Number(a.net_value)).map((b:any,i:number)=>(
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.12]">
                    <div className="min-w-0"><p className="text-[11px] font-bold">{b.kode_broker}</p><p className="text-[8px] text-muted-foreground truncate max-w-[150px]">{b.nama_broker}</p></div>
                    <p className="text-[11px] font-black text-emerald-400 shrink-0 ml-2">{formatRupiah(Number(b.net_value))}</p>
                  </div>
                ))}
                {!brokerData.some((b:any)=>Number(b.net_value)>0) && <p className="text-[10px] text-muted-foreground/40 py-2">—</p>}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-red-400 font-bold uppercase mb-2 tracking-widest">Distributor (Net Jual)</p>
              <div className="space-y-1.5">
                {brokerData.filter((b:any)=>Number(b.net_value)<0).sort((a:any,b:any)=>Number(a.net_value)-Number(b.net_value)).map((b:any,i:number)=>(
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/[0.05] border border-red-500/[0.12]">
                    <div className="min-w-0"><p className="text-[11px] font-bold">{b.kode_broker}</p><p className="text-[8px] text-muted-foreground truncate max-w-[150px]">{b.nama_broker}</p></div>
                    <p className="text-[11px] font-black text-red-400 shrink-0 ml-2">{formatRupiah(Number(b.net_value))}</p>
                  </div>
                ))}
                {!brokerData.some((b:any)=>Number(b.net_value)<0) && <p className="text-[10px] text-muted-foreground/40 py-2">—</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {brokerConsistency.length > 0 ? (
        <div className="glass rounded-2xl p-5 border border-white/[0.06]">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-black uppercase tracking-widest">Konsistensi Broker · 30 Hari</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-emerald-400 font-bold uppercase mb-2 tracking-widest">Pembeli Konsisten</p>
              <div className="space-y-1.5">
                {brokerConsistency.filter((b:any)=>b.verdict==='STRONG_BUY'||b.verdict==='CONSISTENT_BUY').map((b:any,i:number)=>(
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.12]">
                    <div className="min-w-0"><p className="text-[10px] font-bold">{b.kode_broker}</p><p className="text-[8px] text-muted-foreground truncate max-w-[140px]">{b.nama_broker}</p></div>
                    <div className="text-right ml-2 shrink-0"><p className="text-[9px] font-bold text-emerald-400">{Number(b.consistency_pct)?.toFixed(0)}% beli</p><p className="text-[8px] text-muted-foreground">{b.days_net_buy}/{b.total_days} hari</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-red-400 font-bold uppercase mb-2 tracking-widest">Penjual Konsisten</p>
              <div className="space-y-1.5">
                {brokerConsistency.filter((b:any)=>b.verdict==='STRONG_SELL'||b.verdict==='CONSISTENT_SELL').map((b:any,i:number)=>(
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/[0.05] border border-red-500/[0.12]">
                    <div className="min-w-0"><p className="text-[10px] font-bold">{b.kode_broker}</p><p className="text-[8px] text-muted-foreground truncate max-w-[140px]">{b.nama_broker}</p></div>
                    <div className="text-right ml-2 shrink-0"><p className="text-[9px] font-bold text-red-400">{Number(b.consistency_pct)?.toFixed(0)}% jual</p><p className="text-[8px] text-muted-foreground">{b.days_net_sell}/{b.total_days} hari</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (!brokerData.length && (
        <div className="glass rounded-2xl p-12 text-center text-muted-foreground/50 text-sm border border-white/[0.06]">Belum ada data broker untuk saham ini.</div>
      ))}

      <div className="text-center">
        <Link href={`/broker-tracker?code=${stockCode}`} prefetch={false} className="inline-flex items-center gap-1.5 text-[11px] text-gold-400 hover:text-gold-300 transition-colors">
          Buka Broker Tracker lengkap <ExternalLink size={12} />
        </Link>
      </div>
    </div>
  )
}
