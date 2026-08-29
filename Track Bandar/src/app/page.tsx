'use client'

import React, { useEffect, useState } from 'react'
import { BandarCard } from '@/components/bandar-card'
import { AnomalyTable } from '@/components/anomaly-table'
import { StockModal } from '@/components/stock-modal'
import { Search, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [fromCache, setFromCache] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/bandar-summary')
      const json = await res.json()
      if (json.success) {
        setItems(json.data)
        setFromCache(json.fromCache)
        setCacheStats(json.cacheStats)
      }
    } catch (err) {
      console.error('Failed to load bandar summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setSelectedSymbol(searchQuery.trim().toUpperCase())
    }
  }

  // Top 4 High Conviction Cards
  const top4 = items.slice(0, 4)

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-400">
              TRACK BANDAR
            </h1>
            <span className="badge-cyan text-xs px-2.5 py-1 rounded-full font-bold">Web v1.0</span>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            Real-time Bandar Inventory, Broker Dominance & Smart Money Tracker (MotherDuck Live Engine)
          </p>
        </div>

        {/* Compute Shield Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800 flex items-center gap-2 text-xs">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Compute Shield:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${fromCache ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {fromCache ? '⚡ CACHE HIT (0 CU)' : '🔄 LIVE DB QUERY'}
            </span>
          </div>

          <button
            onClick={() => loadData()}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition border border-slate-800"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Global Ticker Search Bar */}
      <section className="glass-panel p-4 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ketik kode saham spesifik (misal: AWAN, BEEF, MAPI, CPRO, PNBN)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 pl-11 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-extrabold text-sm rounded-xl hover:opacity-90 transition shadow-lg shadow-cyan-500/20"
          >
            Investigasi Saham
          </button>
        </form>
      </section>

      {/* Top 4 Bandar High Conviction Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Top 4 Saham dengan Akumulasi Bandar & Dominansi Tertinggi
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card p-5 rounded-2xl h-44 animate-pulse bg-slate-900/40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {top4.map((item) => (
              <div key={item.stock_code} onClick={() => setSelectedSymbol(item.stock_code)} className="cursor-pointer">
                {/* Cost basis comes from the broker tape (avg_price weighted by value).
                    It used to be close × 0.96 — an invented 4% discount, which is why
                    every card showed an identical "PnL zone". */}
                <BandarCard
                  stockCode={item.stock_code}
                  currentPrice={Number(item.close ?? 0)}
                  bandarCost={Number(item.bandar_cost ?? 0)}
                  vsCostPct={Number(item.vs_cost_pct ?? 0)}
                  netBn={Number(item.smart_net_bn ?? 0)}
                  upDays={item.up_days}
                  topBroker={item.top_broker}
                  whaleSignal={!!item.whale_signal}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Anomaly & Screener Table */}
      <section>
        {loading ? (
          <div className="glass-panel rounded-2xl p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold">Mengambil data dari MotherDuck DB...</p>
          </div>
        ) : (
          <AnomalyTable items={items} onSelectStock={(symbol) => setSelectedSymbol(symbol)} />
        )}
      </section>

      {/* Deep-Dive Investigation Modal */}
      <StockModal symbol={selectedSymbol} onClose={() => setSelectedSymbol(null)} />
    </main>
  )
}
