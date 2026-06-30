export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Zap, Globe, BarChart2, Eye, TrendingUp, Calculator,
  Shield, CheckCircle, ArrowRight, Search,
  Activity, Brain, Building2, Lock, Sparkles,
  ChevronRight, Layers,
} from 'lucide-react'
import FeatureShowcase from '@/components/feature-showcase'
import TrackLink from '@/components/track-link'

// ── Features data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Search,
    accent: '#f59e0b',
    accentRgb: '245,158,11',
    tag: 'PRO',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    title: 'Screener Pro',
    desc: 'Filter 900+ saham IDX dengan 15+ sinyal — Smart Money, Whale Signal, Foreign Flow, Breakout Scanner, dan MSCI Screener dalam satu tampilan.',
    size: 'lg', // spans 2 cols on desktop
  },
  {
    icon: Brain,
    accent: '#a855f7',
    accentRgb: '168,85,247',
    tag: null,
    tagColor: '',
    title: 'Smart Money Matrix',
    desc: 'Lacak pergerakan dana institusi dan whale signal secara real-time. Ketahui ke mana uang besar mengalir.',
    size: 'sm',
  },
  {
    icon: Globe,
    accent: '#14b8a6',
    accentRgb: '20,184,166',
    tag: null,
    tagColor: '',
    title: 'Foreign Flow',
    desc: 'Monitor aliran dana asing per saham dan sektor. Visualisasi divergensi harga vs kumulatif foreign flow.',
    size: 'sm',
  },
  {
    icon: BarChart2,
    accent: '#38bdf8',
    accentRgb: '56,189,248',
    tag: 'PRO',
    tagColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    title: 'Broker Tracker & Flow',
    desc: 'Analisis ringkasan broker harian, identifikasi broker dominan, dan lacak konsistensi akumulasi distribusi.',
    size: 'sm',
  },
  {
    icon: Eye,
    accent: '#22c55e',
    accentRgb: '34,197,94',
    tag: 'PRO',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: 'KSEI Intelligence',
    desc: 'Data kepemilikan KSEI >1%, stealth accumulation signal, dan Major Holder tracker untuk 900+ emiten IDX.',
    size: 'sm',
  },
  {
    icon: Calculator,
    accent: '#f59e0b',
    accentRgb: '245,158,11',
    tag: 'PRO',
    tagColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    title: 'Personal Tools',
    desc: 'Backtest Lab, Watchlist & Alert, Right Issue Calculator, dan Radar scoring dengan 20+ parameter.',
    size: 'sm',
  },
]

const STATS = [
  { value: '900+', label: 'Saham IDX', sub: 'dipantau aktif',  accent: '#f59e0b', delay: '0.1s' },
  { value: '15+',  label: 'Sinyal',    sub: 'tipe tersedia',   accent: '#22c55e', delay: '0.2s' },
  { value: 'T+1',  label: 'Data',      sub: 'update harian',   accent: '#38bdf8', delay: '0.3s' },
  { value: '5',    label: 'Sumber',    sub: 'data terintegrasi',accent: '#a855f7', delay: '0.4s' },
]

const FREE_FEATURES = [
  'Market Overview & Morning Brief',
  'Sector Analytics & Rotation',
  'Group Intelligence Konglomerat',
]

const PRO_FEATURES = [
  'Semua fitur Free',
  'Screener Pro (900+ saham, 15+ sinyal)',
  'Smart Money Matrix & Whale Tracker',
  'Foreign Flow Intelligence + Stock Chart',
  'Broker Flow & BrokSum Tracker',
  'KSEI >1%, Monthly & Major Holder',
  'Insider Radar & Stealth Accumulation',
  'Breakout Scanner & Watchlist Radar',
  'MSCI Screener & Foreign Inclusion',
  'Backtest Lab & Right Issue Calculator',
  'Watchlist & Alert Personal',
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="max-w-[1120px] mx-auto pb-24 animate-fade-in">

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="hero-mesh pt-16 md:pt-24 pb-12 px-4 md:px-6 text-center space-y-8 rounded-3xl mb-16">

        {/* Platform badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/20 bg-primary/[0.06] text-[11px] font-black uppercase tracking-[0.20em] text-primary/90 animate-slide-up">
          <Sparkles size={11} className="text-primary" />
          Platform Riset Saham IDX
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
        </div>

        {/* Headline */}
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.04]">
            <span className="block gradient-gold">Analisis Institusional</span>
            <span className="block text-foreground/90">untuk Investor IDX</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed font-medium">
            Lacak <strong className="text-foreground/90 font-black">Smart Money</strong>, Foreign Flow, dan KSEI secara real-time.
            Screener Pro, Broker Tracker, Backtest Lab — semua data grade institusional dalam satu platform.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <TrackLink
            href="/dashboard"
            event="cta_click"
            data={{ cta: 'hero_coba_preview' }}
            className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm text-black transition-all duration-200 active:scale-95 btn-gradient-gold shadow-[0_8px_32px_rgba(245,158,11,0.35)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.5)]"
          >
            Coba Gratis — Tanpa Daftar
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </TrackLink>
          <TrackLink
            href="/auth"
            event="cta_click"
            data={{ cta: 'hero_masuk' }}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-foreground/70 border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] hover:text-foreground transition-all duration-200"
          >
            Masuk ke Akun
          </TrackLink>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground/40 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {[
            { icon: CheckCircle, text: 'Gratis untuk memulai' },
            { icon: CheckCircle, text: 'Data IDX T+1 setiap hari' },
            { icon: Shield,      text: 'Tidak ada kartu kredit' },
          ].map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5">
              <Icon size={11} className="text-emerald-400/50" />
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* ════════════════════ STATS BENTO ════════════════════ */}
      <section className="px-4 md:px-6 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="bento-card p-6 text-center stagger border-glow-anim"
              style={{ animationDelay: s.delay }}
            >
              <p
                className="text-4xl font-black stat-number leading-none mb-2"
                style={{ color: s.accent, textShadow: `0 0 32px ${s.accent}55` }}
              >
                {s.value}
              </p>
              <p className="text-[12px] font-black text-foreground/80">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ FEATURES BENTO ════════════════════ */}
      <section className="px-4 md:px-6 mb-20 space-y-8">
        <div className="text-center space-y-3">
          <div className="eyebrow justify-center">Fitur Platform</div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground">
            Satu platform,<br />
            <span className="gradient-gold">semua data yang Anda butuhkan</span>
          </h2>
          <p className="text-sm text-muted-foreground/55 max-w-xl mx-auto leading-relaxed">
            Dari screening saham hingga analisis kepemilikan institusi — BDMFlow menghadirkan data grade institusional untuk investor ritel IDX.
          </p>
        </div>

        {/* Bento asymmetric grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(160px,auto)]">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            const isLarge = f.size === 'lg'
            return (
              <div
                key={f.title}
                className={`bento-card p-6 flex flex-col gap-4 relative overflow-hidden border-glow-anim ${isLarge ? 'lg:col-span-2' : ''}`}
              >
                {/* Background glow */}
                <div
                  className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
                  style={{ background: f.accent }}
                />

                <div className="flex items-start justify-between relative">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-[14px] flex items-center justify-center border"
                    style={{
                      background: `rgba(${f.accentRgb}, 0.10)`,
                      borderColor: `rgba(${f.accentRgb}, 0.20)`,
                      boxShadow: `0 0 20px rgba(${f.accentRgb}, 0.15)`,
                    }}
                  >
                    <Icon size={18} style={{ color: f.accent }} />
                  </div>

                  {f.tag && (
                    <span className={`text-[9px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-lg border ${f.tagColor}`}>
                      {f.tag}
                    </span>
                  )}
                </div>

                <div className="relative flex-1">
                  <h3 className="text-[14px] font-black text-foreground mb-2 leading-snug">{f.title}</h3>
                  <p className="text-[12px] text-muted-foreground/60 leading-relaxed">{f.desc}</p>
                </div>

                {/* Accent bottom line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-30"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.accent}, transparent)` }}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════ SCREENSHOT SHOWCASE ════════════════════ */}
      <section className="px-4 md:px-6 mb-20">
        <FeatureShowcase />
      </section>

      {/* ════════════════════ VALUE PROPS ════════════════════ */}
      <section className="px-4 md:px-6 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Activity,
              accent: '#22c55e',
              accentRgb: '34,197,94',
              title: 'Data Terkini Setiap Hari',
              desc: 'Data T+1 dari IDX, KSEI, dan sumber resmi lainnya. Diproses otomatis setiap malam supaya Anda selalu analisis dengan data terbaru.',
            },
            {
              icon: Building2,
              accent: '#f59e0b',
              accentRgb: '245,158,11',
              title: 'Dirancang untuk IDX',
              desc: 'Bukan adaptasi dari platform asing — BDMFlow dibangun dari nol khusus untuk pasar Indonesia. KSEI, bandarmologi, grup konglomerat.',
            },
            {
              icon: TrendingUp,
              accent: '#38bdf8',
              accentRgb: '56,189,248',
              title: 'Keputusan Lebih Terinformasi',
              desc: 'Gabungkan data Smart Money, Foreign Flow, dan KSEI dalam satu analisis terpadu. Kurangi noise, fokus pada signal yang penting.',
            },
          ].map(v => {
            const Icon = v.icon
            return (
              <div key={v.title} className="bento-card p-6 relative overflow-hidden border-glow-anim">
                <div
                  className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-15 pointer-events-none"
                  style={{ background: v.accent }}
                />
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border"
                  style={{
                    background: `rgba(${v.accentRgb}, 0.10)`,
                    borderColor: `rgba(${v.accentRgb}, 0.20)`,
                  }}
                >
                  <Icon size={18} style={{ color: v.accent }} />
                </div>
                <h3 className="text-[13px] font-black text-foreground mb-2">{v.title}</h3>
                <p className="text-[11.5px] text-muted-foreground/55 leading-relaxed">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════ PRICING ════════════════════ */}
      <section className="px-4 md:px-6 mb-20 space-y-8" id="pricing">
        <div className="text-center space-y-3">
          <div className="eyebrow justify-center">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-black text-foreground">
            Pilih paket yang tepat
          </h2>
          <p className="text-sm text-muted-foreground/55">
            Mulai gratis, upgrade kapan saja. Tidak ada kontrak jangka panjang.
          </p>
        </div>

        {/* Intro-period offer */}
        <div className="max-w-[760px] mx-auto flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05]">
          <span className="text-base">🎉</span>
          <p className="text-[12px] font-bold text-emerald-400/90">
            Coba <span className="text-emerald-300 font-black">semua fitur Pro gratis 7 hari, tanpa daftar</span> — lalu daftar gratis untuk akses permanen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[760px] mx-auto">

          {/* FREE */}
          <div className="bento-card p-8 flex flex-col">
            <div className="mb-8">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/35 mb-4">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black text-foreground">Rp 0</span>
                <span className="text-sm text-muted-foreground/40 mb-2">/ bulan</span>
              </div>
              <p className="text-[11px] text-muted-foreground/40 mt-2">Akses dasar untuk mulai mengenal pasar IDX</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[12px] text-muted-foreground/65">
                  <CheckCircle size={13} className="text-emerald-400/60 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-[12px] text-muted-foreground/30">
                <Lock size={13} className="mt-0.5 shrink-0" />
                Fitur Premium terkunci
              </li>
            </ul>

            <TrackLink
              href="/auth"
              event="cta_click"
              data={{ cta: 'pricing_daftar' }}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-center border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-foreground/60 hover:text-foreground transition-all duration-200"
            >
              Daftar Gratis
            </TrackLink>
          </div>

          {/* PRO */}
          <div className="bento-card p-8 flex flex-col relative overflow-hidden border-glow-anim"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(245,158,11,0.02) 100%)' }}
          >
            {/* Popular badge */}
            <div className="absolute top-5 right-5 text-[9px] font-black uppercase tracking-[0.14em] px-3 py-1.5 rounded-full text-black btn-gradient-gold shadow-[0_4px_16px_rgba(245,158,11,0.3)]">
              Terpopuler
            </div>

            {/* Gold glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none bg-amber-400" />

            <div className="mb-8 relative">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400/70 mb-4">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black gradient-gold">Rp 55K</span>
                <span className="text-sm text-muted-foreground/40 mb-2">/ bulan</span>
              </div>
              <p className="text-[11px] text-muted-foreground/45 mt-2">Akses penuh ke semua fitur tanpa batasan</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8 relative">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[12px] text-foreground/70">
                  <CheckCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="w-full py-3.5 rounded-xl text-sm font-black text-center text-black/60 cursor-default select-none relative"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.45), rgba(240,192,64,0.45))' }}
            >
              Segera Hadir
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/25">
          * Harga dapat berubah sewaktu-waktu. Lihat halaman{' '}
          <Link href="/pricing" className="underline hover:text-muted-foreground/50 transition-colors">pricing</Link>
          {' '}untuk detail.
        </p>
      </section>

      {/* ════════════════════ FINAL CTA — SPOTLIGHT ════════════════════ */}
      <section className="px-4 md:px-6">
        <div className="spotlight-block bento-card p-12 md:p-16 text-center space-y-8">

          {/* Stars */}
          <div className="flex justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} viewBox="0 0 16 16" className="w-4 h-4 fill-amber-400/80" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1l1.854 3.756L14 5.528l-3 2.924.708 4.127L8 10.502l-3.708 2.077L5 8.452 2 5.528l4.146-.772z"/>
              </svg>
            ))}
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
              Mulai Analisis Lebih Cerdas
              <br />
              <span className="gradient-gold">Hari Ini</span>
            </h2>
            <p className="text-sm md:text-base text-muted-foreground/55 max-w-lg mx-auto leading-relaxed">
              Bergabung dengan investor IDX yang sudah menggunakan data institusional untuk keputusan investasi yang lebih terinformasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <TrackLink
              href="/auth"
              event="cta_click"
              data={{ cta: 'final_daftar' }}
              className="group flex items-center gap-2.5 px-10 py-4 rounded-2xl font-black text-sm text-black transition-all duration-200 active:scale-95 btn-gradient-gold shadow-[0_8px_40px_rgba(245,158,11,0.3)] hover:shadow-[0_12px_48px_rgba(245,158,11,0.5)]"
            >
              Daftar Gratis
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </TrackLink>
            <TrackLink
              href="/dashboard"
              event="cta_click"
              data={{ cta: 'final_preview' }}
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold text-foreground/60 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-foreground transition-all duration-200"
            >
              Lihat Preview <ChevronRight size={13} />
            </TrackLink>
          </div>

          <p className="text-[10px] text-muted-foreground/30 flex items-center justify-center gap-2">
            <Shield size={10} className="text-muted-foreground/25" />
            Not financial advice. DYOR. Data IDX T+1.
          </p>
        </div>
      </section>

      {/* ════════════════════ FOOTER MINI ════════════════════ */}
      <div className="mt-16 px-4 md:px-6 pt-8 border-t border-border/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950">B</div>
            <span className="font-bold text-muted-foreground/45">BDMFlow IDX</span>
            <span>·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/pricing" className="hover:text-muted-foreground/60 transition-colors">Pricing</Link>
            <Link href="/screener" className="hover:text-muted-foreground/60 transition-colors">Screener</Link>
            <Link href="/foreign-flow" className="hover:text-muted-foreground/60 transition-colors">Foreign Flow</Link>
            <Link href="/auth" className="hover:text-muted-foreground/60 transition-colors">Login</Link>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 animate-pulse" />
              IDX Active
            </span>
          </div>
        </div>
      </div>

    </div>
  )
}
