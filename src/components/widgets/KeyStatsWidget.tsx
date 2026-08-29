'use client'

import React, { useEffect, useState } from 'react'
import { authFetch } from '@/lib/api'
import {
  TrendingUp, TrendingDown, DollarSign, ShieldCheck, ShieldAlert,
  Percent, PieChart, Layers, ArrowUpRight, Scale, CheckCircle2,
  AlertCircle, Building, RefreshCw, BarChart2, Activity, Info,
  Sparkles, AlertTriangle, Shield, Check
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

type ColorTier = 'good' | 'neutral' | 'bad' | 'none'

interface MetricItemProps {
  label: string
  value: string
  tier: ColorTier
  hint?: string
}

function MetricItem({ label, value, tier, hint }: MetricItemProps) {
  let badgeStyle = 'bg-surface-2 text-foreground border-line-2'
  let valColor = 'text-foreground'
  let dotColor = 'bg-muted-foreground/40'

  if (tier === 'good') {
    badgeStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black'
    valColor = 'text-emerald-600 dark:text-emerald-400 font-black'
    dotColor = 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
  } else if (tier === 'neutral') {
    badgeStyle = 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
    valColor = 'text-amber-600 dark:text-amber-400 font-bold'
    dotColor = 'bg-amber-500'
  } else if (tier === 'bad') {
    badgeStyle = 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
    valColor = 'text-rose-600 dark:text-rose-400 font-bold'
    dotColor = 'bg-rose-500'
  }

  return (
    <div className={`p-3 rounded-2xl border transition-all ${badgeStyle} flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold text-muted-foreground line-clamp-1">{label}</span>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      </div>
      <div className="flex items-baseline justify-between gap-2 mt-auto">
        <span className={`font-mono text-sm sm:text-base ${valColor}`}>{value}</span>
        {hint && (
          <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.2 rounded bg-surface-1/60 border border-line-3 text-muted-foreground">
            {hint}
          </span>
        )}
      </div>
    </div>
  )
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
        <p className="font-bold text-sm text-foreground">Menganalisis Fundamental {stockCode}...</p>
        <p className="text-xs text-muted-foreground mt-1">Mengkalkulasi rasio valuasi, profitabilitas, solvabilitas &amp; kesehatan neraca</p>
      </div>
    )
  }

  if (error || !data || (data.pe_ratio_ttm === null && data.pbv_ratio === null && data.roe_ttm_pct === null)) {
    return (
      <div className="rounded-3xl border border-line-2 bg-card p-8 text-center shadow-sm">
        <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <h4 className="font-bold text-sm text-foreground">Data Key Stats Belum Tersedia</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
          Data fundamental untuk kode emiten <strong>{stockCode}</strong> sedang dalam antrean pipeline mingguan.
        </p>
      </div>
    )
  }

  // ─── Automated AI-Style Fundamental Verdict Calculation ────────────────────
  let score = 50
  const bullets: { type: 'good' | 'neutral' | 'bad'; title: string; desc: string }[] = []

  // Valuation
  if (data.pe_ratio_ttm !== null) {
    if (data.pe_ratio_ttm > 0 && data.pe_ratio_ttm <= 10) {
      score += 15
      bullets.push({ type: 'good', title: 'Valuasi PER Murah', desc: `PER TTM ${data.pe_ratio_ttm.toFixed(2)}x tergolong sangat murah (undervalue) di bawah rata-rata pasar.` })
    } else if (data.pe_ratio_ttm > 10 && data.pe_ratio_ttm <= 18) {
      score += 5
      bullets.push({ type: 'neutral', title: 'Valuasi PER Wajar', desc: `PER TTM ${data.pe_ratio_ttm.toFixed(2)}x berada di rentang wajar (fair value).` })
    } else if (data.pe_ratio_ttm > 25) {
      score -= 15
      bullets.push({ type: 'bad', title: 'Valuasi PER Premium', desc: `PER TTM ${data.pe_ratio_ttm.toFixed(2)}x tergolong mahal (premium pricing).` })
    } else if (data.pe_ratio_ttm < 0) {
      score -= 20
      bullets.push({ type: 'bad', title: 'Emiten Merugi', desc: `PER bernilai negatif karena perusahaan mencatatkan rugi bersih dalam 12 bulan terakhir.` })
    }
  }

  // PBV
  if (data.pbv_ratio !== null) {
    if (data.pbv_ratio > 0 && data.pbv_ratio <= 1.0) {
      score += 15
      bullets.push({ type: 'good', title: 'Harga di Bawah Nilai Buku', desc: `PBV ${data.pbv_ratio.toFixed(2)}x (<1x) artinya harga saham diperdagangkan lebih murah dari total aset bersihnya.` })
    } else if (data.pbv_ratio > 3.0) {
      score -= 10
      bullets.push({ type: 'bad', title: 'PBV Tinggi', desc: `PBV ${data.pbv_ratio.toFixed(2)}x mencerminkan ekspektasi valuasi aset yang cukup tinggi.` })
    }
  }

  // ROE
  if (data.roe_ttm_pct !== null) {
    if (data.roe_ttm_pct >= 15) {
      score += 20
      bullets.push({ type: 'good', title: 'Profitabilitas Super Prima', desc: `ROE ${data.roe_ttm_pct.toFixed(2)}% sangat efisien dalam mencetak laba bersih dari modal pemegang saham.` })
    } else if (data.roe_ttm_pct >= 8) {
      score += 10
      bullets.push({ type: 'neutral', title: 'Profitabilitas Cukup', desc: `ROE ${data.roe_ttm_pct.toFixed(2)}% memenuhi standar imbal hasil industri.` })
    } else if (data.roe_ttm_pct < 0) {
      bullets.push({ type: 'bad', title: 'Ekuitas Negatif / Rugi', desc: `ROE bernilai negatif akibat kinerja laba yang mengalami defisit.` })
    }
  }

  // DER
  if (data.debt_to_equity !== null) {
    if (data.debt_to_equity <= 0.5) {
      score += 15
      bullets.push({ type: 'good', title: 'Neraca Super Sehat', desc: `DER hanya ${data.debt_to_equity.toFixed(2)}x membuktikan perusahaan memiliki beban hutang yang sangat minim.` })
    } else if (data.debt_to_equity > 1.5) {
      score -= 15
      bullets.push({ type: 'bad', title: 'Beban Hutang Tinggi', desc: `DER ${data.debt_to_equity.toFixed(2)}x menandakan liabilitas hutang berbunga melebihi modal sendiri.` })
    }
  }

  // Growth YoY
  if (data.net_income_growth_yoy !== null) {
    if (data.net_income_growth_yoy >= 20) {
      score += 15
      bullets.push({ type: 'good', title: 'Laba Bersih Melesat', desc: `Pertumbuhan laba bersih kuartalan melesat +${data.net_income_growth_yoy.toFixed(2)}% YoY.` })
    } else if (data.net_income_growth_yoy < -10) {
      score -= 10
      bullets.push({ type: 'bad', title: 'Laba Mengalami Kontraksi', desc: `Laba bersih menyusut ${data.net_income_growth_yoy.toFixed(2)}% dibandingkan tahun lalu.` })
    }
  }

  // Solvency score
  if (data.altman_z_score !== null && data.altman_z_score >= 2.9) {
    bullets.push({ type: 'good', title: 'Solvabilitas Aman', desc: `Altman Z-Score ${data.altman_z_score.toFixed(2)} berada di Safe Zone (bebas risiko gagal bayar).` })
  }

  score = Math.max(10, Math.min(99, score))

  let verdictTitle = 'FUNDAMENTAL MODERAT & WAJAR'
  let verdictBadge = '🟡 Cukup Wajar'
  let verdictBorder = 'border-amber-500/30'
  let verdictBg = 'from-amber-500/10 via-surface-1 to-surface-2/40'
  let verdictText = 'text-amber-500'

  if (score >= 75) {
    verdictTitle = 'FUNDAMENTAL PRIMA & UNDERVALUE'
    verdictBadge = '🟢 Sangat Kuat & Murah'
    verdictBorder = 'border-emerald-500/40'
    verdictBg = 'from-emerald-500/15 via-surface-1 to-surface-2/40'
    verdictText = 'text-emerald-600 dark:text-emerald-400'
  } else if (score >= 60) {
    verdictTitle = 'FUNDAMENTAL SEHAT & PROFITABLE'
    verdictBadge = '🟢 Sehat'
    verdictBorder = 'border-emerald-500/30'
    verdictBg = 'from-emerald-500/10 via-surface-1 to-surface-2/40'
    verdictText = 'text-emerald-600 dark:text-emerald-400'
  } else if (score <= 35) {
    verdictTitle = 'FUNDAMENTAL BERISIKO / OVERVALUED'
    verdictBadge = '🔴 Perlu Waspada'
    verdictBorder = 'border-rose-500/40'
    verdictBg = 'from-rose-500/15 via-surface-1 to-surface-2/40'
    verdictText = 'text-rose-600 dark:text-rose-400'
  }

  // Helper color checkers
  const getPerTier = (v: number | null): ColorTier => v === null ? 'none' : (v > 0 && v <= 10 ? 'good' : (v > 10 && v <= 20 ? 'neutral' : 'bad'))
  const getPbvTier = (v: number | null): ColorTier => v === null ? 'none' : (v > 0 && v <= 1.0 ? 'good' : (v > 1.0 && v <= 2.2 ? 'neutral' : 'bad'))
  const getRoeTier = (v: number | null): ColorTier => v === null ? 'none' : (v >= 15 ? 'good' : (v >= 8 ? 'neutral' : 'bad'))
  const getRoaTier = (v: number | null): ColorTier => v === null ? 'none' : (v >= 8 ? 'good' : (v >= 4 ? 'neutral' : 'bad'))
  const getDerTier = (v: number | null): ColorTier => v === null ? 'none' : (v <= 0.5 ? 'good' : (v <= 1.2 ? 'neutral' : 'bad'))
  const getCrTier  = (v: number | null): ColorTier => v === null ? 'none' : (v >= 2.0 ? 'good' : (v >= 1.2 ? 'neutral' : 'bad'))
  const getGrowthTier = (v: number | null): ColorTier => v === null ? 'none' : (v >= 20 ? 'good' : (v >= 0 ? 'neutral' : 'bad'))
  const getMarginTier = (v: number | null): ColorTier => v === null ? 'none' : (v >= 15 ? 'good' : (v >= 5 ? 'neutral' : 'bad'))
  const getFScoreTier = (v: number | null): ColorTier => v === null ? 'none' : (v >= 7 ? 'good' : (v >= 4 ? 'neutral' : 'bad'))
  const getZScoreTier = (v: number | null): ColorTier => v === null ? 'none' : (v >= 2.9 ? 'good' : (v >= 1.8 ? 'neutral' : 'bad'))

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* ══ 1. INTELLIGENT FUNDAMENTAL VERDICT BANNER (No Redundancy) ═══════ */}
      <div className={`rounded-3xl p-5 sm:p-6 border ${verdictBorder} bg-gradient-to-r ${verdictBg} shadow-xl space-y-4`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  Diagnosa Fundamental: <span className={verdictText}>{verdictTitle}</span>
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-surface-1 border border-line-3 text-foreground shadow-xs">
                  {data.period_latest || 'Kuartal Terakhir'}
                </span>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-surface-2 border border-line-3">
                  {verdictBadge}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Evaluasi otomatis 46 rasio keuangan: valuasi, solvabilitas hutang, profitabilitas, serta laju pertumbuhan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            {/* Fundamental Score Meter */}
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block">Health Score</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className={`text-2xl sm:text-3xl font-black ${verdictText}`}>{score}</span>
                <span className="text-xs text-muted-foreground font-bold">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Bullet Points Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-line-2">
          {bullets.map((b, idx) => {
            const isGood = b.type === 'good'
            const isBad = b.type === 'bad'
            return (
              <div key={idx} className="flex items-start gap-2 text-xs bg-surface-1/70 border border-line-2 p-2.5 rounded-xl">
                {isGood && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                {isBad && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                {!isGood && !isBad && <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                <div>
                  <strong className="text-foreground block">{b.title}</strong>
                  <span className="text-muted-foreground text-[11px] leading-relaxed">{b.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ 2. FOUR CORE GRIDS WITH TRAFFIC LIGHT HIGHLIGHTING ══════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Valuasi Pasar */}
        <div className="rounded-3xl border border-line-2 bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line-2">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-sm text-foreground">Valuasi Pasar (Valuation Ratios)</h4>
            </div>
            <span className="text-[10px] text-muted-foreground">Harga vs Nilai Intrinsik</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <MetricItem
              label="PER (TTM)"
              value={fmtVal(data.pe_ratio_ttm, 'x')}
              tier={getPerTier(data.pe_ratio_ttm)}
              hint={data.pe_ratio_ttm !== null && data.pe_ratio_ttm > 0 && data.pe_ratio_ttm <= 10 ? 'Murah' : undefined}
            />
            <MetricItem
              label="PER Annualized"
              value={fmtVal(data.pe_ratio_annualized, 'x')}
              tier={getPerTier(data.pe_ratio_annualized)}
            />
            <MetricItem
              label="Forward PE"
              value={fmtVal(data.forward_pe, 'x')}
              tier={getPerTier(data.forward_pe)}
            />
            <MetricItem
              label="PBV (Price to Book)"
              value={fmtVal(data.pbv_ratio, 'x')}
              tier={getPbvTier(data.pbv_ratio)}
              hint={data.pbv_ratio !== null && data.pbv_ratio < 1.0 ? '< 1.0x' : undefined}
            />
            <MetricItem
              label="Price to Sales (P/S)"
              value={fmtVal(data.ps_ratio, 'x')}
              tier={data.ps_ratio !== null && data.ps_ratio <= 1.5 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="EV / EBITDA"
              value={fmtVal(data.ev_ebitda, 'x')}
              tier={data.ev_ebitda !== null && data.ev_ebitda <= 6.0 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="Price to FCF"
              value={fmtVal(data.p_fcf_ratio, 'x')}
              tier={data.p_fcf_ratio !== null && data.p_fcf_ratio > 0 && data.p_fcf_ratio <= 15 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="Earnings Yield"
              value={fmtVal(data.earnings_yield_pct, '%')}
              tier={data.earnings_yield_pct !== null && data.earnings_yield_pct >= 10 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="PEG Ratio"
              value={fmtVal(data.peg_ratio, '')}
              tier={data.peg_ratio !== null && data.peg_ratio > 0 && data.peg_ratio <= 1.0 ? 'good' : 'neutral'}
            />
          </div>
        </div>

        {/* 2. Profitabilitas & Margin */}
        <div className="rounded-3xl border border-line-2 bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-sm text-foreground">Profitabilitas &amp; Margin Bisnis</h4>
            </div>
            <span className="text-[10px] text-muted-foreground">Efisiensi Cetak Laba</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <MetricItem
              label="ROE (TTM)"
              value={fmtVal(data.roe_ttm_pct, '%')}
              tier={getRoeTier(data.roe_ttm_pct)}
              hint={data.roe_ttm_pct !== null && data.roe_ttm_pct >= 15 ? 'Prima' : undefined}
            />
            <MetricItem
              label="ROA (TTM)"
              value={fmtVal(data.roa_ttm_pct, '%')}
              tier={getRoaTier(data.roa_ttm_pct)}
            />
            <MetricItem
              label="ROCE (TTM)"
              value={fmtVal(data.roce_ttm_pct, '%')}
              tier={data.roce_ttm_pct !== null && data.roce_ttm_pct >= 15 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="Gross Margin (GPM)"
              value={fmtVal(data.gpm_quarter_pct, '%')}
              tier={getMarginTier(data.gpm_quarter_pct)}
            />
            <MetricItem
              label="Operating Margin (OPM)"
              value={fmtVal(data.opm_quarter_pct, '%')}
              tier={getMarginTier(data.opm_quarter_pct)}
            />
            <MetricItem
              label="Net Profit Margin (NPM)"
              value={fmtVal(data.npm_quarter_pct, '%')}
              tier={getMarginTier(data.npm_quarter_pct)}
              hint={data.npm_quarter_pct !== null && data.npm_quarter_pct >= 15 ? 'Tebal' : undefined}
            />
          </div>
        </div>

        {/* 3. Kesehatan Neraca & Skor Solvabilitas */}
        <div className="rounded-3xl border border-line-2 bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <h4 className="font-bold text-sm text-foreground">Kesehatan Neraca &amp; Solvabilitas</h4>
            </div>
            <span className="text-[10px] text-muted-foreground">Ketahanan Risiko Hutang</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <MetricItem
              label="Debt to Equity (DER)"
              value={fmtVal(data.debt_to_equity, 'x')}
              tier={getDerTier(data.debt_to_equity)}
              hint={data.debt_to_equity !== null && data.debt_to_equity <= 0.5 ? 'Aman' : undefined}
            />
            <MetricItem
              label="Current Ratio"
              value={fmtVal(data.current_ratio, 'x')}
              tier={getCrTier(data.current_ratio)}
            />
            <MetricItem
              label="Quick Ratio"
              value={fmtVal(data.quick_ratio, 'x')}
              tier={data.quick_ratio !== null && data.quick_ratio >= 1.0 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="Interest Coverage"
              value={fmtVal(data.interest_coverage, 'x')}
              tier={data.interest_coverage !== null && data.interest_coverage >= 5.0 ? 'good' : 'neutral'}
            />
            <MetricItem
              label="Piotroski F-Score"
              value={data.piotroski_f_score !== null ? `${data.piotroski_f_score}/9` : '—'}
              tier={getFScoreTier(data.piotroski_f_score)}
              hint={data.piotroski_f_score !== null && data.piotroski_f_score >= 7 ? 'Strong' : undefined}
            />
            <MetricItem
              label="Altman Z-Score"
              value={fmtVal(data.altman_z_score, '')}
              tier={getZScoreTier(data.altman_z_score)}
              hint={data.altman_z_score !== null && data.altman_z_score >= 2.9 ? 'Safe Zone' : undefined}
            />
          </div>
        </div>

        {/* 4. Data Finansial Per Lembar & Pertumbuhan */}
        <div className="rounded-3xl border border-line-2 bg-card p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-line-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <h4 className="font-bold text-sm text-foreground">Pertumbuhan &amp; Nilai Per Lembar</h4>
            </div>
            <span className="text-[10px] text-muted-foreground">Tren Laba &amp; Dividen Base</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <MetricItem
              label="Laba Bersih YoY"
              value={fmtVal(data.net_income_growth_yoy, '%')}
              tier={getGrowthTier(data.net_income_growth_yoy)}
              hint={data.net_income_growth_yoy !== null && data.net_income_growth_yoy >= 20 ? 'Melesat' : undefined}
            />
            <MetricItem
              label="Omset YoY Growth"
              value={fmtVal(data.revenue_growth_yoy_pct, '%')}
              tier={getGrowthTier(data.revenue_growth_yoy_pct)}
            />
            <MetricItem
              label="EPS (TTM)"
              value={`Rp ${fmtVal(data.eps_ttm, '', 0)}`}
              tier={data.eps_ttm !== null && data.eps_ttm > 0 ? 'good' : 'bad'}
            />
            <MetricItem
              label="BVPS (Nilai Buku)"
              value={`Rp ${fmtVal(data.bvps, '', 0)}`}
              tier="none"
            />
            <MetricItem
              label="Kas per Lembar"
              value={`Rp ${fmtVal(data.cash_per_share, '', 0)}`}
              tier="none"
            />
            <MetricItem
              label="FCF per Lembar"
              value={`Rp ${fmtVal(data.fcf_per_share, '', 0)}`}
              tier={data.fcf_per_share !== null && data.fcf_per_share > 0 ? 'good' : 'bad'}
            />
          </div>
        </div>

      </div>

      {/* ══ 3. SUMMARY LAPORAN KEUANGAN RIIL (Miliar/Triliun Rupiah) ═══════ */}
      <div className="rounded-3xl border border-line-2 bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-line-2">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-500" />
            <h4 className="font-bold text-sm text-foreground">Ringkasan Laporan Keuangan Riil (Laba Rugi, Neraca, &amp; Arus Kas)</h4>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">Angka Aktual Terkini</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Omset / Revenue (TTM)</span>
            <span className="font-mono font-black text-foreground text-sm sm:text-base mt-1 block">{fmtBillion(data.revenue_ttm_b)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Laba Bersih / Net Profit (TTM)</span>
            <span className={`font-mono font-black text-sm sm:text-base mt-1 block ${data.net_income_ttm_b !== null && data.net_income_ttm_b >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {fmtBillion(data.net_income_ttm_b)}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">EBITDA (TTM)</span>
            <span className="font-mono font-black text-foreground text-sm sm:text-base mt-1 block">{fmtBillion(data.ebitda_ttm_b)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Kas &amp; Setara Kas</span>
            <span className="font-mono font-black text-foreground text-sm sm:text-base mt-1 block">{fmtBillion(data.cash_quarter_b)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Aset</span>
            <span className="font-mono font-black text-foreground text-sm sm:text-base mt-1 block">{fmtBillion(data.total_assets_b)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Liabilitas (Hutang)</span>
            <span className="font-mono font-black text-foreground text-sm sm:text-base mt-1 block">{fmtBillion(data.total_liabilities_b)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Total Ekuitas (Modal Bersih)</span>
            <span className="font-mono font-black text-foreground text-sm sm:text-base mt-1 block">{fmtBillion(data.total_equity_b)}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1 border border-line-2">
            <span className="text-muted-foreground text-[10px] uppercase font-bold block">Free Cash Flow (TTM)</span>
            <span className={`font-mono font-black text-sm sm:text-base mt-1 block ${data.free_cash_flow_ttm_b !== null && data.free_cash_flow_ttm_b >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {fmtBillion(data.free_cash_flow_ttm_b)}
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
