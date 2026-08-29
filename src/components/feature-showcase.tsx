'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Maximize2,
  Sparkles, ArrowRight, CheckCircle2, Eye
} from 'lucide-react'
import Link from 'next/link'

interface ShotItem {
  id: string
  src: string
  title: string
  category: 'sinyal' | 'funda' | 'whale' | 'flow'
  categoryLabel: string
  tag?: string
  tagColor?: string
  desc: string
  highlights: string[]
}

const CATEGORIES = [
  { key: 'all', label: 'Semua Fitur (14)' },
  { key: 'sinyal', label: '🎯 Sinyal & Backtest' },
  { key: 'funda', label: '📊 Fundamental' },
  { key: 'whale', label: '🐋 Smart Money & Broker' },
  { key: 'flow', label: '🌐 Foreign & Institusi' },
]

const SHOTS: ShotItem[] = [
  {
    id: 'backtest-lab',
    src: '/screenshots/backtest-lab.webp',
    title: 'Backtest Lab & Signal Accuracy',
    category: 'sinyal',
    categoryLabel: 'Akurasi Sinyal',
    tag: 'HOT',
    tagColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    desc: 'Uji akurasi 10 preset sinyal smart money terhadap 900+ saham IDX secara historis. Ketahui Win Rate riil, Max Potential Gain, dan Drawdown sebelum trading dengan modal nyata.',
    highlights: ['Win Rate Historis 80.0%', 'Multi-Stock Forward Return', 'Max Potential Gain (MFE)'],
  },
  {
    id: 'screener-fundamental',
    src: '/screenshots/screener-fundamental.webp',
    title: 'Fundamental & Valuation Screener',
    category: 'funda',
    categoryLabel: 'Fundamental',
    tag: 'NEW',
    desc: 'Screening 46 rasio keuangan komprehensif. Saring emiten undervalue (PER, PBV, PEG), profitabilitas tinggi (ROE, ROA, NPM), serta struktur modal aman (DER, Current Ratio, Altman Z).',
    highlights: ['46 Rasio Keuangan Lengkap', 'Piotroski F-Score & Altman Z', 'Free Cash Flow Tracker'],
  },
  {
    id: 'keystats-stock-detail',
    src: '/screenshots/keystats-stock-detail.webp',
    title: 'Key Stats & Diagnosa Fundamental',
    category: 'funda',
    categoryLabel: 'Fundamental',
    tag: 'NEW',
    desc: 'Diagnosa fundamental instan berbasis AI, Skor Kesehatan Fundamental (0-100), dan visualisasi traffic light (🟢 Hijau = Sehat, 🟡 Kuning = Wajar, 🔴 Merah = Waspada).',
    highlights: ['Skor Kesehatan 0-100', 'Highlight Traffic Light', 'AI-Style Diagnosis Verdict'],
  },
  {
    id: 'screener-pro',
    src: '/screenshots/screener-pro.webp',
    title: 'Screener Pro IDX',
    category: 'sinyal',
    categoryLabel: 'Screener',
    tag: 'PRO',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    desc: 'Filter 900+ saham IDX dengan 15+ sinyal smart money dan teknikal terintegrasi dalam satu lembar kerja interaktif.',
    highlights: ['15+ Kombinasi Sinyal', 'Volume & AOV Filter', 'Realtime Multi-Condition'],
  },
  {
    id: 'foreign-flow',
    src: '/screenshots/foreign-flow-inteligence.webp',
    title: 'Foreign Flow Intelligence',
    category: 'flow',
    categoryLabel: 'Foreign Flow',
    tag: 'PRO',
    tagColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    desc: 'Grafik harga vs kumulatif net foreign buy/sell harian. Deteksi akumulasi senyap investor asing sebelum harga bergerak.',
    highlights: ['Kumulatif Net Foreign Flow', 'Divergensi Harga vs Flow', 'Filter Sektor Asing'],
  },
  {
    id: 'broker-summary',
    src: '/screenshots/broker-summary.webp',
    title: 'Broker Summary & Top Accumulation',
    category: 'whale',
    categoryLabel: 'Bandarmologi',
    tag: 'PRO',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    desc: 'Bedah broker dominan, pembeli dan penjual terbesar, serta konsistensi akumulasi dan distribusi per emiten harian.',
    highlights: ['Top 5 Net Buyer & Seller', 'Broker Average Price', 'Klasifikasi Smart Broker'],
  },
  {
    id: 'inventory-analysis',
    src: '/screenshots/inventory-broker-analysis.webp',
    title: 'Inventory Broker Analysis',
    category: 'whale',
    categoryLabel: 'Bandarmologi',
    desc: 'Lacak grafik kepemilikan kumulatif tiap broker dari waktu ke waktu untuk mengetahui apakah bandar sedang menimbun atau melepas barang.',
    highlights: ['Garis Inventory Kumulatif', 'Overlay Candle Harga', 'Deteksi Distribusi Halus'],
  },
  {
    id: 'broker-concentration',
    src: '/screenshots/broker-consentration-screener.webp',
    title: 'Broker Concentration Screener',
    category: 'whale',
    categoryLabel: 'Bandarmologi',
    desc: 'Saring saham-saham dengan konsentrasi broker tertinggi, peringkat skor Smart Money, dan net foreign flow positif.',
    highlights: ['Skor Konsentrasi Bandar', 'Whale Volume Detector', 'Filter Dominasi Akumulasi'],
  },
  {
    id: 'ksei-intelligence',
    src: '/screenshots/ksei-1persen-inteligence.webp',
    title: 'KSEI >1% Ownership Intelligence',
    category: 'flow',
    categoryLabel: 'Kepemilikan',
    tag: 'PRO',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'Pantau data kepemilikan investor besar KSEI di atas 1%, deteksi perpindahan saham, dan lacak Major Holder 900+ emiten.',
    highlights: ['Data KSEI >1% Harian', 'Perubahan Bulanan Pemegang Saham', 'Stealth Accumulation Alert'],
  },
  {
    id: 'group-intelligence',
    src: '/screenshots/group-inteligence.webp',
    title: 'Group Intelligence Konglomerat',
    category: 'flow',
    categoryLabel: 'Konglomerasi',
    desc: 'Analisis perputaran dana per grup konglomerasi besar di Indonesia: Barito, Sinarmas, Salim, Astra, Djarum, Bakrie, dan lainnya.',
    highlights: ['Tracking Grup Konglomerat', 'Net Flow per Ekosistem', 'Rotasi Sektor & Induk Usaha'],
  },
  {
    id: 'screener-msci',
    src: '/screenshots/screener-msci.webp',
    title: 'MSCI Eligibility Screener',
    category: 'flow',
    categoryLabel: 'Indeks Global',
    desc: 'Deteksi dini calon emiten yang berpotensi masuk (Inclusion) atau keluar (Exclusion) dari indeks global MSCI Indonesia.',
    highlights: ['Kalkulasi Bobot Free Float', 'Skor Kelayakan MSCI', 'Peluang Inflow Asing Masif'],
  },
  {
    id: 'screener-ftse',
    src: '/screenshots/screener-ftse.webp',
    title: 'FTSE GEIS Screener',
    category: 'flow',
    categoryLabel: 'Indeks Global',
    desc: 'Saring kelayakan emiten terhadap kriteria FTSE GEIS: uji likuiditas median bulanan, free float, dan batas minimum kapitalisasi pasar.',
    highlights: ['Liquidity Rule Testing', 'Large/Mid/Small Cap Filter', 'Proyeksi Rebalancing'],
  },
  {
    id: 'screener-breakout',
    src: '/screenshots/screener-breakout.webp',
    title: 'Breakout & Volume Anomaly Scanner',
    category: 'sinyal',
    categoryLabel: 'Teknikal',
    desc: 'Kombinasi anomali Average Order Value (AOV), ledakan volume transaksi, dan penembusan level resisten teknikal.',
    highlights: ['AOV Surge Detector', 'Volume Spike vs Rata-rata 20 Hari', 'Resistance Breakout Alert'],
  },
  {
    id: 'right-issue',
    src: '/screenshots/right-issue-calc.webp',
    title: 'Rights Issue Calculator',
    category: 'funda',
    categoryLabel: 'Aksi Korporasi',
    desc: 'Kalkulator cerdas menghitung harga teoretis tebus, potensi efek dilusi kepemilikan, dan estimasi modal yang dibutuhkan.',
    highlights: ['Harga Teoretis Otomatis', 'Kalkulasi Dilusi Persentase', 'Estimasi Kebutuhan Dana'],
  },
]

export default function FeatureShowcase() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeIdx, setActiveIdx] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const filteredShots = activeCategory === 'all'
    ? SHOTS
    : SHOTS.filter(s => s.category === activeCategory)

  const currentShot = filteredShots[activeIdx] || filteredShots[0] || SHOTS[0]

  const handleNext = useCallback(() => {
    setActiveIdx((prev) => (prev + 1) % filteredShots.length)
  }, [filteredShots.length])

  const handlePrev = useCallback(() => {
    setActiveIdx((prev) => (prev - 1 + filteredShots.length) % filteredShots.length)
  }, [filteredShots.length])

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false)
        if (e.key === 'ArrowRight') handleNext()
        if (e.key === 'ArrowLeft') handlePrev()
      }
    }

    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLightboxOpen, handleNext, handlePrev])

  return (
    <section className="space-y-8 scroll-mt-24" id="showcase">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.20em] text-primary">
          <Sparkles size={12} />
          Cuplikan Nyata Platform
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-foreground">
          Eksplorasi Fitur &amp; Tampilan Visual
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground/75 max-w-xl mx-auto leading-relaxed">
          Pilih kategori di bawah untuk melihat layar fitur dalam resolusi HD. Klik gambar untuk mode layar penuh.
        </p>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => {
                setActiveCategory(cat.key)
                setActiveIdx(0)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat.key
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 scale-105'
                  : 'bg-surface-2 hover:bg-surface-3 border border-border/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════ MAIN HERO STAGE (PREMIUM STUDIO) ════════════════════ */}
      <div className="bento-card p-5 sm:p-8 border border-amber-500/30 bg-card/90 shadow-2xl relative overflow-hidden">
        
        {/* Amber Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none bg-amber-400" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Side: Info & Bullets */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-500 font-mono text-[10px] font-black uppercase">
                {currentShot.categoryLabel}
              </span>
              {currentShot.tag && (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black">
                  {currentShot.tag}
                </span>
              )}
              <span className="text-[10px] font-mono text-muted-foreground/60 ml-auto">
                {activeIdx + 1} / {filteredShots.length}
              </span>
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-black text-foreground leading-tight">
                {currentShot.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground/80 leading-relaxed mt-2">
                {currentShot.desc}
              </p>
            </div>

            {/* Highlights bullet points */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              {currentShot.highlights.map((h) => (
                <div key={h} className="flex items-center gap-2 text-xs font-bold text-foreground/90">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-xs text-slate-950 btn-gradient-gold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Maximize2 size={14} />
                <span>Buka Layar Penuh (Zoom)</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border/50 text-foreground transition-all active:scale-90"
                  title="Fitur Sebelumnya"
                  aria-label="Sebelumnya"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border/50 text-foreground transition-all active:scale-90"
                  title="Fitur Berikutnya"
                  aria-label="Berikutnya"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Big HD Stage Image */}
          <div className="lg:col-span-7">
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="group relative aspect-[16/9] rounded-2xl overflow-hidden border-2 border-border/80 hover:border-amber-500/80 transition-all duration-300 cursor-pointer shadow-2xl bg-slate-950"
            >
              {/* Browser bar */}
              <div className="px-3.5 py-2 bg-surface-2 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[10px] font-mono text-muted-foreground/60 truncate">
                    https://bdmflow.web.id/{currentShot.id}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Eye size={12} />
                  <span>Klik untuk Zoom</span>
                </span>
              </div>

              {/* Direct image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentShot.src}
                alt={currentShot.title}
                className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <span className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-2xl scale-95 group-hover:scale-100 transition-transform">
                  <Maximize2 size={15} />
                  Perbesar Resolusi HD Penuh
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Thumbnail Selector Strip */}
        <div className="mt-8 pt-5 border-t border-border/40">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {filteredShots.map((shot, idx) => {
              const isSelected = idx === activeIdx
              return (
                <button
                  key={shot.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex-shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden text-left border transition-all ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105 shadow-lg shadow-amber-500/20'
                      : 'border-border/50 opacity-60 hover:opacity-100 hover:border-border'
                  }`}
                >
                  <div className="aspect-[16/9] bg-slate-950 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot.src}
                      alt={shot.title}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="p-2 bg-surface-2">
                    <p className="text-[10px] sm:text-[11px] font-bold text-foreground truncate">
                      {shot.title}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* ════════════════════ FULLSCREEN LIGHTBOX MODAL (WIDE HORIZONTAL 96vw) ════════════════════ */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4 cursor-zoom-out select-none animate-fade-in"
          onClick={() => setIsLightboxOpen(false)} // CLICK ANYWHERE OUTSIDE CLOSES INSTANTLY!
        >
          {/* Main Modal Box — Expands to maximum screen width & height */}
          <div
            className="relative w-full max-w-[96vw] xl:max-w-[1550px] h-[92vh] flex flex-col items-center justify-between cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Title & Close Button */}
            <div className="w-full flex items-center justify-between gap-3 pb-2 text-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs font-mono shrink-0">
                  {activeIdx + 1} / {filteredShots.length}
                </span>
                <div className="min-w-0 flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white truncate">
                    {currentShot.title}
                  </h4>
                  <span className="text-xs text-white/60 hidden md:inline truncate">
                    — {currentShot.desc}
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsLightboxOpen(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-white font-bold text-xs transition-all shrink-0 shadow-lg cursor-pointer active:scale-95"
                title="Tutup (Esc atau klik di luar)"
              >
                <span>Tutup</span>
                <X size={16} />
              </button>
            </div>

            {/* Image Stage Container — Maximized horizontally & vertically */}
            <div className="relative w-full flex-1 rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_0_80px_rgba(0,0,0,0.95)] bg-slate-950 flex items-center justify-center">
              {/* Prev Button */}
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-black/80 hover:bg-amber-500 hover:text-black border border-white/25 text-white backdrop-blur-md transition-all active:scale-90 shadow-2xl cursor-pointer"
                title="Sebelumnya (←)"
                aria-label="Sebelumnya"
              >
                <ChevronLeft size={28} />
              </button>

              {/* The Big Picture — Fits width & height without letterbox constraint */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentShot.src}
                alt={currentShot.title}
                className="w-full h-full object-contain bg-slate-950"
              />

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-black/80 hover:bg-amber-500 hover:text-black border border-white/25 text-white backdrop-blur-md transition-all active:scale-90 shadow-2xl cursor-pointer"
                title="Berikutnya (→)"
                aria-label="Berikutnya"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {/* Bottom Bar Hints & Indicators */}
            <div className="w-full flex items-center justify-between px-2 pt-2 text-[11px] text-white/50 shrink-0">
              <p className="flex items-center gap-1.5">
                <span>💡</span> Klik di mana pun di luar kotak gambar atau tekan <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-white/80 font-mono text-[10px]">ESC</kbd> untuk menutup.
              </p>
              <div className="hidden sm:flex items-center gap-1.5">
                {filteredShots.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === activeIdx
                        ? 'w-6 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        : 'w-1.5 bg-white/30 hover:bg-white/60'
                    }`}
                    title={`Lihat #${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
