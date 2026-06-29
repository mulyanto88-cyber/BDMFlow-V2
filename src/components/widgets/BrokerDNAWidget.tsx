'use client'

import React from 'react'
import { formatRupiah } from '@/lib/utils'
import { useBrokerDNA } from '@/hooks/use-broker'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

function netColor(v: number) {
  if (v > 5)  return 'text-emerald-400'
  if (v > 0)  return 'text-emerald-300/70'
  if (v < -5) return 'text-red-400'
  if (v < 0)  return 'text-red-300/70'
  return 'text-slate-400'
}

interface Props { stockCode: string }

export function BrokerDNAWidget({ stockCode }: Props) {
  const { data, isLoading } = useBrokerDNA(stockCode)

  if (isLoading) return <div className="h-48 shimmer rounded-xl" />

  const { rolling: brokerRolling, topBuyers: brokerBuyers, topSellers: brokerSellers } = data || {}

  return (
    <div className="space-y-4">
      {brokerRolling ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Foreign Broker', net1d: brokerRolling.fg_1d,     net7d: brokerRolling.fg_7d,   net30d: brokerRolling.fg_30d   },
              { label: 'Local Inst',     net1d: brokerRolling.inst_1d,   net7d: brokerRolling.inst_7d, net30d: brokerRolling.inst_30d },
              { label: 'Retail',         net1d: brokerRolling.retail_1d, net7d: brokerRolling.retail_7d, net30d: null                 },
            ].map(c => (
              <div key={c.label} className="glass rounded-xl p-3 border border-white/[0.06]">
                <div className="text-xs text-muted-foreground mb-2 font-bold">{c.label}</div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[{l:'1D',v:c.net1d},{l:'7D',v:c.net7d},{l:'30D',v:c.net30d}].map(p => (
                    <div key={p.l}>
                      <div className={`text-sm font-semibold ${p.v != null ? netColor(Number(p.v)) : 'text-muted-foreground'}`}>
                        {p.v != null ? `${Number(p.v) >= 0 ? '+' : ''}${Number(p.v).toFixed(1)} M` : '—'}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{p.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {brokerRolling.prime_7d != null && (
            <div className={`p-3 rounded-xl border text-sm ${Number(brokerRolling.prime_7d) > 0 ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'glass border-white/[0.06] text-muted-foreground'}`}>
              ⭐ Prime Broker Net 7d (JP Morgan, UBS, CLSA, HSBC, Macquarie):
              <span className={`ml-2 font-semibold ${netColor(Number(brokerRolling.prime_7d))}`}>
                {Number(brokerRolling.prime_7d) >= 0 ? '+' : ''}{Number(brokerRolling.prime_7d).toFixed(2)} M
              </span>
            </div>
          )}
        </>
      ) : (
        <div className="h-24 shimmer rounded-xl" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-xs font-bold text-emerald-400">Top Buyers (7D)</div>
          <table className="w-full text-xs">
            <tbody>
              {(brokerBuyers || []).map((b: any) => (
                <tr key={b.broker_code} className="border-b border-white/[0.03] tr-hover">
                  <td className="px-3 py-2">
                    <div className="font-mono font-semibold">{b.broker_code}</div>
                    <div className="text-muted-foreground">{b.broker_name?.slice(0,25)}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${b.category==='FOREIGN'?'bg-sky-500/20 text-sky-300':b.category==='LOCAL_INST'?'bg-emerald-500/20 text-emerald-300':'bg-white/[0.05] text-muted-foreground'}`}>
                      {b.category?.split('_').pop()}
                    </span>
                    {b.is_prime && <span className="ml-1 text-amber-400">⭐</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-400 font-semibold">+{Number(b.net_miliar).toFixed(2)} M</td>
                </tr>
              ))}
              {(!brokerBuyers || brokerBuyers.length === 0) && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-xs font-bold text-red-400">Top Sellers (7D)</div>
          <table className="w-full text-xs">
            <tbody>
              {(brokerSellers || []).map((b: any) => (
                <tr key={b.broker_code} className="border-b border-white/[0.03] tr-hover">
                  <td className="px-3 py-2">
                    <div className="font-mono font-semibold">{b.broker_code}</div>
                    <div className="text-muted-foreground">{b.broker_name?.slice(0,25)}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${b.category==='FOREIGN'?'bg-sky-500/20 text-sky-300':b.category==='LOCAL_INST'?'bg-emerald-500/20 text-emerald-300':'bg-white/[0.05] text-muted-foreground'}`}>
                      {b.category?.split('_').pop()}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-red-400 font-semibold">{Number(b.net_miliar).toFixed(2)} M</td>
                </tr>
              ))}
              {(!brokerSellers || brokerSellers.length === 0) && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
