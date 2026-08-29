'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X, ChevronLeft, ChevronRight, Maximize2,
  Sparkles, Eye, CheckCircle2
} from 'lucide-react'

interface ShotItem {
  id: string
  src: string
  title: string
  tag?: string
  tagColor?: string
  desc: string
}

const SHOTS: ShotItem[] = [
  {
    id: 'backtest-lab',
    src: '/screenshots/backtest-lab.webp',
    title: 'Backtest Lab & Signal Accuracy',
    tag: 'HOT',
    tagColor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    desc: 'Uji akurasi 10 preset sinyal smart money terhadap 900+ saham IDX. Ukur Win Rate riil, Max Potential Gain, dan Drawdown sebelum trading dengan modal nyata.',
  },
  {
    id: 'screener-fundamental',
    src: '/screenshots/screener-fundamental.webp',
    title: 'Fundamental & Valuation Screener',
    tag: 'NEW',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'Screening 46 rasio keuangan komprehensif: PER, PBV, ROE, NPM, DER, Current Ratio, Piotroski F-Score, Altman Z-Score, hingga Free Cash Flow.',
  },
  {
    id: 'keystats-stock-detail',
    src: '/screenshots/keystats-stock-detail.webp',
    title: 'Key Stats & Diagnosa Fundamental',
    tag: 'NEW',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'Diagnosa fundamental instan berbasis AI, Skor Kesehatan Fundamental (0-100), dan visualisasi traffic light hijau/kuning/merah per emiten.',
  },
  {
    id: 'screener-pro',
    src: '/screenshots/screener-pro.webp',
    title: 'Screener Pro IDX',
    tag: 'PRO',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    desc: 'Filter 900+ saham IDX dengan 15+ sinyal smart money, whale detector, dan indikator teknikal dalam satu lembar kerja interaktif.',
  },
  {
    id: 'foreign-flow',
    src: '/screenshots/foreign-flow-inteligence.webp',
    title: 'Foreign Flow Intelligence',
    tag: 'PRO',
    tagColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    desc: 'Grafik harga vs kumulatif net foreign buy/sell harian per saham dan sektor. Deteksi akumulasi senyap investor asing.',
  },
  {
    id: 'broker-summary',
    src: '/screenshots/broker-summary.webp',
    title: 'Broker Summary & Top Accumulation',
    tag: 'PRO',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    desc: 'Bedah broker dominan, top pembeli dan penjual terbesar, serta konsistensi akumulasi dan distribusi per emiten harian.',
  },
  {
    id: 'inventory-analysis',
    src: '/screenshots/inventory-broker-analysis.webp',
    title: 'Inventory Analysis Broker',
    desc: 'Garis inventory kumulatif tiap broker — lacak siapa bandar yang sedang akumulasi dan siapa yang sedang distribusi dari waktu ke waktu.',
  },
  {
    id: 'broker-concentration',
    src: '/screenshots/broker-consentration-screener.webp',
    title: 'Broker Concentration Screener',
    desc: 'Saring kandidat akumulasi broker berperingkat skor smart money tinggi, dominasi whale, dan net asing positif.',
  },
  {
    id: 'ksei-intelligence',
    src: '/screenshots/ksei-1persen-inteligence.webp',
    title: 'KSEI >1% Ownership Intelligence',
    tag: 'PRO',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    desc: 'Data kepemilikan investor besar KSEI >1%, perpindahan pemegang saham bulanan, dan stealth accumulation alert untuk 900+ emiten.',
  },
  {
    id: 'group-intelligence',
    src: '/screenshots/group-inteligence.webp',
    title: 'Group Intelligence Konglomerat',
    desc: 'Lacak aliran dana per grup konglomerasi besar: Barito, Sinarmas, Salim, Astra, Djarum, Bakrie, dan konglomerasi IDX lainnya.',
  },
  {
    id: 'screener-msci',
    src: '/screenshots/screener-msci.webp',
    title: 'MSCI Eligibility Screener',
    desc: 'Deteksi dini kandidat emiten yang berpotensi masuk (Inclusion) atau keluar (Exclusion) dari indeks global MSCI Indonesia.',
  },
  {
    id: 'screener-ftse',
    src: '/screenshots/screener-ftse.webp',
    title: 'FTSE GEIS Screener',
    desc: 'Saring kelayakan FTSE: uji likuiditas median bulanan, free float, dan batas minimum kapitalisasi pasar.',
  },
  {
    id: 'screener-breakout',
    src: '/screenshots/screener-breakout.webp',
    title: 'Breakout & Volume Anomaly Scanner',
    desc: 'Deteksi lonjakan Average Order Value (AOV), anomali volume transaksi harian, dan konfirmasi breakout resisten teknikal.',
  },
  {
    id: 'right-issue',
    src: '/screenshots/right-issue-calc.webp',
    title: 'Rights Issue Calculator',
    desc: 'Kalkulator cerdas menghitung harga teoretis tebus, potensi efek dilusi kepemilikan, dan estimasi modal yang dibutuhkan.',
  },
]

export default function FeatureShowcase() {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)

  const handleNext = useCallback(() => {
    if (lightboxIdx === null) return
    setLightboxIdx((prev) => (prev !== null ? (prev + 1) % SHOTS.length : 0))
  }, [lightboxIdx])

  const handlePrev = useCallback(() => {
    if (lightboxIdx === null) return
    setLightboxIdx((prev) => (prev !== null ? (prev - 1 + SHOTS.length) % SHOTS.length : 0))
  }, [lightboxIdx])

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }

    if (lightboxIdx !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIdx, handleNext, handlePrev])

  return (
    <section className="space-y-8 scroll-mt-24" id="showcase">
      {/* Section Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black uppercase tracking-[0.20em] text-primary">
          <Sparkles size={12} />
          Cuplikan Nyata Platform
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-foreground">
          Lihat Langsung Dari Dalam Platform
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground/75 max-w-xl mx-auto leading-relaxed">
          Semua fitur dirancang khusus untuk kenyamanan riset investor IDX. Klik gambar mana saja untuk melihat dalam resolusi HD penuh.
        </p>
      </div>

      {/* 2-Column Responsive Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SHOTS.map((shot, idx) => (
          <div
            key={shot.id}
            onClick={() => setLightboxIdx(idx)}
            className="group bento-card p-0 rounded-2xl overflow-hidden border border-border/70 hover:border-amber-500/60 transition-all duration-300 cursor-pointer hover:shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col bg-card/80"
          >
            {/* Browser Mockup Window Bar */}
            <div className="px-4 py-2.5 bg-surface-2/90 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-[10px] font-mono text-muted-foreground/60 truncate">
                  bdmflow.web.id/{shot.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {shot.tag && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${shot.tagColor || 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                    {shot.tag}
                  </span>
                )}
                <span className="text-[10px] font-mono text-muted-foreground/50">
                  #{idx + 1}
                </span>
              </div>
            </div>

            {/* Image Preview Container */}
            <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt={shot.title}
                loading="lazy"
                className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-[2px]">
                <span className="px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-2xl scale-95 group-hover:scale-100 transition-transform">
                  <Maximize2 size={14} />
                  Klik untuk Perbesar
                </span>
              </div>
            </div>

            {/* Card Content Description */}
            <div className="p-4 flex-1 flex flex-col justify-between bg-surface-1">
              <div>
                <h3 className="text-sm font-black text-foreground group-hover:text-amber-400 transition-colors mb-1">
                  {shot.title}
                </h3>
                <p className="text-xs text-muted-foreground/75 leading-relaxed">
                  {shot.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════ FULLSCREEN LIGHTBOX MODAL ════════════════════ */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-fade-in select-none cursor-zoom-out"
          onClick={() => setLightboxIdx(null)} // Click outside closes immediately!
        >
          {/* Main Modal Box — Stop propagation so clicking inside doesn't close */}
          <div
            className="relative max-w-6xl w-full flex flex-col items-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Title & Close Button */}
            <div className="w-full flex items-center justify-between gap-3 pb-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs font-mono shrink-0">
                  {lightboxIdx + 1} / {SHOTS.length}
                </span>
                <div className="min-w-0 truncate">
                  <h4 className="text-sm sm:text-base font-black text-white truncate">
                    {SHOTS[lightboxIdx].title}
                  </h4>
                  <p className="text-xs text-white/70 truncate hidden sm:block">
                    {SHOTS[lightboxIdx].desc}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setLightboxIdx(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500 hover:text-white text-white/90 border border-white/15 transition-all text-xs font-bold shrink-0"
                title="Tutup (Esc atau klik di luar)"
              >
                <span>Tutup</span>
                <X size={16} />
              </button>
            </div>

            {/* Image Stage Container */}
            <div className="relative w-full aspect-[16/9] max-h-[75vh] rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_0_60px_rgba(0,0,0,0.9)] bg-slate-950">
              {/* Prev Button */}
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black border border-white/20 text-white backdrop-blur-md transition-all active:scale-90 shadow-2xl"
                title="Sebelumnya (←)"
                aria-label="Sebelumnya"
              >
                <ChevronLeft size={24} />
              </button>

              {/* The Big Picture */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHOTS[lightboxIdx].src}
                alt={SHOTS[lightboxIdx].title}
                className="w-full h-full object-contain bg-slate-950"
              />

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black border border-white/20 text-white backdrop-blur-md transition-all active:scale-90 shadow-2xl"
                title="Berikutnya (→)"
                aria-label="Berikutnya"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Footer Prompt */}
            <p className="text-[11px] text-white/50 text-center pt-3 flex items-center justify-center gap-1.5">
              <span>💡</span> Klik di mana pun di luar kotak gambar atau tekan <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono text-[10px]">ESC</kbd> untuk kembali ke landing page.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
