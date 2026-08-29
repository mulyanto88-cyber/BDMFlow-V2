'use client'

import React from 'react'
import { formatRupiah } from '@/lib/utils'
import { Building2, TrendingUp, TrendingDown, Percent, ShieldCheck, Sparkles, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react'

export interface DominantBrokerRow {
  role: 'BUYER' | 'SELLER'
  p_code: '1W' | '1M' | '3M' | '6M'
  p_order: number
  broker_code: string
  broker_name: string
  gross_val: number
  net_val: number
  total_market_val: number
  avg_price: number | null
  dominance_pct: number | null
  pnl_pct: number | null
}

interface Props {
  data: DominantBrokerRow[]
  stockCode: string
  currentPrice?: number
}

const PERIODS: Array<'1W' | '1M' | '3M' | '6M'> = ['1W', '1M', '3M', '6M']

function formatVal(val: number | null | undefined): string {
  if (val == null || isNaN(val)) return '—'
  const abs = Math.abs(val)
  if (abs >= 1e12) return `${(val / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${(val / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(val / 1e6).toFixed(2)}M`
  return val.toLocaleString('id-ID')
}

export function DominantBrokerWidget({ data = [], stockCode, currentPrice }: Props) {
  if (!data || data.length === 0) {
    return null
  }

  const buyers = data.filter((d) => d.role === 'BUYER')
  const sellers = data.filter((d) => d.role === 'SELLER')

  const buyerMap: Record<string, DominantBrokerRow> = {}
  buyers.forEach((b) => {
    buyerMap[b.p_code] = b
  })

  const sellerMap: Record<string, DominantBrokerRow> = {}
  sellers.forEach((s) => {
    sellerMap[s.p_code] = s
  })

  // Insight narrative generator
  const b1m = buyerMap['1M'] || buyerMap['1W']
  const pnl = b1m?.pnl_pct

  return (
    <div className="rounded-3xl p-5 sm:p-6 border border-border/40 bg-gradient-to-b from-surface-1/90 via-surface-1/50 to-surface-2/40 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                Analisis Broker Dominan
              </h2>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Multi-Periode
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Peta bandar akumulator &amp; distributor terbesar di saham <span className="font-bold text-foreground">{stockCode}</span>
            </p>
          </div>
        </div>

        {currentPrice && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-2 border border-line-2 self-start sm:self-auto text-xs font-mono">
            <span className="text-[10px] uppercase text-muted-foreground">Harga Terakhir:</span>
            <span className="font-black text-foreground">Rp {currentPrice.toLocaleString('id-ID')}</span>
          </div>
        )}
      </div>

      {/* 1. PEMBELI DOMINAN (TOP BUYER TABLE) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
          <h3 className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            Pembeli Dominan (Top Accumulator)
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line-2 bg-card shadow-xs">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-line-2 bg-slate-100/90 dark:bg-surface-2/70 text-[11px] font-black uppercase text-slate-700 dark:text-muted-foreground">
                <th className="py-3 px-4 min-w-[130px]">Metrik</th>
                {PERIODS.map((p) => (
                  <th key={p} className="py-3 px-3 text-center min-w-[90px] tracking-wider text-slate-900 dark:text-foreground">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2 tabular-nums">
              {/* Row 1: Kode & Nama Broker */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-muted-foreground">Kode Broker</td>
                {PERIODS.map((p) => {
                  const b = buyerMap[p]
                  return (
                    <td key={p} className="py-3 px-3 text-center">
                      {b?.broker_code ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                            {b.broker_code}
                          </span>
                          <span className="text-[9px] font-medium text-slate-500 dark:text-muted-foreground/70 truncate max-w-[85px] mt-0.5">
                            {b.broker_name || '—'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Row 2: Nilai Beli Kotor */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Nilai Beli</td>
                {PERIODS.map((p) => (
                  <td key={p} className="py-2.5 px-3 text-center text-foreground font-semibold">
                    {formatVal(buyerMap[p]?.gross_val)}
                  </td>
                ))}
              </tr>

              {/* Row 3: Nilai Beli Bersih */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Nilai Beli Bersih</td>
                {PERIODS.map((p) => {
                  const val = buyerMap[p]?.net_val
                  return (
                    <td key={p} className="py-2.5 px-3 text-center font-black text-emerald-700 dark:text-emerald-400">
                      {val != null ? `+${formatVal(val)}` : '—'}
                    </td>
                  )
                })}
              </tr>

              {/* Row 4: Total Nilai Pasar */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Total Nilai Pasar</td>
                {PERIODS.map((p) => (
                  <td key={p} className="py-2.5 px-3 text-center text-slate-500 dark:text-muted-foreground/80 font-medium">
                    {formatVal(buyerMap[p]?.total_market_val)}
                  </td>
                ))}
              </tr>

              {/* Row 5: Harga Beli Rata-rata */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Harga Beli Rata-rata</td>
                {PERIODS.map((p) => {
                  const avg = buyerMap[p]?.avg_price
                  return (
                    <td key={p} className="py-2.5 px-3 text-center font-bold text-foreground">
                      {avg ? `${avg.toFixed(2)}` : '—'}
                    </td>
                  )
                })}
              </tr>

              {/* Row 6: Estimasi Laba/Rugi % */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors bg-slate-50/50 dark:bg-surface-1/40">
                <td className="py-3 px-4 font-bold text-foreground flex items-center gap-1.5">
                  <span>Estimasi Laba/Rugi</span>
                  <Info className="w-3 h-3 text-muted-foreground/60" />
                </td>
                {PERIODS.map((p) => {
                  const pnl = buyerMap[p]?.pnl_pct
                  if (pnl == null || isNaN(pnl)) return <td key={p} className="py-3 px-3 text-center text-muted-foreground/40">—</td>
                  const isProfit = pnl >= 0
                  return (
                    <td key={p} className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${
                          isProfit
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                            : 'bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30'
                        }`}
                      >
                        {isProfit ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {isProfit ? `+${pnl.toFixed(0)}%` : `${pnl.toFixed(0)}%`}
                      </span>
                    </td>
                  )
                })}
              </tr>

              {/* Row 7: Dominasi % */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Dominasi (%)</td>
                {PERIODS.map((p) => {
                  const dom = buyerMap[p]?.dominance_pct
                  return (
                    <td key={p} className="py-2.5 px-3 text-center font-black text-amber-800 dark:text-amber-400">
                      {dom != null ? `${dom.toFixed(0)}%` : '—'}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. PENJUAL DOMINAN (TOP SELLER TABLE) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
          <h3 className="text-xs font-black uppercase tracking-widest text-rose-700 dark:text-rose-400">
            Penjual Dominan (Top Distributor)
          </h3>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-line-2 bg-card shadow-xs">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-line-2 bg-slate-100/90 dark:bg-surface-2/70 text-[11px] font-black uppercase text-slate-700 dark:text-muted-foreground">
                <th className="py-3 px-4 min-w-[130px]">Metrik</th>
                {PERIODS.map((p) => (
                  <th key={p} className="py-3 px-3 text-center min-w-[90px] tracking-wider text-slate-900 dark:text-foreground">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2 tabular-nums">
              {/* Row 1: Kode & Nama Broker */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-700 dark:text-muted-foreground">Kode Broker</td>
                {PERIODS.map((p) => {
                  const s = sellerMap[p]
                  return (
                    <td key={p} className="py-3 px-3 text-center">
                      {s?.broker_code ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-900 border border-slate-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30">
                            {s.broker_code}
                          </span>
                          <span className="text-[9px] font-medium text-slate-500 dark:text-muted-foreground/70 truncate max-w-[85px] mt-0.5">
                            {s.broker_name || '—'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>

              {/* Row 2: Nilai Jual Kotor */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Nilai Jual</td>
                {PERIODS.map((p) => (
                  <td key={p} className="py-2.5 px-3 text-center text-foreground font-semibold">
                    {formatVal(sellerMap[p]?.gross_val)}
                  </td>
                ))}
              </tr>

              {/* Row 3: Nilai Jual Bersih */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Nilai Jual Bersih</td>
                {PERIODS.map((p) => {
                  const val = sellerMap[p]?.net_val
                  return (
                    <td key={p} className="py-2.5 px-3 text-center font-black text-rose-700 dark:text-rose-400">
                      {val != null ? `-${formatVal(Math.abs(val))}` : '—'}
                    </td>
                  )
                })}
              </tr>

              {/* Row 4: Total Nilai Pasar */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Total Nilai Pasar</td>
                {PERIODS.map((p) => (
                  <td key={p} className="py-2.5 px-3 text-center text-slate-500 dark:text-muted-foreground/80 font-medium">
                    {formatVal(sellerMap[p]?.total_market_val)}
                  </td>
                ))}
              </tr>

              {/* Row 5: Harga Jual Rata-rata */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Harga Jual Rata-rata</td>
                {PERIODS.map((p) => {
                  const avg = sellerMap[p]?.avg_price
                  return (
                    <td key={p} className="py-2.5 px-3 text-center font-bold text-foreground">
                      {avg ? `${avg.toFixed(2)}` : '—'}
                    </td>
                  )
                })}
              </tr>

              {/* Row 6: Dominasi % */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-surface-2/30 transition-colors">
                <td className="py-2.5 px-4 text-slate-600 dark:text-muted-foreground">Dominasi (%)</td>
                {PERIODS.map((p) => {
                  const dom = sellerMap[p]?.dominance_pct
                  return (
                    <td key={p} className="py-2.5 px-3 text-center font-black text-rose-700 dark:text-rose-400">
                      {dom != null ? `${dom.toFixed(0)}%` : '—'}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. INSIGHT FOOTER NARRATIVE */}
      {b1m && (
        <div className="p-3.5 rounded-2xl bg-slate-100/90 dark:bg-surface-2/70 border border-line-2 flex items-start gap-3 text-xs leading-relaxed text-slate-600 dark:text-muted-foreground">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 dark:text-foreground">Insight Bandar: </span>
            Dalam periode 1 Bulan terakhir, broker <strong className="text-amber-700 dark:text-amber-400">{b1m.broker_code} ({b1m.broker_name || 'Bandar Utama'})</strong> memegang akumulasi beli terbesar senilai <strong className="text-slate-900 dark:text-foreground">{formatVal(b1m.gross_val)}</strong> dengan harga modal rata-rata <strong className="text-slate-900 dark:text-foreground">Rp {b1m.avg_price?.toFixed(2)}</strong> (
            {pnl != null ? (
              <span className={pnl >= 0 ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-rose-700 dark:text-rose-400 font-bold'}>
                {pnl >= 0 ? `Floating Profit +${pnl.toFixed(0)}%` : `Floating Loss ${pnl.toFixed(0)}%`}
              </span>
            ) : null}
            ).
          </div>
        </div>
      )}
    </div>
  )
}
