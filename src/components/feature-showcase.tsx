'use client'

import { useState, useEffect, useCallback } from 'react'
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Maximize2, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

// Optimized WebP screenshots in /public/screenshots/ (Ultra-lightweight ~70KB each)
const SHOTS = [
  { src: '/screenshots/screener-pro.webp',                 title: 'Screener Pro',                    desc: 'Saring 900+ saham IDX dengan 15+ sinyal smart money dalam satu tampilan.' },
  { src: '/screenshots/screener-fundamental.webp',         title: 'Fundamental & Valuation Screener',desc: 'Screening 46 rasio keuangan komprehensif: PER, PBV, ROE, F-Score, hingga Free Cash Flow.' },
  { src: '/screenshots/keystats-stock-detail.webp',        title: 'Key Stats & Valuation Detail',    desc: 'Diagnosa fundamental pintar, health score 0-100, dan highlight traffic light hijau/merah per emiten.' },
  { src: '/screenshots/backtest-lab.webp',                 title: 'Backtest Lab & Signal Accuracy',  desc: 'Uji akurasi 10 sinyal harian (AOV, Whale, Foreign) & forward return multi-saham sebelum pakai modal nyata.' },
  { src: '/screenshots/foreign-flow-inteligence.webp',     title: 'Foreign Flow Intelligence',       desc: 'Harga vs kumulatif net foreign, lengkap dengan aliran asing harian per saham.' },
  { src: '/screenshots/screener-msci.webp',                title: 'MSCI Eligibility Screener',       desc: 'Deteksi kandidat masuk/keluar indeks MSCI + saham yang hampir lolos.' },
  { src: '/screenshots/screener-ftse.webp',                title: 'FTSE GEIS Screener',              desc: 'Kelayakan FTSE: uji likuiditas X/12 bulan, free float, & ukuran.' },
  { src: '/screenshots/broker-summary.webp',               title: 'Broker Summary & Tracker',        desc: 'Bedah broker dominan & konsistensi akumulasi/distribusi per saham.' },
  { src: '/screenshots/inventory-broker-analysis.webp',    title: 'Inventory Analysis',              desc: 'Candle harga + garis inventory kumulatif tiap broker — lacak siapa akumulasi & distribusi dari waktu ke waktu.' },
  { src: '/screenshots/broker-consentration-screener.webp',title: 'Broker Concentration Screener',  desc: 'Saring kandidat akumulasi broker berperingkat skor smart money — filter whale, konsentrasi tinggi, & net asing positif.' },
  { src: '/screenshots/group-inteligence.webp',            title: 'Group Intelligence',              desc: 'Aliran dana per grup konglomerat — Barito, Sinarmas, Salim, dll.' },
  { src: '/screenshots/ksei-1persen-inteligence.webp',     title: 'KSEI >1% Intelligence',           desc: 'Kepemilikan KSEI >1%, stealth accumulation, & perubahan bulanan.' },
  { src: '/screenshots/screener-breakout.webp',            title: 'Breakout Scanner',                desc: 'Volume & AOV anomaly + breakout teknikal untuk timing entry.' },
  { src: '/screenshots/right-issue-calc.webp',             title: 'Right Issue Calculator',          desc: 'Hitung dampak rights issue, harga teoretis, & dilusi.' },
]

export default function FeatureShowcase() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [imgFailed, setImgFailed] = useState(false)

  // Reset the error fallback whenever a different screenshot is opened.
  useEffect(() => {
    setImgFailed(false)
  }, [selectedIndex])

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex + 1) % SHOTS.length)
  }, [selectedIndex])

  const handlePrev = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex((selectedIndex - 1 + SHOTS.length) % SHOTS.length)
  }, [selectedIndex])

  // Keyboard navigation
  useEffect(() => {
    if (selectedIndex === null) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null)
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }

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

      {/* Grid of Screenshots with Mockup Browser Frame */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
        {SHOTS.map((shot, idx) => (
          <div
            key={shot.src}
            onClick={() => setSelectedIndex(idx)}
            className="group rounded-2xl overflow-hidden border border-border/60 hover:border-amber-500/60 transition-all duration-300 cursor-pointer bg-card hover:shadow-[0_16px_36px_rgba(0,0,0,0.45)] flex flex-col"
          >
            {/* Browser Window Header Bar */}
            <div className="px-3.5 py-2.5 bg-surface-2/80 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block" />
                <span className="ml-2 text-[10px] font-mono text-muted-foreground/60 truncate">
                  bdmflow.web.id/{shot.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-amber-500/80 uppercase">
                HD #{idx + 1}
              </span>
            </div>

            {/* Image Container — image is NEVER hidden by JS. The skeleton
                sits UNDER the image, so a slow load shows a shimmer, a failed
                load shows the alt text, and a cached load is instant. */}
            <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                <ImageIcon size={28} className="animate-spin duration-1000" />
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.src}
                alt={`Screenshot — ${shot.title}`}
                loading="lazy"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-500"
              />

              {/* Hover Zoom Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-[2px]">
                <span className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/30 scale-95 group-hover:scale-100 transition-transform">
                  <Maximize2 size={14} />
                  Perbesar Screenshot
                </span>
              </div>
            </div>

            {/* Card Footer */}
            <div className="p-4 flex-1 flex flex-col justify-between bg-surface-1">
              <div>
                <h3 className="text-[13px] font-black text-foreground group-hover:text-amber-400 transition-colors mb-1">
                  {shot.title}
                </h3>
                <p className="text-[11.5px] text-muted-foreground/75 leading-relaxed">
                  {shot.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════ LIGHTBOX / FULLSCREEN ZOOM MODAL ════════════════════ */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/95 backdrop-blur-2xl p-2 sm:p-6 animate-fade select-none"
          onClick={() => setSelectedIndex(null)}
        >
          {/* Top Bar Controls */}
          <div
            className="w-full max-w-6xl flex items-center justify-between gap-3 py-2 px-3 rounded-2xl bg-white/[0.08] border border-white/10 text-white shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 min-w-0">
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
                className="p-2 rounded-xl bg-white/15 hover:bg-rose-500 hover:text-white text-white transition-colors"
                title="Tutup (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Main Image Viewer */}
          <div
            className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-2 sm:my-4 overflow-hidden min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black border border-white/20 text-white backdrop-blur-md transition-all active:scale-90 shadow-xl"
              title="Sebelumnya (←)"
            >
              <ChevronLeft size={22} />
            </button>

            {imgFailed ? (
              // Readable fallback — never a black screen.
              <div className="flex flex-col items-center gap-3 text-center px-6">
                <span className="inline-flex p-4 rounded-2xl bg-white/10 border border-white/15">
                  <AlertTriangle size={26} className="text-amber-400" />
                </span>
                <p className="text-white font-black text-sm">Gambar gagal dimuat</p>
                <p className="text-white/60 text-xs max-w-xs leading-relaxed">
                  Buka fitur langsung: <strong>{SHOTS[selectedIndex].title}</strong>
                </p>
                <Link
                  href="/auth?mode=register"
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-950 btn-gradient-gold shadow-md"
                >
                  Coba Fitur Ini <ArrowRight size={12} />
                </Link>
              </div>
            ) : (
              <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={SHOTS[selectedIndex].src}
                  ref={(el) => {
                    // Same race as the grid: a fast failure (abort/404 from
                    // cache) can fire error before React attaches onError.
                    if (el && el.complete && el.naturalWidth === 0) setImgFailed(true)
                  }}
                  src={SHOTS[selectedIndex].src}
                  alt={SHOTS[selectedIndex].title}
                  draggable={false}
                  onError={() => setImgFailed(true)}
                  style={{ maxHeight: '78vh', maxWidth: '94vw' }}
                  className="block w-auto h-auto object-contain"
                />
              </div>
            )}

            {/* Next Button */}
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/70 hover:bg-amber-500 hover:text-black border border-white/20 text-white backdrop-blur-md transition-all active:scale-90 shadow-xl"
              title="Berikutnya (→)"
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Bottom Bar Thumbnail Dots */}
          <div
            className="w-full max-w-6xl flex items-center justify-center gap-1.5 py-1 shrink-0 overflow-x-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {SHOTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selectedIndex
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
