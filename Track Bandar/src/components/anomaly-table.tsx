'use client'

import React, { useState } from 'react'
import { Search, Flame, ArrowUpDown, ExternalLink } from 'lucide-react'

// Mirrors /api/bandar-summary. Fields come from the broker tape only — the KSEI
// columns were dropped because that data is monthly and lands weeks late.
interface StockItem {
  stock_code: string
  sector?: string
  close: number
  change_percent: number
  turnover_bn?: number
  /** Net value of the FOREIGN + LOCAL_INST cohort over 5 trading days, in miliar. */
  smart_net_bn?: number
  /** How many of those 5 days the cohort was a net buyer. */
  up_days?: number
  /** Value-weighted price that cohort actually paid — their cost basis. */
  bandar_cost?: number
  /** Current price vs that cost. Negative = they are still underwater. */
  vs_cost_pct?: number
  whale_signal?: boolean
  konsisten?: boolean
  bandar_nyangkut?: boolean
  /** Broker with the highest share × aggression on the latest day — the one pushing price. */
  pusher?: string
  pusher_name?: string
  /** That broker's share of the day's traded value. */
  pusher_share_pct?: number
  /** How far above the day's VWAP they transacted. Positive = paying up. */
  pusher_agresi_pct?: number
  pusher_tekanan?: number
  /** In the top pressure quintile, which measured +2.45pp edge over 20 days. */
  pusher_kuat?: boolean
  /** BEI-style Price Impact Ratio: price move per unit of float turnover. */
  pir?: number
  velocity_pct?: number
  zona_risiko?: 'float_tipis' | 'churn_tinggi' | 'wajar' | 'tidak_diketahui'
}

// PIR is a risk label, never a signal filter: the bandar edge held up across all
// four PIR quartiles, so a high reading means "handle with care", not "avoid".
const RISK_LABEL: Record<string, { text: string; cls: string; title: string }> = {
  float_tipis: {
    text: 'Float tipis',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    title: 'Kurang dari 0,5% float berpindah per hari — harga mudah digerakkan sedikit uang (profil HSC versi BEI)',
  },
  churn_tinggi: {
    text: 'Churn tinggi',
    cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    title: 'Lebih dari 8% float berpindah setiap hari — perputaran spekulatif, return historis terburuk',
  },
}

interface AnomalyTableProps {
  items: StockItem[]
  onSelectStock: (symbol: string) => void
}

export const AnomalyTable: React.FC<AnomalyTableProps> = ({ items, onSelectStock }) => {
  const [searchTerm, setSearchTerm] = useState('')
  // Filter by setup quality rather than raw AOV: these are the combinations the
  // backtest actually separated, so the filter matches what was measured.
  const [setup, setSetup] = useState<'all' | 'nyangkut' | 'konsisten' | 'both'>('all')

  const filtered = items.filter((item) => {
    const matchesSearch = item.stock_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sector && item.sector.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesSetup =
      setup === 'all' ? true :
      setup === 'nyangkut' ? !!item.bandar_nyangkut :
      setup === 'konsisten' ? !!item.konsisten :
      (!!item.bandar_nyangkut && !!item.konsisten)
    return matchesSearch && matchesSetup
  })

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Jejak Akumulasi Bandar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Broker asing &amp; institusi lokal, 5 hari bursa terakhir — beserta harga rata-rata
            yang mereka bayar. Tanpa KSEI: datanya bulanan, tidak relevan untuk swing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode saham..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900/80 text-sm text-slate-200 placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <select
            value={setup}
            onChange={(e) => setSetup(e.target.value as typeof setup)}
            className="bg-slate-900/80 text-xs text-slate-200 py-2.5 px-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 cursor-pointer"
            aria-label="Filter setup"
          >
            <option value="all">Semua setup</option>
            <option value="nyangkut">Bandar belum untung</option>
            <option value="konsisten">Beli konsisten (4–5 hari)</option>
            <option value="both">Keduanya</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-900/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-bold">Kode Saham</th>
              <th className="py-3.5 px-4 font-bold">Harga Close</th>
              <th className="py-3.5 px-4 font-bold">Change (%)</th>
              <th className="py-3.5 px-4 font-bold">Cost Bandar</th>
              <th className="py-3.5 px-4 font-bold">Posisi Bandar</th>
              <th className="py-3.5 px-4 font-bold">Net 5H</th>
              <th className="py-3.5 px-4 font-bold">Pendorong Harga</th>
              <th className="py-3.5 px-4 font-bold">Risiko</th>
              <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-500">
                  Tidak ada data yang cocok dengan kriteria filter
                </td>
              </tr>
            ) : (
              filtered.map((stock) => {
                // Every numeric field is optional on the wire, so nothing here
                // calls .toFixed() on a value that might be undefined.
                const chg = Number(stock.change_percent ?? 0)
                const isPositive = chg >= 0
                const vsCost = stock.vs_cost_pct == null ? null : Number(stock.vs_cost_pct)
                const netBn = Number(stock.smart_net_bn ?? 0)
                const risk = stock.zona_risiko ? RISK_LABEL[stock.zona_risiko] : undefined
                return (
                  <tr
                    key={stock.stock_code}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                    onClick={() => onSelectStock(stock.stock_code)}
                  >
                    <td className="py-3.5 px-4 font-black text-cyan-400 flex items-center gap-2">
                      <span>{stock.stock_code}</span>
                      {stock.whale_signal && (
                        <span className="badge-gold text-[10px] px-1.5 py-0.5 rounded font-bold">WHALE</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-100">
                      Rp {Number(stock.close ?? 0).toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 font-bold">
                      <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                        {isPositive ? '+' : ''}{chg.toFixed(2)}%
                      </span>
                    </td>

                    {/* What the smart cohort actually paid, from broker avg_price. */}
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      {stock.bandar_cost == null
                        ? '—'
                        : `Rp ${Number(stock.bandar_cost).toLocaleString('id-ID')}`}
                    </td>

                    {/* Below cost was the strongest setup in the backtest: the cohort
                        is still underwater, so they have reason to defend the price. */}
                    <td className="py-3.5 px-4 font-bold">
                      {vsCost == null ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                            vsCost < 0
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                          title={vsCost < 0 ? 'Bandar masih di bawah harga rata-ratanya' : 'Bandar sudah untung'}
                        >
                          {vsCost > 0 ? '+' : ''}{vsCost.toFixed(1)}%
                          {vsCost < 0 ? ' nyangkut' : ' untung'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold">
                      <span className={netBn >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {netBn >= 0 ? '+' : ''}{netBn.toFixed(1)} M
                      </span>
                      {stock.konsisten && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                          {stock.up_days}/5
                        </span>
                      )}
                    </td>

                    {/* Naming the broker is the whole point of "menapaki jejak bandar".
                        Share × aggression, not net value: the top net buyer can be
                        sitting passively on the bid while someone smaller lifts. */}
                    <td className="py-3.5 px-4 text-xs">
                      {stock.pusher ? (
                        <span
                          title={`${stock.pusher_name ?? stock.pusher} — menguasai ${stock.pusher_share_pct}% nilai transaksi hari ini, bertransaksi ${Number(stock.pusher_agresi_pct ?? 0) >= 0 ? 'di atas' : 'di bawah'} VWAP`}
                          className="flex items-center gap-1.5"
                        >
                          <span className={`font-black ${stock.pusher_kuat ? 'text-cyan-300' : 'text-slate-300'}`}>
                            {stock.pusher}
                          </span>
                          <span className="text-slate-500">{stock.pusher_share_pct}%</span>
                          <span className={Number(stock.pusher_agresi_pct ?? 0) >= 0 ? 'text-emerald-400' : 'text-slate-500'}>
                            {Number(stock.pusher_agresi_pct ?? 0) >= 0 ? '+' : ''}
                            {Number(stock.pusher_agresi_pct ?? 0).toFixed(1)}%
                          </span>
                          {stock.pusher_kuat && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                              KUAT
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      {risk ? (
                        <span
                          className={`px-2 py-0.5 rounded border font-bold text-[10px] ${risk.cls}`}
                          title={`${risk.title}. PIR ${stock.pir ?? '—'}, velocity ${stock.velocity_pct ?? '—'}%/hari.`}
                        >
                          {risk.text}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">
                          {stock.zona_risiko === 'wajar' ? 'wajar' : '—'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectStock(stock.stock_code)
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-900 transition text-slate-300"
                        title="Deep-Dive Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
