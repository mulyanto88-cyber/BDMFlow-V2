'use client'

import React, { useEffect, useState } from 'react'
import { X, Target, ShieldCheck, Activity, Layers, Database } from 'lucide-react'

interface StockModalProps {
  symbol: string | null
  onClose: () => void
}

export const StockModal: React.FC<StockModalProps> = ({ symbol, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!symbol) return

    async function fetchDetail() {
      setLoading(true)
      try {
        const res = await fetch(`/api/stock-detail?symbol=${symbol}`)
        const json = await res.json()
        if (json.success) {
          setData(json.data)
        }
      } catch (err) {
        console.error('Fetch detail error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [symbol])

  if (!symbol) return null

  const stock = data?.stock
  const brokerAccum = data?.brokerAccum
  const activities = data?.activities || []
  const estBandarAvgCost = data?.estBandarAvgCost || 0
  const bandarPnlPct = data?.bandarPnlPct || 0

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-3xl rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <Activity className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Mengambil Data Deep-Dive MotherDuck untuk {symbol}...</p>
          </div>
        ) : !stock ? (
          <div className="py-12 text-center text-slate-400">Data tidak ditemukan untuk {symbol}</div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-black text-cyan-400">{stock.stock_code}</h2>
              <span className="text-sm text-slate-400">{stock.company_name}</span>
              {stock.sector && (
                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">
                  {stock.sector}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-cyan-400" /> Harga Terbaru
                </span>
                <span className="text-xl font-extrabold text-slate-100 block mt-1">
                  Rp {stock.close.toLocaleString('id-ID')}
                </span>
                <span className={`text-xs font-bold ${stock.change_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent.toFixed(2)}%
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" /> Estimasi Modal Bandar
                </span>
                <span className="text-xl font-extrabold text-amber-400 block mt-1">
                  Rp {Math.round(estBandarAvgCost).toLocaleString('id-ID')}
                </span>
                <span className={`text-xs font-bold ${bandarPnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Bandar Zone: {bandarPnlPct >= 0 ? '+' : ''}{bandarPnlPct}%
                </span>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" /> AOV Ratio 30D
                </span>
                <span className="text-xl font-extrabold text-purple-400 block mt-1">
                  {(stock.aov_max_30d || 0).toFixed(2)}x
                </span>
                <span className="text-xs text-slate-400">
                  Radar Score: <strong className="text-slate-200">{stock.radar_score || 0}</strong>
                </span>
              </div>
            </div>

            {/* Broker Activity Breakdown */}
            <div className="mb-6">
              <h3 className="text-sm font-extrabold text-slate-200 mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" /> 20 Aktivitas Transaksi Broker Terakhir
              </h3>
              <div className="overflow-x-auto max-h-56">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Kode Broker</th>
                      <th className="py-2.5 px-3">Side</th>
                      <th className="py-2.5 px-3">Value</th>
                      <th className="py-2.5 px-3">Avg Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {activities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500">
                          Tidak ada log aktivitas broker mentah
                        </td>
                      </tr>
                    ) : (
                      activities.map((act: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/50">
                          <td className="py-2 px-3">{new Date(act.date).toLocaleDateString('id-ID')}</td>
                          <td className="py-2 px-3 font-bold text-cyan-400">{act.broker_code}</td>
                          <td className="py-2 px-3 font-bold">
                            <span className={act.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}>
                              {act.side}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            Rp {(Number(act.value) / 1e6).toFixed(1)} M
                          </td>
                          <td className="py-2 px-3 font-bold text-amber-400">
                            Rp {Math.round(act.avg_price || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
