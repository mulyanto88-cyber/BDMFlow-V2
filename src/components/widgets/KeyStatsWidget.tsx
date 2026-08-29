'use client'

import React, { useEffect, useState } from 'react'
import { authFetch } from '@/lib/api'
import {
  TrendingUp, TrendingDown, DollarSign, ShieldCheck, ShieldAlert,
  Percent, PieChart, Layers, ArrowUpRight, Scale, CheckCircle2,
  AlertCircle, Building, RefreshCw, BarChart2, Activity, Info
} from 'lucide-react'

export interface KeyStatsData {
  stock_code: string
  market_cap_b: number | null
  enterprise_value_b: number | null
  shares_outstanding_b: number | null
  free_float_pct: number | null
  
  // Valuation
  pe_ratio_ttm: number | null
  pe_ratio_annualized: number | null
  forward_pe: number | null
  pbv_ratio: number | null
  ps_ratio: number | null
  ev_ebitda: number | null
  ev_ebit: number | null
  peg_ratio: number | null
  earnings_yield_pct: number | null
  p_fcf_ratio: number | null

  // Per Share
  eps_ttm: number | null
  eps_annualized: number | null
  bvps: number | null
  revenue_per_share: number | null
  cash_per_share: number | null
  fcf_per_share: number | null

  // Profitability
  roe_ttm_pct: number | null
  roa_ttm_pct: number | null
  roce_ttm_pct: number | null
  gpm_quarter_pct: number | null
  opm_quarter_pct: number | null
  npm_quarter_pct: number | null

  // Growth
  revenue_growth_yoy_pct: number | null
  gross_profit_growth_yoy: number | null
  net_income_growth_yoy: number | null

  // Solvency
  debt_to_equity: number | null
  current_ratio: number | null
  quick_ratio: number | null
  interest_coverage: number | null
  piotroski_f_score: number | null
  altman_z_score: number | null

  // Financials in Billion IDR
  revenue_ttm_b: number | null
  gross_profit_ttm_b: number | null
  ebitda_ttm_b: number | null
  net_income_ttm_b: number | null
  cash_quarter_b: number | null
  total_assets_b: number | null
  total_liabilities_b: number | null
  total_equity_b: number | null
  total_debt_b: number | null
  net_debt_b: number | null
  cash_from_ops_ttm_b: number | null
  free_cash_flow_ttm_b: number | null

  period_latest: string | null
  updated_at: string | null
}

interface KeyStatsWidgetProps {
  stockCode: string
  initialData?: KeyStatsData | null
}

function fmtVal(num: number | null | undefined, suffix = '', decimals = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '—'
  return `${num.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
}

function fmtBillion(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '—'
  const abs = Math.abs(num)
  if (abs >= 1000) {
    const trl = num / 1000
    return `Rp ${trl.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} T`
  }
  return `Rp ${num.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M`
}

export function KeyStatsWidget({ stockCode, initialData }: KeyStatsWidgetProps) {
  const [data, setData] = useState<KeyStatsData | null>(initialData || null)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function fetchStats() {
      setLoading(true)
      setError(null)
      try {
        const res = await authFetch(`/api/stock-detail?code=${stockCode}&action=keystats`)
        if (!res.ok) throw new Error('Gagal memuat data fundamental')
        const json = await res.json()
        if (isMounted) {
          setData(json.data || null)
        }
      } catch (err: any) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStats()
    return () => { isMounted = false }
  }, [stockCode])

  if (loading) {
    return (
      <div className="rounded-3xl border border-line-2 bg-card p-12 text-center shadow-lg animate-pulse">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
        <p className="font-bold text-sm text-foreground">Memuat Key Stats &amp; Fundamental {stockCode}...</p>
        <p className="text-xs text-muted-foreground mt-1">Mengambil 46 metrik valuasi &amp; keuangan terverifikasi</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-line-2 bg-card p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <h4 className="font-bold text-sm text-foreground">Data Key Stats Belum Tersedia</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
          Data fundamental untuk kode emiten <strong>{stockCode}</strong> akan diperbarui pada jadwal batch pipeline berikutnya.
        </p>
      </div>
    )
  }

  // Derived valuation badge
  const isUndervalue = (data.pbv_ratio !== null && data.pbv_ratio < 1.0) || (data.pe_ratio_ttm !== null && data.pe_ratio_ttm > 0 && data.pe_ratio_ttm < 10)
  const isHealthy = (data.debt_to_equity !== null && data.debt_to_equity < 1.0) && (data.current_ratio !== null && data.current_ratio >= 1.5)
  const isHighProfit = (data.roe_ttm_pct !== null && data.roe_ttm_pct >= 15)

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ══ HEADER: Financial Overview Banner ═══════════════════════════════ */}
      <div className="rounded-3xl p-5 sm:p-6 border border-line-2 bg-gradient-to-b from-surface-1 via-surface-1/70 to-surface-2/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  Key Stats &amp; Fundamental Valuasi — {stockCode}
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {data.period_latest || 'Latest Quarter'}
                </span>
                {isUndervalue && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Undervalue
                  </span>
                )}
                {isHighProfit && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                    High ROE (15%+)
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Valuasi pasar, solvabilitas, rasio profitabilitas, serta ringkasan neraca &amp; arus kas terkini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground self-start md:self-auto">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>Updated: {data.updated_at ? String(data.updated_at).slice(0, 16) : 'Baru saja'}</span>
          </div>
        </div>

        {/* 4 Core Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-card border border-line-3 shadow-xs">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Market Cap</div>
            <div className="text-lg sm:text-xl font-black font-mono text-foreground mt-1">
              {fmtBillion(data.market_cap_b)}
            </div>
            <span className="text-[10px] text-muted-foreground">Nilai Pasar Bursa</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-line-3 shadow-xs">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Free Float</div>
            <div className="text-lg sm:text-xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">
              {fmtVal(data.free_float_pct, '%', 2)}
            </div>
            <span className="text-[10px] text-muted-foreground">Saham Beredar Publik</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-line-3 shadow-xs">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Piotroski F-Score</div>
            <div className="text-lg sm:text-xl font-black font-mono text-foreground mt-1 flex items-center gap-1">
              <span>{data.piotroski_f_score !== null ? `${data.piotroski_f_score}/9` : '—'}</span>
              {data.piotroski_f_score !== null && data.piotroski_f_score >= 7 && (
                <span className="text-[8.5px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Strong</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">Kekuatan Finansial</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-line-3 shadow-xs">
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Altman Z-Score</div>
            <div className="text-lg sm:text-xl font-black font-mono text-foreground mt-1 flex items-center gap-1">
              <span>{fmtVal(data.altman_z_score, '', 2)}</span>
              {data.altman_z_score !== null && data.altman_z_score >= 2.9 && (
                <span className="text-[8.5px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Safe Zone</span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">Prediksi Solvabilitas</span>
          </div>
        </div>
      </div>

      {/* ══ 4 CATEGORY METRIC GRIDS ═════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Valuasi & Pasar */}
        <div className="rounded-2xl border border-line-2 bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-line-2">
            <Scale className="w-4 h-4 text-amber-500" />
            <h4 className="font-bold text-sm text-foreground">Valuasi Pasar (Valuation Ratios)</h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">PER (TTM)</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.pe_ratio_ttm, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">PER Disetahunkan</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.pe_ratio_annualized, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Forward PE</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.forward_pe, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">PBV Ratio</span>
              <span className={`font-mono font-black ${data.pbv_ratio !== null && data.pbv_ratio < 1 ? 'text-emerald-500' : 'text-foreground'}`}>
                {fmtVal(data.pbv_ratio, 'x')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Price to Sales (P/S)</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.ps_ratio, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">EV / EBITDA</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.ev_ebitda, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">PEG Ratio</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.peg_ratio, '')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Earnings Yield</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{fmtVal(data.earnings_yield_pct, '%')}</span>
            </div>
          </div>
        </div>

        {/* 2. Profitabilitas & Efisiensi */}
        <div className="rounded-2xl border border-line-2 bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-line-2">
            <Percent className="w-4 h-4 text-emerald-500" />
            <h4 className="font-bold text-sm text-foreground">Profitabilitas &amp; Margin Bisnis</h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">ROE (TTM)</span>
              <span className={`font-mono font-black ${data.roe_ttm_pct !== null && data.roe_ttm_pct >= 15 ? 'text-emerald-500' : 'text-foreground'}`}>
                {fmtVal(data.roe_ttm_pct, '%')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">ROA (TTM)</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.roa_ttm_pct, '%')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">ROCE (TTM)</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.roce_ttm_pct, '%')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Gross Margin (GPM)</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.gpm_quarter_pct, '%')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Operating Margin (OPM)</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.opm_quarter_pct, '%')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Net Profit Margin (NPM)</span>
              <span className={`font-mono font-black ${data.npm_quarter_pct !== null && data.npm_quarter_pct < 0 ? 'text-rose-500' : 'text-foreground'}`}>
                {fmtVal(data.npm_quarter_pct, '%')}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Data Per Lembar Saham (Per Share) */}
        <div className="rounded-2xl border border-line-2 bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-line-2">
            <DollarSign className="w-4 h-4 text-cyan-500" />
            <h4 className="font-bold text-sm text-foreground">Data Finansial Per Lembar Saham</h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">EPS (TTM)</span>
              <span className="font-mono font-black text-foreground">Rp {fmtVal(data.eps_ttm, '')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">EPS Disetahunkan</span>
              <span className="font-mono font-black text-foreground">Rp {fmtVal(data.eps_annualized, '')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">BVPS (Nilai Buku)</span>
              <span className="font-mono font-black text-foreground">Rp {fmtVal(data.bvps, '')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Revenue / Share</span>
              <span className="font-mono font-black text-foreground">Rp {fmtVal(data.revenue_per_share, '')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Kas / Share</span>
              <span className="font-mono font-black text-foreground">Rp {fmtVal(data.cash_per_share, '')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">FCF / Share</span>
              <span className="font-mono font-black text-foreground">Rp {fmtVal(data.fcf_per_share, '')}</span>
            </div>
          </div>
        </div>

        {/* 4. Kesehatan Neraca & Pertumbuhan */}
        <div className="rounded-2xl border border-line-2 bg-card p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-line-2">
            <ShieldCheck className="w-4 h-4 text-purple-500" />
            <h4 className="font-bold text-sm text-foreground">Kesehatan Neraca &amp; Pertumbuhan</h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Debt to Equity (DER)</span>
              <span className={`font-mono font-black ${data.debt_to_equity !== null && data.debt_to_equity < 1 ? 'text-emerald-500' : 'text-foreground'}`}>
                {fmtVal(data.debt_to_equity, 'x')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Current Ratio</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.current_ratio, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Quick Ratio</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.quick_ratio, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Interest Coverage</span>
              <span className="font-mono font-black text-foreground">{fmtVal(data.interest_coverage, 'x')}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Omset YoY Growth</span>
              <span className={`font-mono font-black ${data.revenue_growth_yoy_pct !== null && data.revenue_growth_yoy_pct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {fmtVal(data.revenue_growth_yoy_pct, '%')}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-surface-2/60 border border-line-2 flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Net Income YoY</span>
              <span className={`font-mono font-black ${data.net_income_growth_yoy !== null && data.net_income_growth_yoy >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {fmtVal(data.net_income_growth_yoy, '%')}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ══ 5. SUMMARY LAPORAN KEUANGAN RIIL (Miliar Rupiah) ════════════════ */}
      <div className="rounded-2xl border border-line-2 bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-500" />
            <h4 className="font-bold text-sm text-foreground">Ringkasan Laporan Keuangan (Laba Rugi, Neraca, &amp; Arus Kas)</h4>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Dalam Miliar Rupiah</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Pendapatan (TTM)</span>
            <span className="font-mono font-black text-foreground text-sm mt-0.5 block">{fmtBillion(data.revenue_ttm_b)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Laba Bersih (TTM)</span>
            <span className={`font-mono font-black text-sm mt-0.5 block ${data.net_income_ttm_b !== null && data.net_income_ttm_b >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {fmtBillion(data.net_income_ttm_b)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">EBITDA (TTM)</span>
            <span className="font-mono font-black text-foreground text-sm mt-0.5 block">{fmtBillion(data.ebitda_ttm_b)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Kas &amp; Setara Kas</span>
            <span className="font-mono font-black text-foreground text-sm mt-0.5 block">{fmtBillion(data.cash_quarter_b)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Aset</span>
            <span className="font-mono font-black text-foreground text-sm mt-0.5 block">{fmtBillion(data.total_assets_b)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Hutang (Liabilitas)</span>
            <span className="font-mono font-black text-foreground text-sm mt-0.5 block">{fmtBillion(data.total_liabilities_b)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Ekuitas (Modal Bersih)</span>
            <span className="font-mono font-black text-foreground text-sm mt-0.5 block">{fmtBillion(data.total_equity_b)}</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Free Cash Flow (TTM)</span>
            <span className={`font-mono font-black text-sm mt-0.5 block ${data.free_cash_flow_ttm_b !== null && data.free_cash_flow_ttm_b >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {fmtBillion(data.free_cash_flow_ttm_b)}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
