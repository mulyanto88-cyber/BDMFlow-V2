'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2,
  Sparkles, ArrowRight, CheckCircle2, Shield, Eye, Flame, PieChart,
  Search, Brain, Globe, BarChart2, Layers
} from 'lucide-react'
import Link from 'next/link'

interface ShotItem {
  id: string
  src: string
  fallbackSrc: string
  title: string
  category: 'sinyal' | 'funda' | 'whale' | 'flow'
  categoryLabel: string
  tag?: string
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
    fallbackSrc: '/screenshots/backtest-lab.png',
    title: 'Backtest Lab & Signal Accuracy',
    category: 'sinyal',
    categoryLabel: 'Akurasi Sinyal',
    tag: 'HOT',
    desc: 'Uji akurasi 10 preset sinyal smart money terhadap 900+ saham IDX secara historis. Ketahui Win Rate riil, Max Potential Gain, dan Drawdown sebelum trading dengan modal nyata.',
    highlights: ['Win Rate Historis 80.0%', 'Multi-Stock Forward Return', 'Max Potential Gain (MFE)'],
  },
  {
    id: 'screener-fundamental',
    src: '/screenshots/screener-fundamental.webp',
    fallbackSrc: '/screenshots/screener-fundamental.png',
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
    fallbackSrc: '/screenshots/keystats-stock-detail.png',
    title: 'Key Stats & Valuation Detail',
    category: 'funda',
    categoryLabel: 'Fundamental',
    tag: 'NEW',
    desc: 'Diagnosa fundamental instan berbasis AI, Skor Kesehatan Fundamental (0-100), dan visualisasi traffic light (🟢 Hijau = Sehat, 🟡 Kuning = Wajar, 🔴 Merah = Waspada).',
    highlights: ['Skor Kesehatan 0-100', 'Highlight Traffic Light', 'AI-Style Diagnosis Verdict'],
  },
  {
    id: 'screener-pro',
    src: '/screenshots/screener-pro.webp',
    fallbackSrc: '/screenshots/screener-pro.png',
    title: 'Screener Pro IDX',
    category: 'sinyal',
    categoryLabel: 'Screener',
    tag: 'PRO',
    desc: 'Filter 900+ saham IDX dengan 15+ sinyal smart money dan teknikal terintegrasi dalam satu lembar kerja interaktif.',
    highlights: ['15+ Kombinasi Sinyal', 'Volume & AOV Filter', 'Realtime Multi-Condition'],
  },
  {
    id: 'foreign-flow',
    src: '/screenshots/foreign-flow-inteligence.webp',
    fallbackSrc: '/screenshots/foreign-flow-inteligence.png',
    title: 'Foreign Flow Intelligence',
    category: 'flow',
    categoryLabel: 'Foreign Flow',
    desc: 'Grafik harga vs kumulatif net foreign buy/sell harian. Deteksi akumulasi senyap investor asing sebelum harga bergerak.',
    highlights: ['Kumulatif Net Foreign Flow', 'Divergensi Harga vs Flow', 'Filter Sektor Asing'],
  },
  {
    id: 'broker-summary',
    src: '/screenshots/broker-summary.webp',
    fallbackSrc: '/screenshots/broker-summary.png',
    title: 'Broker Summary & Top Accumulation',
    category: 'whale',
    categoryLabel: 'Bandarmologi',
    desc: 'Bedah broker dominan, pembeli dan penjual terbesar, serta konsistensi akumulasi dan distribusi per emiten harian.',
    highlights: ['Top 5 Net Buyer & Seller', 'Broker Average Price', 'Klasifikasi Smart Broker'],
  },
  {
    id: 'inventory-analysis',
    src: '/screenshots/inventory-broker-analysis.webp',
    fallbackSrc: '/screenshots/inventory-broker-analysis.png',
    title: 'Inventory Broker Analysis',
    category: 'whale',
    categoryLabel: 'Bandarmologi',
    desc: 'Lacak grafik kepemilikan kumulatif tiap broker dari waktu ke waktu untuk mengetahui apakah bandar sedang menimbun atau melepas barang.',
    highlights: ['Garis Inventory Kumulatif', 'Overlay Candle Harga', 'Deteksi Distribusi Halus'],
  },
  {
    id: 'broker-concentration',
    src: '/screenshots/broker-consentration-screener.webp',
    fallbackSrc: '/screenshots/broker-consentration-screener.png',
    title: 'Broker Concentration Screener',
    category: 'whale',
    categoryLabel: 'Bandarmologi',
    desc: 'Saring saham-saham dengan konsentrasi broker tertinggi, peringkat skor Smart Money, dan net foreign flow positif.',
    highlights: ['Skor Konsentrasi Bandar', 'Whale Volume Detector', 'Filter Dominasi Akumulasi'],
  },
  {
    id: 'ksei-intelligence',
    src: '/screenshots/ksei-1persen-inteligence.webp',
    fallbackSrc: '/screenshots/ksei-1persen-inteligence.png',
    title: 'KSEI >1% Ownership Intelligence',
    category: 'flow',
    categoryLabel: 'Kepemilikan',
    desc: 'Pantau data kepemilikan investor besar KSEI di atas 1%, deteksi perpindahan saham, dan lacak Major Holder 900+ emiten.',
    highlights: ['Data KSEI >1% Harian', 'Perubahan Bulanan Pemegang Saham', 'Stealth Accumulation Alert'],
  },
  {
    id: 'group-intelligence',
    src: '/screenshots/group-inteligence.webp',
    fallbackSrc: '/screenshots/group-inteligence.png',
    title: 'Group Intelligence Konglomerat',
    category: 'flow',
    categoryLabel: 'Konglomerasi',
    desc: 'Analisis perputaran dana per grup konglomerasi besar di Indonesia: Barito, Sinarmas, Salim, Astra, Djarum, Bakrie, dan lainnya.',
    highlights: ['Tracking Grup Konglomerat', 'Net Flow per Ekosistem', 'Rotasi Sektor & Induk Usaha'],
  },
  {
    id: 'screener-msci',
    src: '/screenshots/screener-msci.webp',
    fallbackSrc: '/screenshots/screener-msci.png',
    title: 'MSCI Eligibility Screener',
    category: 'flow',
    categoryLabel: 'Indeks Global',
    desc: 'Deteksi dini calon emiten yang berpotensi masuk (Inclusion) atau keluar (Exclusion) dari indeks global MSCI Indonesia.',
    highlights: ['Kalkulasi Bobot Free Float', 'Skor Kelayakan MSCI', 'Peluang Inflow Asing Masif'],
  },
  {
    id: 'screener-ftse',
    src: '/screenshots/screener-ftse.webp',
    fallbackSrc: '/screenshots/screener-ftse.png',
    title: 'FTSE GEIS Screener',
    category: 'flow',
    categoryLabel: 'Indeks Global',
    desc: 'Saring kelayakan emiten terhadap kriteria FTSE GEIS: uji likuiditas median bulanan, free float, dan batas minimum kapitalisasi pasar.',
    highlights: ['Liquidity Rule Testing', 'Large/Mid/Small Cap Filter', 'Proyeksi Rebalancing'],
  },
  {
    id: 'screener-breakout',
    src: '/screenshots/screener-breakout.webp',
    fallbackSrc: '/screenshots/screener-breakout.png',
    title: 'Breakout & Volume Anomaly Scanner',
    category: 'sinyal',
    categoryLabel: 'Teknikal',
    desc: 'Kombinasi anomali Average Order Value (AOV), ledakan volume transaksi, dan penembusan level resisten teknikal.',
    highlights: ['AOV Surge Detector', 'Volume Spike vs Rata-rata 20 Hari', 'Resistance Breakout Alert'],
  },
  {
    id: 'right-issue',
    src: '/screenshots/right-issue-calc.webp',
    fallbackSrc: '/screenshots/right-issue-calc.png',
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

  // Keyboard navigation
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
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.20em] text-primary">
          <Sparkles size={12} />
          Cuplikan Nyata Dari Dalam Platform
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

      {/* ════════════════════ MAIN HERO STAGE ════════════════════ */}
      <div className="bento-card p-4 sm:p-6 border border-amber-500/30 bg-card/80 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none bg-amber-400" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left / Info Side */}
          <div className="lg:col-span-4 space-y-4">
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
            <div className="space-y-2 pt-1 border-t border-border/40">
              {currentShot.highlights.map((h) => (
                <div key={h} className="flex items-center gap-2 text-xs font-bold text-foreground/90">
                  <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black text-xs text-slate-950 btn-gradient-gold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Maximize2 size={14} />
                <span>Buka Layar Penuh (Zoom)</span>
              </button>

              <div className="flex items-center gap-1">
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

          {/* Right / Big Screen Preview */}
          <div className="lg:col-span-8">
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="group relative aspect-[16/9] rounded-2xl overflow-hidden border-2 border-border/70 hover:border-amber-500/70 transition-all duration-300 cursor-pointer shadow-2xl bg-slate-950"
            >
              {/* Browser bar */}
              <div className="absolute top-0 left-0 right-0 z-10 px-3.5 py-2 bg-slate-950/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  <span className="ml-2 text-[10px] font-mono text-slate-400 truncate">
                    https://bdmflow.web.id/{currentShot.id}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <Eye size={12} />
                  <span>Klik untuk Zoom</span>
                </span>
              </div>

              {/* Direct image without opacity blocker */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentShot.src}
                alt={currentShot.title}
                className="w-full h-full object-cover object-top pt-7 group-hover:scale-[1.015] transition-transform duration-500"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                <span className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-2xl scale-95 group-hover:scale-100 transition-transform">
                  <Maximize2 size={15} />
                  Perbesar Resolusi HD Penuh
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Thumbnail Selector Strip */}
        <div className="mt-6 pt-5 border-t border-border/40">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {filteredShots.map((shot, idx) => {
              const isSelected = idx === activeIdx
              return (
                <button
                  key={shot.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`flex-shrink-0 w-36 sm:w-44 rounded-xl overflow-hidden text-left border transition-all ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/30 scale-105 shadow-lg shadow-amber-500/15'
                      : 'border-border/50 opacity-60 hover:opacity-100 hover:border-border'
                  }`}
                >
                  <div className="aspect-[16/9] bg-slate-950 overflow-hidden relative">
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

      {/* ════════════════════ LIGHTBOX / FULLSCREEN MODAL ════════════════════ */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl p-2 sm:p-5 animate-fade-in select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div
            className="w-full max-w-7xl flex items-center justify-between gap-3 py-2 px-4 rounded-2xl bg-white/[0.08] border border-white/10 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shrink-0">
                {activeIdx + 1} / {filteredShots.length}
              </span>
              <div className="min-w-0 truncate">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">
                  {currentShot.title}
                </h4>
                <p className="text-[10px] sm:text-xs text-white/70 truncate hidden sm:block">
                  {currentShot.desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/auth?mode=register"
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-950 btn-gradient-gold shadow-md"
              >
                <span>Mulai Free Trial 7 Hari</span>
                <ArrowRight size={13} />
              </Link>

              <button
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-white transition-colors"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Large Image Container */}
          <div
            className="relative w-full max-w-7xl flex-1 flex items-center justify-center my-2 sm:my-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 p-3.5 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black border border-white/20 text-white backdrop-blur-md transition-all active:scale-90 shadow-2xl"
              title="Sebelumnya (←)"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Picture */}
            <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.95)] bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentShot.src}
                alt={currentShot.title}
                className="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl animate-scale-up"
              />
            </div>

            {/* Next */}
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 p-3.5 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black border border-white/20 text-white backdrop-blur-md transition-all active:scale-90 shadow-2xl"
              title="Berikutnya (→)"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          {/* Indicator dots */}
          <div
            className="w-full max-w-7xl flex items-center justify-center gap-1.5 py-1 shrink-0 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {filteredShots.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? 'w-8 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                    : 'w-2 bg-white/30 hover:bg-white/60'
                }`}
                title={`Lihat #${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
