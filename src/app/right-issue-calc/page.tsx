'use client'
export const dynamic = 'force-dynamic'

import { useState, useMemo } from 'react'
import {
  Calculator, RotateCcw, Info, TrendingUp, TrendingDown,
  CheckCircle, AlertTriangle, DollarSign, Minus,
} from 'lucide-react'

/* ─── Helpers ─────────────────────────────────────────────── */
const n = (s: string) => Math.max(0, parseFloat(s.replace(/[^0-9.]/g, '')) || 0)
const fmt = (v: number, d = 0) =>
  !isFinite(v) || isNaN(v) ? '—' :
  v.toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtRp = (v: number) => `Rp${fmt(v)}`
const fmtPct = (v: number, d = 2) =>
  !isFinite(v) || isNaN(v) ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(d)}%`
const posNeg = (v: number) =>
  v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-muted-foreground'

/* ─── Types ───────────────────────────────────────────────── */
interface CalcResult {
  // Core
  TERP: number
  hmetdValue: number
  rightsOwned: number
  discountPct: number
  terpDropPct: number
  // Skenario A — Subscribe Penuh
  subCost: number
  subSharesAfter: number
  subAvgCost: number
  subPortAtTERP: number
  subInitialValue: number
  subPnlAtTERP: number
  subPnlPct: number
  breakevenSub: number
  breakevenVsTERP: number
  // Skenario B — Jual HMETD
  sellRevenue: number
  sellPortAtTERP: number
  sellPnlAtTERP: number
  sellPnlPct: number
  // Skenario C — Tidak Bertindak
  idlePortAtTERP: number
  idlePnlAtTERP: number
  idlePnlPct: number
  idleLossVsSell: number
  // Dilusi
  dilutionBefore: number
  dilutionNoSub: number
  dilutionFullSub: number
  dilutionDelta: number
  // Recommendation
  rec: 'subscribe' | 'partial' | 'sell' | 'avoid'
}

/* ─── Page ────────────────────────────────────────────────── */
export default function RightIssueCalcPage() {

  /* ── State ── */
  const [ticker,        setTicker]        = useState('')
  const [currentPrice,  setCurrentPrice]  = useState('')
  const [exercisePrice, setExercisePrice] = useState('')
  const [ratioNew,      setRatioNew]      = useState('1')
  const [ratioOld,      setRatioOld]      = useState('2')
  const [sharesOwned,   setSharesOwned]   = useState('')
  const [totalShares,   setTotalShares]   = useState('')

  const reset = () => {
    setTicker(''); setCurrentPrice(''); setExercisePrice('')
    setRatioNew('1'); setRatioOld('2'); setSharesOwned(''); setTotalShares('')
  }

  /* ── Parse inputs ── */
  const P  = n(currentPrice)
  const S  = n(exercisePrice)
  const rN = n(ratioNew)  || 1
  const rO = n(ratioOld)  || 1
  const Q  = n(sharesOwned)
  const T  = n(totalShares) * 1_000_000  // input juta lembar

  const valid = P > 0 && S > 0 && Q > 0

  /* ── Computation ── */
  const c = useMemo<CalcResult | null>(() => {
    if (!valid) return null

    /* TERP: untuk setiap rO saham lama, pemegang mendapat rN saham baru @ S */
    const TERP        = (rO * P + rN * S) / (rO + rN)
    const hmetdValue  = Math.max(0, TERP - S)
    const rightsOwned = Q * rN / rO
    const discountPct = ((P - S) / P) * 100
    const terpDropPct = ((TERP - P) / P) * 100

    /* ── Skenario A: Subscribe Penuh ── */
    const subCost         = rightsOwned * S
    const subSharesAfter  = Q + rightsOwned
    const subAvgCost      = (Q * P + subCost) / subSharesAfter
    const subInitialValue = Q * P + subCost
    const subPortAtTERP   = subSharesAfter * TERP
    const subPnlAtTERP    = subPortAtTERP - subInitialValue
    const subPnlPct       = (subPnlAtTERP / subInitialValue) * 100
    const breakevenSub    = subAvgCost
    const breakevenVsTERP = ((breakevenSub - TERP) / TERP) * 100

    /* ── Skenario B: Jual HMETD ── */
    const sellRevenue    = rightsOwned * hmetdValue
    const sellPortAtTERP = Q * TERP + sellRevenue
    const sellPnlAtTERP  = sellPortAtTERP - Q * P
    const sellPnlPct     = (sellPnlAtTERP / (Q * P)) * 100

    /* ── Skenario C: Tidak Bertindak ── */
    const idlePortAtTERP  = Q * TERP
    const idlePnlAtTERP   = idlePortAtTERP - Q * P
    const idlePnlPct      = (idlePnlAtTERP / (Q * P)) * 100
    const idleLossVsSell  = sellPortAtTERP - idlePortAtTERP

    /* ── Dilusi ── */
    let dilutionBefore = 0, dilutionNoSub = 0, dilutionFullSub = 0, dilutionDelta = 0
    if (T > 0) {
      const newTotal      = T * rN / rO
      dilutionBefore      = (Q / T) * 100
      dilutionNoSub       = (Q / (T + newTotal)) * 100
      dilutionFullSub     = ((Q + rightsOwned) / (T + newTotal)) * 100
      dilutionDelta       = dilutionNoSub - dilutionBefore
    }

    /* ── Rekomendasi ── */
    let rec: CalcResult['rec']
    if (S >= P)             rec = 'avoid'
    else if (discountPct >= 25) rec = 'subscribe'
    else if (discountPct >= 12) rec = 'partial'
    else                    rec = 'sell'

    return {
      TERP, hmetdValue, rightsOwned, discountPct, terpDropPct,
      subCost, subSharesAfter, subAvgCost, subPortAtTERP, subInitialValue, subPnlAtTERP, subPnlPct,
      breakevenSub, breakevenVsTERP,
      sellRevenue, sellPortAtTERP, sellPnlAtTERP, sellPnlPct,
      idlePortAtTERP, idlePnlAtTERP, idlePnlPct, idleLossVsSell,
      dilutionBefore, dilutionNoSub, dilutionFullSub, dilutionDelta,
      rec,
    }
  }, [P, S, rN, rO, Q, T, valid])

  /* ── Styling helpers ── */
  const inputCls = [
    'w-full px-3 py-2.5 rounded-xl text-sm font-semibold tabular-nums',
    'bg-background border border-border/50',
    'text-foreground placeholder:text-muted-foreground/35',
    'focus:outline-none focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/20',
    'transition-all duration-200',
  ].join(' ')
  const lbl = 'block text-[9.5px] font-black uppercase tracking-[0.13em] text-muted-foreground/55 mb-1.5'

  const recMeta = c ? {
    subscribe: { color: 'emerald', text: 'Subscribe Penuh',               icon: <CheckCircle size={16} className="text-emerald-400" /> },
    partial:   { color: 'gold',    text: 'Subscribe Sebagian + Jual Sisa', icon: <Calculator  size={16} className="text-gold-400" /> },
    sell:      { color: 'sky',     text: 'Jual HMETD di Pasar',            icon: <DollarSign  size={16} className="text-sky-400" /> },
    avoid:     { color: 'red',     text: 'Harga Tebus Tidak Menarik',      icon: <AlertTriangle size={16} className="text-red-400" /> },
  }[c.rec] : null

  /* ── Render ── */
  return (
    <div className="sidebar-offset max-w-[1200px] mx-auto px-4 md:px-6 py-6 space-y-5 pb-12 animate-fade-in">

      {/* ══════════════════ HEADER ══════════════════ */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(231,183,51,0.15), rgba(231,183,51,0.05))',
            border: '1px solid rgba(231,183,51,0.2)',
          }}>
          <Calculator size={18} className="text-gold-400" />
        </div>
        <div>
          <h1 className="text-xl font-black gradient-gold leading-none">Right Issue Calculator</h1>
          <p className="text-[11px] text-muted-foreground/55 mt-0.5">
            Kalkulasi TERP · Nilai HMETD · Skenario Subscribe · Dilusi Kepemilikan
          </p>
        </div>
        <button
          onClick={reset}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-all duration-200 active:scale-95"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      {/* ══════════════════ INPUT PANEL ══════════════════ */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/35">Parameter Input</p>

        {/* Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={lbl}>Kode Saham</label>
            <input
              value={ticker}
              onChange={e => setTicker(e.target.value.toUpperCase())}
              placeholder="Mis: BBCA"
              maxLength={6}
              className={inputCls}
            />
          </div>
          <div>
            <label className={lbl}>Harga Pasar Saat Ini (Rp)</label>
            <input
              value={currentPrice}
              onChange={e => setCurrentPrice(e.target.value)}
              placeholder="0"
              type="number"
              min="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={lbl}>Harga Tebus / Exercise (Rp)</label>
            <input
              value={exercisePrice}
              onChange={e => setExercisePrice(e.target.value)}
              placeholder="0"
              type="number"
              min="0"
              className={inputCls}
            />
          </div>
          <div>
            <label className={lbl}>Total Saham Beredar (juta lbr)</label>
            <input
              value={totalShares}
              onChange={e => setTotalShares(e.target.value)}
              placeholder="Opsional — utk dilusi"
              type="number"
              min="0"
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={lbl}>Rasio — HMETD (Baru)</label>
            <input
              value={ratioNew}
              onChange={e => setRatioNew(e.target.value)}
              type="number"
              min="1"
              className={inputCls}
            />
          </div>
          <div>
            <label className={lbl}>Rasio — per Saham Lama</label>
            <input
              value={ratioOld}
              onChange={e => setRatioOld(e.target.value)}
              type="number"
              min="1"
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className={lbl}>Jumlah Saham Dimiliki (lembar)</label>
            <input
              value={sharesOwned}
              onChange={e => setSharesOwned(e.target.value)}
              placeholder="Contoh: 50000  (= 500 lot)"
              type="number"
              min="0"
              className={inputCls}
            />
          </div>
        </div>

        {/* Rasio info chip */}
        {rN > 0 && rO > 0 && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gold-400/[0.04] border border-gold-400/20">
            <Info size={13} className="text-gold-400/60 shrink-0 mt-[1px]" />
            <p className="text-[11px] text-muted-foreground/65 leading-relaxed">
              Rasio{' '}
              <span className="font-black text-gold-400">{rN}:{rO}</span>
              {' '}— setiap <strong className="text-foreground/80">{rO} saham lama</strong> mendapat{' '}
              <strong className="text-foreground/80">{rN} HMETD</strong> untuk membeli {rN} saham baru dengan harga tebus.
              {Q > 0 && (
                <span>
                  {' '}Dengan <strong className="text-foreground/80">{fmt(Q)} lembar</strong>, Anda berhak atas{' '}
                  <span className="font-black text-gold-400">{fmt(Q * rN / rO)} HMETD</span>.
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* ══════════════════ RESULTS ══════════════════ */}
      {valid && c ? (
        <div className="space-y-5 stagger">

          {/* ─── Summary Cards ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* TERP */}
            <div className="glass rounded-2xl p-4 card-hover">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/45 mb-2">TERP</p>
              <p className="text-[26px] font-black text-foreground leading-none">{fmt(c.TERP)}</p>
              <p className={`text-[11px] font-semibold mt-1.5 ${posNeg(c.terpDropPct)}`}>
                {fmtPct(c.terpDropPct)} dari harga saat ini
              </p>
              <p className="text-[9px] text-muted-foreground/35 mt-1">Theoretical Ex-Rights Price</p>
            </div>

            {/* Nilai HMETD */}
            <div className="glass rounded-2xl p-4 card-hover">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/45 mb-2">Nilai HMETD</p>
              <p className="text-[26px] font-black text-gold-400 leading-none">{fmt(c.hmetdValue)}</p>
              <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                {fmt(c.rightsOwned)} HMETD diterima
              </p>
              <p className="text-[9px] text-muted-foreground/35 mt-1">Nilai teoritis per rights</p>
            </div>

            {/* Discount */}
            <div className="glass rounded-2xl p-4 card-hover">
              <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/45 mb-2">Discount Exercise</p>
              <p className={`text-[26px] font-black leading-none ${c.discountPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {c.discountPct.toFixed(1)}%
              </p>
              <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                {fmtRp(P)} → {fmtRp(S)}
              </p>
              <p className="text-[9px] text-muted-foreground/35 mt-1">Harga pasar vs harga tebus</p>
            </div>

            {/* Dilusi / Rights */}
            <div className="glass rounded-2xl p-4 card-hover">
              {T > 0 ? (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/45 mb-2">Dilusi (tanpa subscribe)</p>
                  <p className="text-[26px] font-black text-red-400 leading-none">
                    {Math.abs(c.dilutionDelta).toFixed(3)}%
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                    {c.dilutionBefore.toFixed(3)}% → {c.dilutionNoSub.toFixed(3)}%
                  </p>
                  <p className="text-[9px] text-muted-foreground/35 mt-1">Penurunan % kepemilikan</p>
                </>
              ) : (
                <>
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground/45 mb-2">HMETD Diterima</p>
                  <p className="text-[26px] font-black text-gold-400 leading-none">{fmt(c.rightsOwned)}</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-1.5">lembar HMETD</p>
                  <p className="text-[9px] text-muted-foreground/35 mt-1">Isi total beredar utk dilusi</p>
                </>
              )}
            </div>
          </div>

          {/* ─── Scenario Cards ─── */}
          <div>
            <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/35 mb-3">Analisis Skenario — Nilai Portofolio @ TERP</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* ── A: Subscribe Penuh ── */}
              <div className={`rounded-2xl p-5 border transition-all duration-200 ${
                c.rec === 'subscribe' || c.rec === 'partial'
                  ? 'border-emerald-500/35 bg-emerald-500/[0.04]'
                  : 'border-border/50 bg-card'
              }`}>
                {(c.rec === 'subscribe' || c.rec === 'partial') && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle size={11} className="text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.13em] text-emerald-400">
                      {c.rec === 'subscribe' ? 'Direkomendasikan' : 'Pertimbangkan'}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <TrendingUp size={14} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-foreground">Subscribe Penuh</p>
                    <p className="text-[9px] text-muted-foreground/45">Exercise semua HMETD</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {([
                    ['Modal tambahan',    `−${fmtRp(c.subCost)}`,             'text-red-400'],
                    ['Saham setelah',     `${fmt(c.subSharesAfter)} lbr`,      'text-foreground'],
                    ['Avg cost baru',     fmtRp(c.subAvgCost),                'text-foreground'],
                  ] as const).map(([label, val, cls]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">{label}</span>
                      <span className={`text-[11px] font-bold ${cls}`}>{val}</span>
                    </div>
                  ))}

                  <div className="border-t border-border/30 pt-2.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Portfolio @ TERP</span>
                      <span className="text-[12px] font-black text-foreground">{fmtRp(c.subPortAtTERP)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Total investasi</span>
                      <span className="text-[11px] font-semibold text-muted-foreground/50">{fmtRp(c.subInitialValue)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground/65">P&L @ TERP</span>
                      <div className="text-right">
                        <span className={`text-[12px] font-black ${posNeg(c.subPnlAtTERP)}`}>
                          {c.subPnlAtTERP >= 0 ? '+' : '−'}{fmtRp(Math.abs(c.subPnlAtTERP))}
                        </span>
                        <span className={`text-[9px] ml-1 ${posNeg(c.subPnlPct)}`}>
                          ({fmtPct(c.subPnlPct)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 mt-1">
                    <p className="text-[9px] text-emerald-400/75 leading-relaxed">
                      Break-even: <strong>{fmtRp(c.breakevenSub)}</strong>
                      {c.breakevenVsTERP <= 0
                        ? ' — sudah profit di TERP'
                        : ` (+${c.breakevenVsTERP.toFixed(1)}% di atas TERP)`}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── B: Jual HMETD ── */}
              <div className={`rounded-2xl p-5 border transition-all duration-200 ${
                c.rec === 'sell'
                  ? 'border-sky-500/35 bg-sky-500/[0.04]'
                  : 'border-border/50 bg-card'
              }`}>
                {c.rec === 'sell' && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <CheckCircle size={11} className="text-sky-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.13em] text-sky-400">Direkomendasikan</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-[10px] bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                    <DollarSign size={14} className="text-sky-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-foreground">Jual HMETD</p>
                    <p className="text-[9px] text-muted-foreground/45">Jual semua rights di pasar</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {([
                    ['Modal tambahan',    'Rp0',                               'text-muted-foreground/50'],
                    ['Pendapatan HMETD',  `+${fmtRp(c.sellRevenue)}`,          'text-emerald-400'],
                    ['Saham setelah',     `${fmt(Q)} lbr (tetap)`,             'text-foreground'],
                    ['Avg cost',          `${fmtRp(P)} (tetap)`,               'text-foreground'],
                  ] as const).map(([label, val, cls]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">{label}</span>
                      <span className={`text-[11px] font-bold ${cls}`}>{val}</span>
                    </div>
                  ))}

                  <div className="border-t border-border/30 pt-2.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Portfolio @ TERP</span>
                      <span className="text-[12px] font-black text-foreground">{fmtRp(c.sellPortAtTERP)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Nilai awal</span>
                      <span className="text-[11px] font-semibold text-muted-foreground/50">{fmtRp(Q * P)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground/65">P&L @ TERP</span>
                      <div className="text-right">
                        <span className={`text-[12px] font-black ${posNeg(c.sellPnlAtTERP)}`}>
                          {c.sellPnlAtTERP >= 0 ? '+' : '−'}{fmtRp(Math.abs(c.sellPnlAtTERP))}
                        </span>
                        <span className={`text-[9px] ml-1 ${posNeg(c.sellPnlPct)}`}>
                          ({fmtPct(c.sellPnlPct)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sky-500/[0.06] border border-sky-500/15 mt-1">
                    <p className="text-[9px] text-sky-400/75 leading-relaxed">
                      Tidak perlu modal tambahan. Tepat jika ingin tetap hold tapi menghindari dilusi.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── C: Tidak Bertindak ── */}
              <div className={`rounded-2xl p-5 border transition-all duration-200 ${
                c.rec === 'avoid'
                  ? 'border-amber-500/35 bg-amber-500/[0.04]'
                  : 'border-border/50 bg-card opacity-80'
              }`}>
                {c.rec === 'avoid' && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <AlertTriangle size={11} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.13em] text-amber-400">Perhatikan</span>
                  </div>
                )}

                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-[10px] bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                    <TrendingDown size={14} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-foreground">Tidak Bertindak</p>
                    <p className="text-[9px] text-muted-foreground/45">HMETD dibiarkan hangus</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {([
                    ['Modal tambahan',    'Rp0',                               'text-muted-foreground/50'],
                    ['Pendapatan HMETD',  'Rp0 (hangus)',                      'text-red-400/70'],
                    ['Saham setelah',     `${fmt(Q)} lbr (tetap)`,             'text-foreground'],
                  ] as const).map(([label, val, cls]) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">{label}</span>
                      <span className={`text-[11px] font-bold ${cls}`}>{val}</span>
                    </div>
                  ))}

                  <div className="border-t border-border/30 pt-2.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Portfolio @ TERP</span>
                      <span className="text-[12px] font-black text-foreground">{fmtRp(c.idlePortAtTERP)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Nilai awal</span>
                      <span className="text-[11px] font-semibold text-muted-foreground/50">{fmtRp(Q * P)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-muted-foreground/65">P&L @ TERP</span>
                      <div className="text-right">
                        <span className={`text-[12px] font-black ${posNeg(c.idlePnlAtTERP)}`}>
                          {c.idlePnlAtTERP >= 0 ? '+' : '−'}{fmtRp(Math.abs(c.idlePnlAtTERP))}
                        </span>
                        <span className={`text-[9px] ml-1 ${posNeg(c.idlePnlPct)}`}>
                          ({fmtPct(c.idlePnlPct)})
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground/55">Kerugian vs Jual HMETD</span>
                      <span className="text-[11px] font-bold text-red-400">−{fmtRp(c.idleLossVsSell)}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-red-500/[0.06] border border-red-500/15 mt-1">
                    <p className="text-[9px] text-red-400/75 leading-relaxed">
                      Dilusi tanpa kompensasi. Selalu minimal jual HMETD sebelum kadaluarsa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Dilution Analysis ─── */}
          {T > 0 && (
            <div className="glass rounded-2xl p-5">
              <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/35 mb-4">
                Analisis Dilusi Kepemilikan
              </p>
              <div className="grid grid-cols-3 gap-4">
                {([
                  ['Sebelum Rights Issue', c.dilutionBefore.toFixed(3) + '%', 'text-foreground', 'border-border/50'],
                  ['Tidak Subscribe',      c.dilutionNoSub.toFixed(3)  + '%', 'text-red-400',     'border-red-500/25'],
                  ['Subscribe Penuh',      c.dilutionFullSub.toFixed(3)+ '%', 'text-emerald-400', 'border-emerald-500/25'],
                ] as const).map(([label, val, cls, border]) => (
                  <div key={label} className={`text-center p-4 rounded-xl bg-background border ${border}`}>
                    <p className="text-[8.5px] font-black uppercase tracking-[0.1em] text-muted-foreground/45 mb-2 leading-relaxed">{label}</p>
                    <p className={`text-[22px] font-black ${cls} leading-none`}>{val}</p>
                    <p className="text-[9px] text-muted-foreground/35 mt-1.5">kepemilikan Anda</p>
                  </div>
                ))}
              </div>
              {c.dilutionDelta < 0 && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-500/[0.05] border border-red-500/15">
                  <AlertTriangle size={12} className="text-red-400/70 shrink-0" />
                  <p className="text-[10px] text-muted-foreground/60">
                    Tidak subscribe menyebabkan kepemilikan terdilusi{' '}
                    <strong className="text-red-400">{Math.abs(c.dilutionDelta).toFixed(3)}%</strong>
                    {' '}— setara kehilangan nilai{' '}
                    <strong className="text-red-400">{fmtRp(c.idleLossVsSell)}</strong> vs menjual HMETD.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ─── Decision Recommendation ─── */}
          {recMeta && (
            <div className={`rounded-2xl p-5 border ${
              c.rec === 'subscribe' ? 'border-emerald-500/30 bg-emerald-500/[0.04]' :
              c.rec === 'partial'   ? 'border-gold-400/30 bg-gold-400/[0.04]'     :
              c.rec === 'sell'      ? 'border-sky-500/30 bg-sky-500/[0.04]'       :
              'border-red-500/30 bg-red-500/[0.04]'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${
                  c.rec === 'subscribe' ? 'bg-emerald-500/15 border border-emerald-500/25' :
                  c.rec === 'partial'   ? 'bg-gold-400/15 border border-gold-400/25'       :
                  c.rec === 'sell'      ? 'bg-sky-500/15 border border-sky-500/25'         :
                  'bg-red-500/15 border border-red-500/25'
                }`}>
                  {recMeta.icon}
                </div>
                <div className="flex-1">
                  <p className={`text-[13px] font-black mb-1.5 ${
                    c.rec === 'subscribe' ? 'text-emerald-400' :
                    c.rec === 'partial'   ? 'text-gold-400'    :
                    c.rec === 'sell'      ? 'text-sky-400'     :
                    'text-red-400'
                  }`}>
                    Rekomendasi: {recMeta.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground/65 leading-relaxed">
                    {c.rec === 'subscribe' &&
                      `Discount harga tebus sebesar ${c.discountPct.toFixed(1)}% tergolong sangat menarik. Nilai HMETD teoritis Rp${fmt(c.hmetdValue)} per lembar. Subscribe penuh mengunci rata-rata harga beli di Rp${fmt(c.subAvgCost, 0)}, di bawah TERP Rp${fmt(c.TERP, 0)}${c.breakevenVsTERP <= 0 ? ', dan sudah profitable di harga TERP' : `. Break-even di Rp${fmt(c.breakevenSub, 0)} (+${c.breakevenVsTERP.toFixed(1)}% dari TERP)`}. Pastikan fundamental emiten mendukung untuk jangka menengah.`}
                    {c.rec === 'partial' &&
                      `Discount ${c.discountPct.toFixed(1)}% cukup menarik. Pertimbangkan subscribe sebagian sesuai kemampuan modal, dan jual sisa HMETD di pasar untuk mengkompensasi biaya. Break-even subscribe di Rp${fmt(c.breakevenSub, 0)}. Analisis kualitas emiten sebelum memutuskan proporsi subscribe.`}
                    {c.rec === 'sell' &&
                      `Discount exercise hanya ${c.discountPct.toFixed(1)}%, kurang menarik untuk menambah posisi. Lebih efisien menjual HMETD di pasar dengan estimasi nilai Rp${fmt(c.hmetdValue)} per rights, total potensi ${fmtRp(c.sellRevenue)}, tanpa perlu menambah modal. Jangan biarkan HMETD hangus.`}
                    {c.rec === 'avoid' &&
                      `Harga tebus (Rp${fmt(S)}) berada di atas atau sangat dekat harga pasar (Rp${fmt(P)}). HMETD tidak memiliki nilai intrinsik (nilai teoritis = Rp${fmt(c.hmetdValue)}). Tidak ada insentif untuk subscribe. Pertimbangkan evaluasi ulang posisi jika rights issue ini dinilai merugikan pemegang saham.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── Comparison Table ─── */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/50 flex items-center gap-2">
              <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/35">
                Ringkasan Perbandingan
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-card/70 border-b border-border/40">
                    <th className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground/40 w-[200px]">
                      Parameter
                    </th>
                    <th className="text-right px-5 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-400/60">
                      Subscribe
                    </th>
                    <th className="text-right px-5 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-sky-400/60">
                      Jual HMETD
                    </th>
                    <th className="text-right px-5 py-3 text-[9px] font-black uppercase tracking-[0.12em] text-red-400/60">
                      Tidak Bertindak
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {[
                    ['Modal Tambahan',       fmtRp(c.subCost),           'Rp0',                   'Rp0'],
                    ['Pendapatan HMETD',     '—',                        `+${fmtRp(c.sellRevenue)}`, 'Rp0'],
                    ['Saham Akhir (lbr)',    fmt(c.subSharesAfter),      fmt(Q),                  fmt(Q)],
                    ['Avg Cost per Saham',   fmtRp(c.subAvgCost),        fmtRp(P),                fmtRp(P)],
                    ['Portfolio @ TERP',     fmtRp(c.subPortAtTERP),     fmtRp(c.sellPortAtTERP), fmtRp(c.idlePortAtTERP)],
                    ['P&L @ TERP',           fmtPct(c.subPnlPct),        fmtPct(c.sellPnlPct),   fmtPct(c.idlePnlPct)],
                  ].map(([label, a, b, cc]) => (
                    <tr key={label} className="tr-hover">
                      <td className="px-5 py-2.5 text-muted-foreground/55 font-semibold">{label}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-foreground/80">{a}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-foreground/80">{b}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-foreground/80">{cc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Key Notes ─── */}
          <div className="glass rounded-2xl p-5">
            <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-muted-foreground/35 mb-3">
              Hal Penting yang Perlu Diperhatikan
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[
                ['TERP bersifat teoritis', 'Harga saham aktual setelah ex-date bisa berbeda jauh dari TERP tergantung sentimen & kondisi market.'],
                ['Likuiditas HMETD',       'Tidak semua HMETD aktif diperdagangkan. Cek volume pasar HMETD sebelum mengandalkan nilai teoritis.'],
                ['Periode HMETD terbatas', 'HMETD memiliki tanggal kadaluarsa. Pastikan Anda bertindak sebelum masa berlaku habis.'],
                ['Faktor fundamental',     'Keputusan subscribe idealnya mempertimbangkan kualitas bisnis, penggunaan dana rights, dan valuasi pasca rights.'],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-2.5 p-3 rounded-xl bg-background border border-border/40">
                  <div className="w-1 rounded-full bg-gold-400/40 shrink-0 self-stretch" />
                  <div>
                    <p className="text-[10px] font-black text-foreground/70 mb-0.5">{title}</p>
                    <p className="text-[9.5px] text-muted-foreground/50 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[9px] text-muted-foreground/25 text-center leading-relaxed px-4">
            Kalkulasi berdasarkan TERP teoritis hari ex-date. Bukan merupakan rekomendasi investasi.
            Selalu lakukan due diligence sebelum mengambil keputusan. Nilai aktual HMETD dapat berbeda.
          </p>

        </div>

      ) : (

        /* ── Empty State ── */
        <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(231,183,51,0.08), rgba(231,183,51,0.03))',
              border: '1px solid rgba(231,183,51,0.12)',
            }}>
            <Calculator size={28} className="text-gold-400/35" />
          </div>
          <p className="text-[14px] font-bold text-muted-foreground/40">
            Isi parameter untuk mulai kalkulasi
          </p>
          <p className="text-[11px] text-muted-foreground/25 mt-1.5 max-w-sm">
            Minimal diperlukan: Harga Saat Ini · Harga Tebus · Rasio Rights · Jumlah Saham Dimiliki
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {['TERP', 'Nilai HMETD', 'Discount %', 'Skenario Subscribe', 'Skenario Jual', 'Dilusi Kepemilikan'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-[9px] font-bold bg-gold-400/[0.06] border border-gold-400/15 text-gold-400/50">
                {tag}
              </span>
            ))}
          </div>
        </div>

      )}
    </div>
  )
}
