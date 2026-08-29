'use client'

import { useState, useEffect, useCallback } from 'react'
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// Screenshots live in /public/screenshots (1920×1080). Filenames must match exactly.
const SHOTS = [
  { src: '/screenshots/screener-pro.png',                 title: 'Screener Pro',                    desc: 'Saring 900+ saham IDX dengan 15+ sinyal smart money dalam satu tampilan.' },
  { src: '/screenshots/screener-fundamental.png',         title: 'Fundamental & Valuation Screener',desc: 'Screening 46 rasio keuangan komprehensif: PER, PBV, ROE, F-Score, hingga Free Cash Flow.' },
  { src: '/screenshots/keystats-stock-detail.png',        title: 'Key Stats & Valuation Detail',    desc: 'Diagnosa fundamental pintar, health score 0-100, dan highlight traffic light hijau/merah per emiten.' },
  { src: '/screenshots/backtest-lab.png',                 title: 'Backtest Lab & Signal Accuracy',  desc: 'Uji akurasi 10 sinyal harian (AOV, Whale, Foreign) & forward return multi-saham sebelum pakai modal nyata.' },
  { src: '/screenshots/foreign-flow-inteligence.png',     title: 'Foreign Flow Intelligence',       desc: 'Harga vs kumulatif net foreign, lengkap dengan aliran asing harian per saham.' },
  { src: '/screenshots/screener-msci.png',                title: 'MSCI Eligibility Screener',       desc: 'Deteksi kandidat masuk/keluar indeks MSCI + saham yang hampir lolos.' },
  { src: '/screenshots/screener-ftse.png',                title: 'FTSE GEIS Screener',              desc: 'Kelayakan FTSE: uji likuiditas X/12 bulan, free float, & ukuran.' },
  { src: '/screenshots/broker-summary.png',               title: 'Broker Summary & Tracker',        desc: 'Bedah broker dominan & konsistensi akumulasi/distribusi per saham.' },
  { src: '/screenshots/inventory-broker-analysis.png',    title: 'Inventory Analysis',              desc: 'Candle harga + garis inventory kumulatif tiap broker — lacak siapa akumulasi & distribusi dari waktu ke waktu.' },
  { src: '/screenshots/broker-consentration-screener.png',title: 'Broker Concentration Screener',  desc: 'Saring kandidat akumulasi broker berperingkat skor smart money — filter whale, konsentrasi tinggi, & net asing positif.' },
  { src: '/screenshots/group-inteligence.png',            title: 'Group Intelligence',              desc: 'Aliran dana per grup konglomerat — Barito, Sinarmas, Salim, dll.' },
  { src: '/screenshots/ksei-1persen-inteligence.png',     title: 'KSEI >1% Intelligence',           desc: 'Kepemilikan KSEI >1%, stealth accumulation, & perubahan bulanan.' },
  { src: '/screenshots/screener-breakout.png',            title: 'Breakout Scanner',                desc: 'Volume & AOV anomaly + breakout teknikal untuk timing entry.' },
  { src: '/screenshots/right-issue-calc.png',             title: 'Right Issue Calculator',          desc: 'Hitung dampak rights issue, harga teoretis, & dilusi.' },
]

export default function FeatureShowcase() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [failedImgs, setFailedImgs] = useState<Record<string, boolean>>({})

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % SHOTS.length)
  }, [selectedIndex])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + SHOTS.length) % SHOTS.length)
  }, [selectedIndex])

  // Keyboard navigation (Escape to close, Arrows to navigate)
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }

    // Disable body scroll when modal is open
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex, handleNext, handlePrev])

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.20em] text-primary">
          <Sparkles size={11} />
          Cuplikan Nyata Platform
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-foreground">
          Lihat langsung dari dalam platform
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground/75 max-w-xl mx-auto">
          Klik pada gambar mana pun untuk memperbesar tampilan resolusi tinggi.
        </p>
      </div>

      {/* Grid of Screenshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
        {SHOTS.map((shot, idx) => {
          const isErr = failedImgs[shot.src]
          return (
            <div
              key={shot.src}
              onClick={() => setSelectedIndex(idx)}
              className="group glass rounded-2xl overflow-hidden border border-line-3 hover:border-amber-500/50 transition-all duration-300 cursor-pointer hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] flex flex-col bg-card/60"
            >
              {/* Image Container */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-white/[0.05] to-transparent border-b border-line-2 overflow-hidden">
                {isErr ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/35">
                    <ImageIcon size={26} strokeWidth={1.4} />
                    <span className="text-[11px] font-bold text-muted-foreground/50">{shot.title}</span>
                    <span className="text-[9px] uppercase tracking-widest">Preview segera</span>
                  </div>
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={shot.src}
                      alt={`Screenshot — ${shot.title}`}
                      loading="lazy"
                      onError={() => setFailedImgs(prev => ({ ...prev, [shot.src]: true }))}
                      className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                    />

                    {/* Hover Zoom Overlay Badge */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 text-white text-xs font-black backdrop-blur-[2px]">
                      <span className="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-lg shadow-amber-500/30 scale-95 group-hover:scale-100 transition-transform">
                        <Maximize2 size={13} />
                        Klik untuk Perbesar
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-[13px] font-black text-foreground group-hover:text-amber-400 transition-colors">
                      {shot.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground/50 font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground/70 leading-relaxed">
                    {shot.desc}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ════════════════════ LIGHTBOX / FULLSCREEN ZOOM MODAL ════════════════════ */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/90 backdrop-blur-xl p-3 sm:p-6 animate-fade-in select-none"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Top Bar Controls */}
          <div
            className="w-full max-w-6xl flex items-center justify-between gap-4 py-2 px-3 rounded-2xl bg-white/[0.06] border border-white/10 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shrink-0">
                {selectedIndex + 1} / {SHOTS.length}
              </span>
              <div className="min-w-0 truncate">
                <h4 className="text-xs sm:text-sm font-black text-white truncate">
                  {SHOTS[selectedIndex].title}
                </h4>
                <p className="text-[10px] sm:text-xs text-white/70 truncate hidden sm:block">
                  {SHOTS[selectedIndex].desc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/auth?mode=register"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-slate-950 btn-gradient-gold shadow-md"
              >
                <span>Coba Fitur Ini</span>
                <ArrowRight size={12} />
              </Link>

              <button
                onClick={() => setSelectedIndex(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-500 hover:text-white text-white/80 transition-colors"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Image Viewer Area */}
          <div
            className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black border border-white/15 text-white backdrop-blur-md transition-all active:scale-90"
              title="Sebelumnya (←)"
            >
              <ChevronLeft size={22} />
            </button>

            {/* Enlarged Image */}
            <div className="relative max-h-full max-w-full rounded-2xl overflow-hidden border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-slate-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={SHOTS[selectedIndex].src}
                alt={SHOTS[selectedIndex].title}
                className="max-h-[78vh] w-auto max-w-full object-contain rounded-2xl animate-scale-up"
              />
            </div>

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black border border-white/15 text-white backdrop-blur-md transition-all active:scale-90"
              title="Berikutnya (→)"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Bottom Bar Info & Thumbnail Indicators */}
          <div
            className="w-full max-w-6xl flex items-center justify-center gap-1.5 py-1 shrink-0 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {SHOTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === selectedIndex
                    ? 'w-8 bg-amber-400'
                    : 'w-2 bg-white/20 hover:bg-white/50'
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
