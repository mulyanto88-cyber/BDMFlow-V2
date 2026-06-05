export const dynamic = 'force-dynamic'

// src/app/page.tsx — Morning Brief
import React from 'react'
import Link from 'next/link'
import { run } from '@/lib/db'
import {
  Zap, TrendingUp, TrendingDown, Shield, Globe, Building2,
  AlertTriangle, Activity, ArrowRight, Eye, BarChart2,
} from 'lucide-react'

export const revalidate = 60

// ── Data fetching ─────────────────────────────────────────────────────────────
async function getMorningBrief() {
  const [pulse, topRadar, groups, alerts, stealth] = await Promise.all([
    run(`SELECT trading_date::VARCHAR AS date, stock_count::BIGINT AS stock_count,
               (total_value/1e12)::DOUBLE AS val_triliun,
               (total_foreign_flow/1e9)::DOUBLE AS foreign_miliar,
               whale_count::BIGINT AS whale_count, gainers::BIGINT AS gainers, losers::BIGINT AS losers,
               avg_change_pct::DOUBLE AS avg_change_pct
        FROM market.vw_market_summary
        WHERE trading_date=(SELECT MAX(trading_date) FROM market.vw_market_summary) LIMIT 1`
    ).catch(() => []),
    run(`SELECT r.stock_code, r.sector, s.close::DOUBLE AS close,
               ROUND(r.change_percent::DOUBLE,2) AS chg, r.radar_score::INTEGER,
               r.composite_signal, r.whale_signal::BOOLEAN, r.fresh_insider_buy::BOOLEAN,
               ROUND(r.foreign_broker_net_7d::DOUBLE,2) AS fg7d,
               ROUND(r.local_inst_net_7d::DOUBLE,2) AS inst7d,
               ROUND(r.ksei_net_smart_miliar::DOUBLE,2) AS ksei
        FROM market.vw_watchlist_radar r
        INNER JOIN market.vw_stock_latest s ON r.stock_code=s.stock_code
        WHERE r.warning_flag IS NULL AND s.close>100 AND s.value>5000000000
        ORDER BY r.radar_score DESC LIMIT 8`
    ).catch(() => []),
    run(`SELECT group_name, composite_score::INTEGER, market_phase, group_action_signal,
               ROUND(perf_1d::DOUBLE,2) AS perf_1d, smart_money_trend
        FROM market.vw_group_phase_composite
        WHERE group_name!='Others' ORDER BY composite_score DESC LIMIT 8`
    ).catch(() => []),
    run(`SELECT transaction_date::VARCHAR, stock_code, insider_name, insider_type,
               action_type, ROUND(ABS(pct_change)::DOUBLE,4) AS pct_chg,
               alert_level, days_ago::INTEGER, sector
        FROM main.vw_insider_alert_feed
        WHERE days_ago<=7 AND action_type='BUY'
        ORDER BY days_ago ASC, ABS(pct_change) DESC LIMIT 6`
    ).catch(() => []),
    run(`SELECT Code AS code, Price::DOUBLE AS price,
               ROUND(CP_Flow_Miliar::DOUBLE,2) AS cp_flow,
               ROUND(Price_Chg_Pct::DOUBLE,2) AS chg, Signal AS signal
        FROM ksei.vw_stealth_accumulation WHERE signal!='NORMAL'
        ORDER BY ABS(CP_Flow_Miliar) DESC LIMIT 6`
    ).catch(() => []),
  ])
  return {
    pulse: (pulse as any[])[0] ?? null,
    topRadar: topRadar as any[],
    groups: groups as any[],
    alerts: alerts as any[],
    stealth: stealth as any[],
  }
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatMiliar(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1000) return `${(value / 1000).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`

  return `${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} M`
}

function fmtTriliunLoose(value: number): string {
  if (!value) return '0'
  return `${value.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} T`
}

// ── Micro Components ──────────────────────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : score >= 55 ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
            : score >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
  return (
    <span className={`text-xs font-black px-2 py-0.5 rounded border counter ${cls}`}>{score}</span>
  )
}

function PhaseBadge({ phase }: { phase: string }) {
  const map: Record<string, string> = {
    'MARKUP':       'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20',
    'EARLY MARKUP': 'bg-teal-500/20 text-teal-400 border border-teal-500/20',
    'AKUMULASI':    'bg-sky-500/20 text-sky-400 border border-sky-500/20',
    'SIDEWAYS':     'bg-slate-500/20 text-slate-400 border border-slate-500/20',
    'DISTRIBUSI':   'bg-amber-500/20 text-amber-400 border border-amber-500/20',
    'MARKDOWN':     'bg-red-500/20 text-red-400 border border-red-500/20',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded font-semibold ${map[phase] || 'bg-slate-500/20 text-slate-400'}`}>
      {phase}
    </span>
  )
}

/** SVG half-circle gauge, fills left → right → score/100 of arc */
function MarketScoreGauge({ score }: { score: number }) {
  const arcLen = Math.PI * 43               // ≈ 135.09 px path length
  const filled = arcLen * (score / 100)
  const empty  = arcLen - filled
  const color  = score >= 65 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444'
  const label  = score >= 65 ? 'Strong'  : score >= 45 ? 'Neutral' : 'Caution'

  return (
    <div className="flex flex-col items-center">
      <svg width="90" height="52" viewBox="0 0 100 56" aria-hidden="true">
        {/* Track — tema-aware via CSS variable */}
        <path d="M 7,50 A 43,43 0 0 1 93,50"
          fill="none" stroke="var(--gauge-track)" strokeWidth="7" strokeLinecap="round" />
        {/* Filled arc */}
        <path d="M 7,50 A 43,43 0 0 1 93,50"
          fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${filled} ${empty + 5}`}
          style={{ filter: `drop-shadow(0 0 5px ${color}99)` }}
        />
        {/* Score number — tema-aware */}
        <text x="50" y="47" textAnchor="middle"
          fill="var(--gauge-text)" fontSize="17" fontWeight="800" fontFamily="Inter, system-ui, sans-serif">
          {score}
        </text>
      </svg>
      <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

// ── Quick Shortcut pills ──────────────────────────────────────────────────────
const SHORTCUTS = [
  { label: 'Triple Confluence', href: '/radar',        color: 'text-purple-400 border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20' },
  { label: 'Foreign Flow',      href: '/foreign-flow', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20' },
  { label: 'Insider Alert',     href: '/insider',      color: 'text-orange-400 border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20' },
  { label: 'Sector Rotation',   href: '/sector',       color: 'text-teal-400 border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20' },
  { label: 'Breakout Scanner',  href: '/volume-aov',   color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20' },
  { label: 'Broker Flow',       href: '/broker-flow',  color: 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20' },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function MorningBrief() {
  const { pulse, topRadar, groups, alerts, stealth } = await getMorningBrief()

  if (!pulse) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Market data unavailable. Please try again.</p>
      </div>
    </div>
  )

  const breadthPct    = Number(pulse.stock_count) > 0
    ? Math.round((Number(pulse.gainers) / Number(pulse.stock_count)) * 100)
    : 0
  const foreignPositive = Number(pulse.foreign_miliar) >= 0
  const avgChg          = Number(pulse.avg_change_pct)
  const whaleCount      = Number(pulse.whale_count)

  // Market Intelligence Score (0–100) — composite of breadth, flow, whale, avg change
  const marketScore = Math.min(100, Math.round(
    breadthPct * 0.35 +
    (foreignPositive ? 20 : 0) +
    Math.min(whaleCount * 6, 18) +
    (avgChg > 0.5 ? 15 : avgChg > 0 ? 8 : 0) +
    (topRadar.filter((r: any) => r.radar_score >= 60).length > 3 ? 12 : 6)
  ))

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-6 animate-fade-in">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Morning Brief
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pulse.date} · T+1 data · Refresh setiap 60 detik
          </p>
        </div>
        <div className="inline-flex items-center text-xs text-muted-foreground border border-border/50 bg-card/50 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm max-w-max">
          <Globe className="w-4 h-4 mr-2 text-purple-400" />
          {pulse.stock_count?.toLocaleString('id-ID')} saham aktif dipantau
        </div>
      </div>

      {/* ── Quick Shortcuts ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map(s => (
          <Link key={s.href} href={s.href}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${s.color}`}>
            <ArrowRight size={10} />
            {s.label}
          </Link>
        ))}
      </div>

      {/* ── Hero Market Pulse ────────────────────────────────────────── */}
      <div className={`relative overflow-hidden glass rounded-2xl ${
        foreignPositive ? 'border-emerald-500/30' : 'border-red-500/30'
      }`}>
        {/* Subtle directional glow */}
        <div className={`absolute inset-0 pointer-events-none opacity-[0.07] ${
          foreignPositive
            ? 'bg-gradient-to-br from-emerald-500 via-emerald-900/30 to-transparent'
            : 'bg-gradient-to-br from-red-500 via-red-900/30 to-transparent'
        }`} />

        <div className="relative p-6">
          {/* Hero header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-start gap-4">
              <MarketScoreGauge score={marketScore} />
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 flex-wrap">
                  <Activity className={`w-5 h-5 ${foreignPositive ? 'text-emerald-400' : 'text-red-400'}`} />
                  Market:&nbsp;
                  <span className={foreignPositive ? 'text-emerald-400' : 'text-red-400'}>
                    {foreignPositive ? 'BULLISH' : 'BEARISH'}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Institutional flow &amp; breadth composite · Score {marketScore}/100
                </p>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-background/60 border border-white/[0.06] shadow-inner flex-shrink-0">
              <span className="text-xs text-muted-foreground">Whale Signals </span>
              <span className={`text-2xl font-black counter ${whaleCount > 0 ? 'text-purple-400' : 'text-muted-foreground'}`}>
                {whaleCount}
              </span>
              <span className="text-xs text-muted-foreground"> Active</span>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
            {([
              {
                label: 'Total Transaksi',
                value: fmtTriliunLoose(Number(pulse.val_triliun)),
                sub: 'Rp triliun',
                color: 'text-foreground',
                icon: Building2 as React.ElementType,
                bar: null as number | null,
                barColor: '',
              },
              {
                label: 'Net Foreign',
                value: `${Number(pulse.foreign_miliar) > 0 ? '+' : ''}${formatMiliar(Number(pulse.foreign_miliar))}`,
                sub: 'Rp miliar',
                color: foreignPositive ? 'text-emerald-400' : 'text-red-400',
                icon: Globe as React.ElementType,
                bar: null as number | null,
                barColor: '',
              },
              {
                label: 'Market Breadth',
                value: `${breadthPct}%`,
                sub: `${pulse.gainers} naik · ${pulse.losers} turun`,
                color: breadthPct >= 50 ? 'text-emerald-400' : 'text-red-400',
                icon: (breadthPct >= 50 ? TrendingUp : TrendingDown) as React.ElementType,
                bar: breadthPct as number | null,
                barColor: breadthPct >= 50 ? 'bg-emerald-500' : 'bg-red-500',
              },
              {
                label: 'Avg Change',
                value: `${avgChg > 0 ? '+' : ''}${avgChg.toFixed(2)}%`,
                sub: 'Rata-rata pergerakan',
                color: avgChg >= 0 ? 'text-emerald-400' : 'text-red-400',
                icon: Zap as React.ElementType,
                bar: null as number | null,
                barColor: '',
              },
            ]).map((k) => {
              const Icon = k.icon
              return (
                <div key={k.label} className="metric-card card-hover">
                  <div className="metric-label flex items-center gap-1.5">
                    <Icon className="w-3 h-3 opacity-60" />
                    {k.label}
                  </div>
                  <div className={`metric-value text-3xl mt-1 ${k.color}`}>{k.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 font-medium">{k.sub}</div>
                  {k.bar !== null && (
                    <div className="mt-2 h-1.5 w-full bg-background/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${k.barColor}`}
                        style={{ width: `${k.bar}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top Radar */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-heading">Top Radar Hari Ini</h2>
            <Link href="/radar" className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Lihat semua <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2 stagger">
            {(topRadar as any[]).map((s, i) => (
              <Link
                key={s.stock_code}
                href={`/stock/${s.stock_code}`}
                className={[
                  'p-3 rounded-xl glass card-hover block',
                  i === 0 ? 'col-span-2 border-amber-500/25 bg-gradient-to-r from-amber-500/5 to-transparent' : '',
                ].join(' ')}
              >
                {/* Top pick label */}
                {i === 0 && (
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-400/80 mb-1.5 flex items-center gap-1">
                    <Shield size={9} /> Top Pick
                  </div>
                )}

                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-sm">{s.stock_code}</span>
                  <ScoreBadge score={s.radar_score} />
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-sm font-semibold counter`}>
                    {Number(s.close).toLocaleString('id-ID')}
                  </span>
                  <span className={`text-xs font-medium ${Number(s.chg) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {Number(s.chg) >= 0 ? '+' : ''}{Number(s.chg).toFixed(2)}%
                  </span>
                </div>

                <div className="text-[10px] text-muted-foreground/80 truncate mb-2 leading-snug">
                  {s.composite_signal}
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                  <span className={`flex items-center gap-0.5 ${Number(s.fg7d) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <Globe size={9} />
                    {Number(s.fg7d) > 0 ? '+' : ''}{formatMiliar(Number(s.fg7d))}
                  </span>
                  <span className={Number(s.ksei) >= 0 ? 'text-sky-400' : 'text-red-400'}>
                    KSEI {Number(s.ksei) > 0 ? '+' : ''}{formatMiliar(Number(s.ksei))}
                  </span>
                  {s.whale_signal && <span className="text-purple-400">🐋 Whale</span>}
                  {s.fresh_insider_buy && <span className="text-orange-400">🔑 Insider</span>}
                </div>

                {/* Score bar */}
                <div className="mt-2.5 h-1 w-full bg-background/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.radar_score >= 70 ? 'bg-emerald-500' : s.radar_score >= 55 ? 'bg-sky-500' : 'bg-amber-500'}`}
                    style={{
                      width: `${s.radar_score}%`,
                      boxShadow: s.radar_score >= 70 ? '0 0 4px rgba(34,197,94,0.6)' : undefined,
                    }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column: Insider Alerts + Stealth */}
        <div className="space-y-5">

          {/* Insider Alerts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="section-heading">Insider Beli 7 Hari</h2>
              <Link href="/insider" className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors">
                Semua <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-1.5">
              {alerts.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">
                  Tidak ada insider buy 7 hari terakhir
                </p>
              )}
              {(alerts as any[]).map((a, i) => (
                <Link
                  key={i}
                  href={`/stock/${a.stock_code}`}
                  className="flex items-center justify-between p-2.5 rounded-xl glass card-hover"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs">{a.stock_code}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${
                        a.alert_level === 'HIGH'
                          ? 'bg-red-500/15 text-red-400 border-red-500/25'
                          : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      }`}>
                        {a.alert_level}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[130px] mt-0.5">
                      {a.insider_name}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-emerald-400 font-bold">
                      +{Number(a.pct_chg).toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">{a.days_ago}d lalu</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Stealth Accumulation */}
          {stealth.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="section-heading">Stealth Accumulation</h2>
                <Eye size={12} className="text-teal-400/60" />
              </div>
              <div className="space-y-2">
                {(stealth as any[]).map((s, i) => {
                  const intensity = Math.min((Math.abs(Number(s.cp_flow)) / 50) * 100, 100)
                  return (
                    <Link
                      key={i}
                      href={`/stock/${s.code}`}
                      className="block p-3 rounded-xl glass card-hover border-teal-500/20 hover:border-teal-500/40"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{s.code}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                            {s.signal}
                          </span>
                        </div>
                        <div className={`text-xs font-bold ${Number(s.chg) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(s.chg) >= 0 ? '+' : ''}{Number(s.chg).toFixed(2)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
                            <span>CP Flow</span>
                            <span className="text-teal-400 font-mono font-semibold">
                              {formatMiliar(Number(s.cp_flow))}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-background/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full"
                              style={{
                                width: `${intensity}%`,
                                boxShadow: '0 0 6px rgba(20,184,166,0.5)',
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-semibold counter text-foreground flex-shrink-0">
                          {Number(s.price).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Group Rotation Table ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-heading">Rotasi Konglomerat</h2>
          <Link href="/groups" className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 transition-colors">
            War Room <ArrowRight size={11} />
          </Link>
        </div>

        <div className="panel overflow-x-auto rounded-xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground">
                <th className="text-left py-2.5 px-4 font-semibold tracking-wide">Grup</th>
                <th className="text-center py-2.5 px-3 font-semibold tracking-wide">Score</th>
                <th className="text-left py-2.5 px-3 font-semibold tracking-wide">Phase</th>
                <th className="text-right py-2.5 px-3 font-semibold tracking-wide">Perf 1d</th>
                <th className="text-left py-2.5 px-3 font-semibold tracking-wide hidden md:table-cell">KSEI Trend</th>
                <th className="text-left py-2.5 px-3 font-semibold tracking-wide hidden lg:table-cell">Sinyal</th>
              </tr>
            </thead>
            <tbody>
              {(groups as any[]).map((g) => (
                <tr key={g.group_name} className="border-b border-border/30 tr-hover">
                  <td className="py-2.5 px-4">
                    <Link href="/groups" className="font-semibold hover:text-sky-400 transition-colors">
                      {g.group_name}
                    </Link>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <ScoreBadge score={g.composite_score} />
                  </td>
                  <td className="py-2.5 px-3">
                    <PhaseBadge phase={g.market_phase} />
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold counter ${
                    Number(g.perf_1d) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {Number(g.perf_1d) >= 0 ? '+' : ''}{Number(g.perf_1d).toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-3 hidden md:table-cell text-muted-foreground">
                    {g.smart_money_trend || '—'}
                  </td>
                  <td className="py-2.5 px-3 hidden lg:table-cell text-muted-foreground/80">
                    {g.group_action_signal}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer CTA ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href="/smart-money"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass card-hover text-xs font-semibold text-purple-300 border-purple-500/20">
          <BarChart2 size={13} />
          Smart Money Matrix
        </Link>
        <Link href="/screener"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass card-hover text-xs font-semibold text-amber-300 border-amber-500/20">
          <Zap size={13} />
          Screener Pro
        </Link>
        <Link href="/ksei1persen"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass card-hover text-xs font-semibold text-sky-300 border-sky-500/20">
          <Eye size={13} />
          KSEI &gt;1%
        </Link>
      </div>

    </div>
  )
}
