'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  PieChart, Filter, Search, ArrowUpDown, ChevronRight, ShieldCheck,
  TrendingUp, DollarSign, Percent, Scale, RefreshCw, Zap, Download,
  CheckCircle2, Sparkles, Building2, Eye, HelpCircle, Layers
} from 'lucide-react'

interface FundamentalStock {
  stock_code: string
  company_name: string
  sector: string
  close: number
  change_percent: number
  whale_signal: boolean
  net_foreign_value: number
  market_cap_b: number | null
  enterprise_value_b: number | null
  shares_outstanding_b: number | null
  free_float_pct: number | null
  pe_ratio_ttm: number | null
  pe_ratio_annualized: number | null
  forward_pe: number | null
  pbv_ratio: number | null
  ps_ratio: number | null
  ev_ebitda: number | null
  peg_ratio: number | null
  earnings_yield_pct: number | null
  p_fcf_ratio: number | null
  eps_ttm: number | null
  bvps: number | null
  roe_ttm_pct: number | null
  roa_ttm_pct: number | null
  roce_ttm_pct: number | null
  gpm_quarter_pct: number | null
  opm_quarter_pct: number | null
  npm_quarter_pct: number | null
  revenue_growth_yoy_pct: number | null
  net_income_growth_yoy: number | null
  debt_to_equity: number | null
  current_ratio: number | null
  quick_ratio: number | null
  interest_coverage: number | null
  piotroski_f_score: number | null
  altman_z_score: number | null
  revenue_ttm_b: number | null
  net_income_ttm_b: number | null
  cash_quarter_b: number | null
  total_assets_b: number | null
  total_equity_b: number | null
  free_cash_flow_ttm_b: number | null
  period_latest: string | null
  updated_at: string | null
}

const PRESETS = [
  { id: 'all',          label: 'Semua Emiten',           icon: Layers,      desc: 'Seluruh saham terdaftar dengan data fundamental' },
  { id: 'undervalue',   label: '💎 Undervalue Gems',     icon: Scale,       desc: 'PBV ≤ 1.5, PER ≤ 12x, ROE ≥ 8%' },
  { id: 'high_growth',  label: '🚀 High Growth Leaders', icon: TrendingUp,  desc: 'Laba Bersih YoY ≥ 20%, ROE ≥ 12%' },
  { id: 'quality',      label: '🛡️ Quality Compounder',  icon: ShieldCheck, desc: 'Piotroski ≥ 6, DER ≤ 1.0, ROE ≥ 10%' },
  { id: 'fcf_rich',     label: '💰 Cash & FCF Rich',     icon: DollarSign,  desc: 'Free Cash Flow Positif, P/FCF ≤ 15x' },
  { id: 'hybrid_whale', label: '🐳 Hybrid: Whale + Funda', icon: Zap,       desc: 'Valuasi Wajar (PER ≤ 20x) + Sedang Diakumulasi Paus' },
]

function fmtVal(num: number | null | undefined, suffix = '', decimals = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '—'
  return `${num.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
}

function fmtBillion(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '—'
  const abs = Math.abs(num)
  if (abs >= 1000) {
    return `Rp ${(num / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} T`
  }
  return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} M`
}

export default function FundamentalScreenerPage() {
  const [data, setData] = useState<FundamentalStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preset, setPreset] = useState('all')

  // Search & Filters
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('ALL')
  const [maxPer, setMaxPer] = useState<number | ''>('')
  const [maxPbv, setMaxPbv] = useState<number | ''>('')
  const [minRoe, setMinRoe] = useState<number | ''>('')
  const [maxDer, setMaxDer] = useState<number | ''>('')
  const [minPiotroski, setMinPiotroski] = useState<number | ''>('')

  // Sorting
  const [sortCol, setSortCol] = useState<keyof FundamentalStock>('market_cap_b')
  const [sortAsc, setSortAsc] = useState(false)

  const fetchData = async (selectedPreset: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/screener-fundamental?preset=${selectedPreset}`)
      if (!res.ok) throw new Error('Gagal mengambil data screener')
      const json = await res.json()
      setData(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData(preset)
  }, [preset])

  // Unique sectors
  const sectors = useMemo(() => {
    const s = new Set<string>()
    data.forEach(d => { if (d.sector) s.add(d.sector) })
    return Array.from(s).sort()
  }, [data])

  // Filtered & Sorted
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (search) {
        const q = search.toUpperCase().trim()
        const matchCode = d.stock_code.toUpperCase().includes(q)
        const matchName = d.company_name.toUpperCase().includes(q)
        if (!matchCode && !matchName) return false
      }
      if (sectorFilter !== 'ALL' && d.sector !== sectorFilter) return false
      if (maxPer !== '' && (d.pe_ratio_ttm === null || d.pe_ratio_ttm > maxPer || d.pe_ratio_ttm <= 0)) return false
      if (maxPbv !== '' && (d.pbv_ratio === null || d.pbv_ratio > maxPbv || d.pbv_ratio <= 0)) return false
      if (minRoe !== '' && (d.roe_ttm_pct === null || d.roe_ttm_pct < minRoe)) return false
      if (maxDer !== '' && (d.debt_to_equity === null || d.debt_to_equity > maxDer)) return false
      if (minPiotroski !== '' && (d.piotroski_f_score === null || d.piotroski_f_score < minPiotroski)) return false
      return true
    }).sort((a, b) => {
      const va = a[sortCol]
      const vb = b[sortCol]
      if (va === null || va === undefined) return 1
      if (vb === null || vb === undefined) return -1
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va
      }
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }, [data, search, sectorFilter, maxPer, maxPbv, minRoe, maxDer, minPiotroski, sortCol, sortAsc])

  const handleSort = (col: keyof FundamentalStock) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc)
    } else {
      setSortCol(col)
      setSortAsc(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setSectorFilter('ALL')
    setMaxPer('')
    setMaxPbv('')
    setMinRoe('')
    setMaxDer('')
    setMinPiotroski('')
  }

  // Export CSV
  const exportCsv = () => {
    const headers = ['Kode', 'Perusahaan', 'Sektor', 'Harga', 'Mcap_B', 'PER_TTM', 'PBV', 'ROE_Pct', 'DER', 'NPM_Pct', 'Growth_NetIncome_YoY', 'Piotroski', 'Altman_Z', 'Free_Float_Pct']
    const rows = filteredData.map(d => [
      d.stock_code,
      `"${d.company_name.replace(/"/g, '""')}"`,
      `"${d.sector}"`,
      d.close,
      d.market_cap_b ?? '',
      d.pe_ratio_ttm ?? '',
      d.pbv_ratio ?? '',
      d.roe_ttm_pct ?? '',
      d.debt_to_equity ?? '',
      d.npm_quarter_pct ?? '',
      d.net_income_growth_yoy ?? '',
      d.piotroski_f_score ?? '',
      d.altman_z_score ?? '',
      d.free_float_pct ?? ''
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `BDMFlow_Fundamental_Screener_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full space-y-6 pb-16 animate-fade-in">
      
      {/* ══ HEADER BANNER ═══════════════════════════════════════════════════ */}
      <div className="rounded-3xl p-6 border border-line-2 bg-gradient-to-r from-surface-1 via-surface-1/90 to-surface-2/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  Fundamental &amp; Valuation Screener
                </h1>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Stockbit Intel
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  46 Metrik Lengkap
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Screening saham dengan fundamental prima: Valuasi murah (PER &amp; PBV), efisiensi tinggi (ROE), neraca sehat (DER &amp; Current Ratio), serta sinyal akumulasi Smart Money.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-surface-2 hover:bg-surface-3 border border-line-3 text-foreground transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => fetchData(preset)}
              className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-line-3 text-muted-foreground hover:text-foreground transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Preset Strategies Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
          {PRESETS.map(p => {
            const Icon = p.icon
            const active = preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  active
                    ? 'bg-amber-500/15 border-amber-500/40 text-foreground shadow-sm'
                    : 'bg-surface-2/70 border-line-2 text-muted-foreground hover:bg-surface-3 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-500' : 'text-muted-foreground group-hover:text-foreground'}`} />
                  <span className="font-bold text-xs truncate">{p.label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-tight">
                  {p.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ══ FILTER BAR ═════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-line-2 bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-foreground">Custom Filter &amp; Parameter</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">
              Ditemukan: <strong className="text-foreground">{filteredData.length}</strong> emiten
            </span>
            <button
              onClick={resetFilters}
              className="text-xs text-amber-500 hover:underline font-bold"
            >
              Reset Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 text-xs">
          {/* Search */}
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode/emiten..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Sector */}
          <div>
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Sektor</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Max PER */}
          <div>
            <input
              type="number"
              placeholder="Max PER (misal 15)"
              value={maxPer}
              onChange={e => setMaxPer(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Max PBV */}
          <div>
            <input
              type="number"
              step="0.1"
              placeholder="Max PBV (misal 1.5)"
              value={maxPbv}
              onChange={e => setMaxPbv(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Min ROE */}
          <div>
            <input
              type="number"
              placeholder="Min ROE % (misal 10)"
              value={minRoe}
              onChange={e => setMinRoe(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Max DER */}
          <div>
            <input
              type="number"
              step="0.1"
              placeholder="Max DER (misal 1.0)"
              value={maxDer}
              onChange={e => setMaxDer(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Min Piotroski */}
          <div>
            <input
              type="number"
              placeholder="Min F-Score (1-9)"
              value={minPiotroski}
              onChange={e => setMinPiotroski(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 rounded-xl bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* ══ DATA TABLE ═════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-line-2 bg-card overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
            <p className="font-bold text-sm text-foreground">Menyaring Data Fundamental Seluruh Emiten...</p>
            <p className="text-xs text-muted-foreground mt-1">Membaca 46 rasio keuangan dari MotherDuck</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-16 text-center">
            <Scale className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <h4 className="font-bold text-sm text-foreground">Tidak Ada Emiten yang Cocok</h4>
            <p className="text-xs text-muted-foreground mt-1">Coba longgarkan filter atau pilih preset strategi lain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-2/80 border-b border-line-2 text-muted-foreground uppercase text-[10px] font-bold tracking-wider select-none">
                  <th className="py-3 px-4">Emiten</th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('close')}>
                    <div className="flex items-center gap-1">
                      <span>Harga</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('market_cap_b')}>
                    <div className="flex items-center gap-1">
                      <span>Market Cap</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('pe_ratio_ttm')}>
                    <div className="flex items-center gap-1">
                      <span>PER (TTM)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('pbv_ratio')}>
                    <div className="flex items-center gap-1">
                      <span>PBV</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('roe_ttm_pct')}>
                    <div className="flex items-center gap-1">
                      <span>ROE %</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('npm_quarter_pct')}>
                    <div className="flex items-center gap-1">
                      <span>NPM %</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('debt_to_equity')}>
                    <div className="flex items-center gap-1">
                      <span>DER</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('net_income_growth_yoy')}>
                    <div className="flex items-center gap-1">
                      <span>Growth YoY</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('piotroski_f_score')}>
                    <div className="flex items-center gap-1">
                      <span>F-Score</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('free_float_pct')}>
                    <div className="flex items-center gap-1">
                      <span>Free Float</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-1">
                {filteredData.map((d, idx) => {
                  const isUnder = (d.pbv_ratio !== null && d.pbv_ratio < 1.0) || (d.pe_ratio_ttm !== null && d.pe_ratio_ttm > 0 && d.pe_ratio_ttm < 10)
                  const isHighRoe = d.roe_ttm_pct !== null && d.roe_ttm_pct >= 15
                  const isHealthyDer = d.debt_to_equity !== null && d.debt_to_equity < 1.0

                  return (
                    <tr key={d.stock_code} className="hover:bg-surface-2/40 transition-colors group">
                      {/* Emiten */}
                      <td className="py-3 px-4">
                        <Link href={`/stock/${d.stock_code}`} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-center font-black text-xs text-amber-500 font-mono">
                            {d.stock_code.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-foreground group-hover:text-amber-500 transition-colors">
                                {d.stock_code}
                              </span>
                              {d.whale_signal && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                  Whale
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                              {d.company_name}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Harga */}
                      <td className="py-3 px-3 font-mono font-bold text-foreground">
                        <div>Rp {d.close.toLocaleString('id-ID')}</div>
                        <div className={`text-[10px] ${d.change_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {d.change_percent >= 0 ? '+' : ''}{d.change_percent.toFixed(2)}%
                        </div>
                      </td>

                      {/* Mcap */}
                      <td className="py-3 px-3 font-mono text-muted-foreground font-medium">
                        {fmtBillion(d.market_cap_b)}
                      </td>

                      {/* PER */}
                      <td className="py-3 px-3 font-mono font-black text-foreground">
                        <span className={d.pe_ratio_ttm !== null && d.pe_ratio_ttm > 0 && d.pe_ratio_ttm < 10 ? 'text-emerald-500' : ''}>
                          {fmtVal(d.pe_ratio_ttm, 'x')}
                        </span>
                      </td>

                      {/* PBV */}
                      <td className="py-3 px-3 font-mono font-black text-foreground">
                        <span className={d.pbv_ratio !== null && d.pbv_ratio < 1.0 ? 'text-emerald-500 font-black' : ''}>
                          {fmtVal(d.pbv_ratio, 'x')}
                        </span>
                      </td>

                      {/* ROE */}
                      <td className="py-3 px-3 font-mono font-black">
                        <span className={isHighRoe ? 'text-emerald-500' : 'text-foreground'}>
                          {fmtVal(d.roe_ttm_pct, '%')}
                        </span>
                      </td>

                      {/* NPM */}
                      <td className="py-3 px-3 font-mono">
                        <span className={d.npm_quarter_pct !== null && d.npm_quarter_pct < 0 ? 'text-rose-500' : 'text-foreground'}>
                          {fmtVal(d.npm_quarter_pct, '%')}
                        </span>
                      </td>

                      {/* DER */}
                      <td className="py-3 px-3 font-mono">
                        <span className={isHealthyDer ? 'text-emerald-500' : 'text-foreground'}>
                          {fmtVal(d.debt_to_equity, 'x')}
                        </span>
                      </td>

                      {/* Growth YoY */}
                      <td className="py-3 px-3 font-mono">
                        <span className={d.net_income_growth_yoy !== null && d.net_income_growth_yoy >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                          {fmtVal(d.net_income_growth_yoy, '%')}
                        </span>
                      </td>

                      {/* Piotroski */}
                      <td className="py-3 px-3 font-mono text-center">
                        {d.piotroski_f_score !== null ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${d.piotroski_f_score >= 7 ? 'bg-emerald-500/15 text-emerald-400' : d.piotroski_f_score <= 3 ? 'bg-rose-500/15 text-rose-400' : 'bg-surface-2 text-foreground'}`}>
                            {d.piotroski_f_score}/9
                          </span>
                        ) : '—'}
                      </td>

                      {/* Free Float */}
                      <td className="py-3 px-3 font-mono text-cyan-600 dark:text-cyan-400 font-bold">
                        {fmtVal(d.free_float_pct, '%')}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/stock/${d.stock_code}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black font-bold text-[11px] transition-all"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
