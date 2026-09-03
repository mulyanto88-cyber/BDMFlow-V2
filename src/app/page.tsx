export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Zap, Globe, BarChart2, Eye, TrendingUp, Calculator,
  Shield, CheckCircle, ArrowRight, Search,
  Activity, Brain, Building2, Lock, Sparkles,
  ChevronRight, Layers, Target, FlaskConical, Award, Flame,
  PieChart, Clock, ArrowDown
} from 'lucide-react'
import FeatureShowcase from '@/components/feature-showcase'
import TrackLink from '@/components/track-link'
import LandingNav from '@/components/landing-nav'
import { BrandLogoIcon } from '@/components/brand-logo'

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
    icon: FlaskConical,
    accent: '#eab308',
    accentRgb: '234,179,8',
    tag: 'HOT',
    tagColor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    title: 'Backtest Lab & Signal Accuracy',
    desc: 'Uji akurasi 10 sinyal harian (AOV Surge, Whale Alert, Foreign Inflow) terhadap 900+ saham IDX. Hitung Win Rate riil, Max Potential Gain (MFE), dan Max Drawdown.',
    size: 'sm',
  },
  {
    icon: PieChart,
    accent: '#10b981',
    accentRgb: '16,185,129',
    tag: 'NEW',
    tagColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    title: 'Fundamental & Valuation Screener',
    desc: '46 rasio keuangan komprehensif — saring saham undervalue (PER/PBV), efisiensi tinggi (ROE/NPM), solvabilitas aman (DER/Altman Z), hingga Free Cash Flow.',
    size: 'sm',
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
    title: 'Foreign Flow Intelligence',
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
]

const STATS = [
  { value: '900+', label: 'Saham IDX', sub: 'dipantau aktif',    accent: '#f59e0b', delay: '0.1s' },
  { value: '15+',  label: 'Sinyal',    sub: 'tipe tersedia',     accent: '#22c55e', delay: '0.2s' },
  { value: '18:00',label: 'WIB Daily', sub: 'update setiap sore',accent: '#38bdf8', delay: '0.3s' },
  { value: '5',    label: 'Sumber',    sub: 'data terintegrasi',  accent: '#a855f7', delay: '0.4s' },
]

const FREE_FEATURES = [
  'Market Overview & Morning Brief',
  'Sector Analytics & Rotation',
  'Group Intelligence Konglomerat',
]

const PRO_FEATURES = [
  'Semua fitur Free',
  '🎯 Backtest Lab (Multi-Stock Signal Accuracy & Win Rate)',
  '📊 Fundamental & Valuation Screener (46 Rasio Keuangan Komprehensif)',
  'Screener Pro (900+ saham, 15+ sinyal)',
  'Smart Money Matrix & Whale Tracker',
  'Foreign Flow Intelligence + Stock Chart',
  'Broker Flow & BrokSum Tracker',
  'KSEI >1%, Monthly & Major Holder',
  'Insider Radar & Stealth Accumulation',
  'Breakout Scanner & Watchlist Radar',
  'MSCI Screener & Foreign Inclusion',
  'Right Issue Calculator & Watchlist Alert',
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ════════════════════ TOP NAVBAR ════════════════════ */}
      <LandingNav />

      <div className="max-w-[1120px] mx-auto px-2 sm:px-4 pb-24 animate-fade-in">

        {/* ════════════════════ 1. HERO ════════════════════ */}
        <section className="hero-mesh pt-12 md:pt-20 pb-12 px-4 md:px-6 text-center space-y-8 rounded-3xl mb-16">

          {/* Platform badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/20 bg-primary/[0.06] text-[11px] font-black uppercase tracking-[0.20em] text-primary/90 animate-slide-up">
            <Sparkles size={11} className="text-primary" />
            Platform Riset Saham IDX Grade Institusi
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Headline */}
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.10] sm:leading-[1.04]">
              <span className="block gradient-gold">Analisis Institusional</span>
              <span className="block text-foreground/90">untuk Investor IDX</span>
            </h1>
            <p className="text-xs sm:text-base md:text-lg text-muted-foreground/75 max-w-2xl mx-auto leading-relaxed font-medium px-1 sm:px-0">
              Lacak <strong className="text-foreground/90 font-black">Smart Money</strong>, Foreign Flow, Fundamental Intelligence, dan KSEI secara akurat.
              Data pasar terpadu dan <strong className="text-amber-400 font-bold">Backtest Lab Akurasi Sinyal</strong> — update setiap hari pukul 18:00 WIB.
            </p>
          </div>

          {/* Hero Action Buttons (Mobile Full-Width Responsive) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 animate-slide-up max-w-md sm:max-w-none mx-auto w-full" style={{ animationDelay: '0.2s' }}>
            <TrackLink
              href="/auth?mode=register"
              event="cta_click"
              data={{ cta: 'hero_free_trial' }}
              className="group flex items-center justify-center gap-2 px-7 py-3.5 sm:py-4 rounded-2xl font-black text-xs sm:text-sm text-black transition-all duration-200 active:scale-95 btn-gradient-gold shadow-[0_8px_32px_rgba(245,158,11,0.35)] hover:shadow-[0_12px_40px_rgba(245,158,11,0.5)] w-full sm:w-auto"
            >
              Mulai Free Trial 7 Hari
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </TrackLink>

            <a
              href="#fitur"
              className="flex items-center justify-center gap-2 px-6 py-3.5 sm:py-4 rounded-2xl text-xs sm:text-sm font-bold text-foreground/80 border border-line-5 bg-surface-3 hover:bg-surface-4 hover:text-foreground transition-all duration-200 w-full sm:w-auto"
            >
              <ArrowDown size={14} className="text-amber-500 animate-bounce" />
              Lihat Cuplikan Fitur Terlebih Dahulu
            </a>
          </div>

          {/* Trust strip */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground/50 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: CheckCircle, text: 'Free Trial 7 Hari Akses Penuh' },
              { icon: Clock,       text: 'Data update setiap hari 18:00 WIB' },
              { icon: Shield,      text: 'Tanpa perlu kartu kredit' },
            ].map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 font-medium">
                <Icon size={12} className="text-emerald-400" />
                {text}
              </span>
            ))}
          </div>
        </section>

        {/* ════════════════════ 2. STATS BENTO ════════════════════ */}
        <section className="px-4 md:px-6 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s) => (
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
                <p className="text-[10px] text-muted-foreground/50 mt-0.5 font-medium">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════ 3. FEATURES BENTO ════════════════════ */}
        <section id="fitur" className="px-4 md:px-6 mb-20 space-y-8 scroll-mt-24">
          <div className="text-center space-y-3">
            <div className="eyebrow justify-center">Fitur Platform</div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Satu platform,<br />
              <span className="gradient-gold">semua data yang Anda butuhkan</span>
            </h2>
            <p className="text-sm text-muted-foreground/65 max-w-xl mx-auto leading-relaxed">
              Dari screening fundamental terverifikasi, validasi akurasi backtest, hingga analisis kepemilikan institusi — BDMFlow menghadirkan data grade institusional untuk investor ritel IDX.
            </p>
          </div>

          {/* Bento asymmetric grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[minmax(160px,auto)]">
            {FEATURES.map((f) => {
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
                    <p className="text-[12px] text-muted-foreground/65 leading-relaxed">{f.desc}</p>
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

        {/* ════════════════════ 4. SCREENSHOT SHOWCASE (Prominent) ════════════════════ */}
        <section className="px-4 md:px-6 mb-24">
          <FeatureShowcase />
        </section>

        {/* ════════════════════ 5. SIGNAL ACCURACY & BACKTEST LAB SPOTLIGHT ════════════════════ */}
        <section className="px-4 md:px-6 mb-24">
          <div className="bento-card p-6 sm:p-10 relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-card to-card shadow-2xl">
            
            {/* Background Glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none bg-amber-400" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative">
              <div className="space-y-4 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-400">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Fitur Unggulan · Backtest Lab
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-foreground leading-snug">
                  Buktikan Sendiri <span className="gradient-gold">Akurasi Sinyal</span> Sebelum Memakai Modal Nyata
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground/75 leading-relaxed font-medium">
                  Tarik data historis 1 minggu, 2 minggu, hingga 3 bulan ke belakang. Lihat daftar 10 saham yang terpicu sinyal saat itu, bandingkan dengan harga hari ini, dan ukur Win Rate serta Max Potential Gain secara transparan.
                </p>

                {/* Mini Feature Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase block">Win Rate</span>
                    <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">80.0%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25">
                    <span className="text-[9px] font-bold text-cyan-400 uppercase block">Avg Return</span>
                    <span className="text-base sm:text-lg font-black text-cyan-400 font-mono">+6.8%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/25">
                    <span className="text-[9px] font-bold text-purple-400 uppercase block">Peak Gain</span>
                    <span className="text-base sm:text-lg font-black text-purple-400 font-mono">+16.4%</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25">
                    <span className="text-[9px] font-bold text-rose-400 uppercase block">Max Drawdown</span>
                    <span className="text-base sm:text-lg font-black text-rose-400 font-mono">-2.8%</span>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col gap-3 w-full lg:w-auto shrink-0">
                <TrackLink
                  href="/auth?mode=register"
                  event="cta_click"
                  data={{ cta: 'spotlight_backtest' }}
                  className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm text-black btn-gradient-gold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                >
                  Mulai Uji Sinyal (Trial 7 Hari)
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </TrackLink>
                <span className="text-[10px] text-muted-foreground/60 text-center font-medium">
                  10 Preset Sinyal Harian · Tanpa Instalasi
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════ 6. VALUE PROPS ════════════════════ */}
        <section className="px-4 md:px-6 mb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: Activity,
                accent: '#22c55e',
                accentRgb: '34,197,94',
                title: 'Data Terkini Setiap Hari',
                desc: 'Data pasar IDX, KSEI, dan laporan keuangan diproses otomatis setiap sore pukul 18:00 WIB setelah penutupan bursa, siap untuk analisis malam Anda.',
              },
              {
                icon: Building2,
                accent: '#f59e0b',
                accentRgb: '245,158,11',
                title: 'Dirancang Khusus Pasar IDX',
                desc: 'Bukan adaptasi dari platform asing — BDMFlow dibangun dari nol khusus untuk pasar modal Indonesia: KSEI >1%, bandarmologi, hingga grup konglomerat.',
              },
              {
                icon: TrendingUp,
                accent: '#38bdf8',
                accentRgb: '56,189,248',
                title: 'Keputusan Lebih Terinformasi',
                desc: 'Gabungkan data Smart Money, Foreign Flow, Fundamental Valuation, dan Backtest Signal dalam satu analisis terpadu. Kurangi noise, fokus pada sinyal berkualitas tinggi.',
              },
            ].map((v) => {
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
                  <p className="text-[11.5px] text-muted-foreground/60 leading-relaxed">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ════════════════════ 7. PRICING & FREE TRIAL ════════════════════ */}
        <section className="px-4 md:px-6 mb-24 space-y-8" id="pricing">
          <div className="text-center space-y-3">
            <div className="eyebrow justify-center">Pricing</div>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Pilih paket yang tepat
            </h2>
            <p className="text-sm text-muted-foreground/60">
              Mulai gratis dengan trial 7 hari, upgrade kapan saja. Tanpa kontrak jangka panjang.
            </p>
          </div>

          {/* Intro-period offer */}
          <div className="max-w-[760px] mx-auto flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] shadow-sm">
            <span className="text-lg">🎉</span>
            <p className="text-[12px] font-bold text-emerald-400">
              Daftar sekarang dan nikmati <span className="text-emerald-300 font-black">Free Trial 7 Hari Akses Penuh Semua Fitur Pro</span> — tanpa kartu kredit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[760px] mx-auto">

            {/* FREE */}
            <div className="bento-card p-8 flex flex-col">
              <div className="mb-8">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground/40 mb-4">Free Plan</p>
                <div className="flex items-end gap-1">
                  <span className="text-5xl font-black text-foreground">Rp 0</span>
                  <span className="text-sm text-muted-foreground/40 mb-2">/ bulan</span>
                </div>
                <p className="text-[11px] text-muted-foreground/50 mt-2 font-medium">Akses dasar untuk memantau overview pasar IDX</p>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[12px] text-muted-foreground/75">
                    <CheckCircle size={13} className="text-emerald-400/80 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-[12px] text-muted-foreground/35">
                  <Lock size={13} className="mt-0.5 shrink-0" />
                  Fitur Pro &amp; Screener Eksklusif terkunci
                </li>
              </ul>

              <TrackLink
                href="/auth?mode=register"
                event="cta_click"
                data={{ cta: 'pricing_daftar_free' }}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-center border border-line-4 bg-surface-3 hover:bg-surface-4 text-foreground/70 hover:text-foreground transition-all duration-200"
              >
                Daftar Akun Gratis
              </TrackLink>
            </div>

            {/* PRO */}
            <div className="bento-card p-8 flex flex-col relative overflow-hidden border-glow-anim"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 100%)' }}
            >
              {/* Popular badge */}
              <div className="absolute top-5 right-5 text-[9px] font-black uppercase tracking-[0.14em] px-3 py-1.5 rounded-full text-black btn-gradient-gold shadow-[0_4px_16px_rgba(245,158,11,0.3)]">
                🔥 Early Bird Promo
              </div>

              {/* Gold glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none bg-amber-400" />

              <div className="mb-8 relative">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-amber-400/80 mb-4">Pro Plan</p>
                <div className="flex items-baseline gap-2.5">
                  <span className="text-base font-bold text-muted-foreground/50 line-through font-mono">Rp 55K</span>
                  <span className="text-5xl font-black gradient-gold">Rp 30K</span>
                  <span className="text-sm text-muted-foreground/40 mb-1">/ bulan</span>
                </div>
                <p className="text-[11px] text-amber-400/90 mt-2 font-medium">
                  Atau <strong>Rp 79K / 3 bulan</strong> (Hanya Rp 26.300/bln)
                </p>
              </div>

              <ul className="space-y-3 flex-1 mb-8 relative">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[12px] text-foreground/80">
                    <CheckCircle size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <TrackLink
                href="/auth?mode=register"
                event="cta_click"
                data={{ cta: 'pricing_upgrade' }}
                className="w-full py-3.5 rounded-xl text-sm font-black text-center text-black btn-gradient-gold shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 transition-all block"
              >
                Mulai Free Trial 7 Hari
              </TrackLink>
            </div>
          </div>

          <p className="text-center text-[10px] text-muted-foreground/35">
            * Promo Early Bird terbatas. Lihat halaman{' '}
            <Link href="/pricing" className="underline hover:text-muted-foreground/60 transition-colors">pricing</Link>
            {' '}untuk opsi langganan 3 bulan (hanya Rp 26.300/bln).
          </p>
        </section>

        {/* ════════════════════ 8. FINAL CTA SPOTLIGHT ════════════════════ */}
        <section className="px-4 md:px-6">
          <div className="spotlight-block bento-card p-10 md:p-16 text-center space-y-8">

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
                Mulai Analisis Saham Lebih Cerdas
                <br />
                <span className="gradient-gold">Dengan Free Trial 7 Hari</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground/60 max-w-lg mx-auto leading-relaxed font-medium">
                Bergabung dengan investor IDX yang sudah menggunakan data institusional, analisa fundamental komprehensif, dan backtest sinyal untuk keputusan investasi yang lebih terinformasi.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <TrackLink
                href="/auth?mode=register"
                event="cta_click"
                data={{ cta: 'final_daftar' }}
                className="group flex items-center gap-2.5 px-10 py-4 rounded-2xl font-black text-sm text-black transition-all duration-200 active:scale-95 btn-gradient-gold shadow-[0_8px_40px_rgba(245,158,11,0.35)] hover:shadow-[0_12px_48px_rgba(245,158,11,0.5)]"
              >
                Daftar &amp; Aktifkan Free Trial 7 Hari
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </TrackLink>
            </div>

            <p className="text-[10.5px] text-muted-foreground/40 flex items-center justify-center gap-2">
              <Shield size={11} className="text-emerald-400/60" />
              Bukan nasihat keuangan. DYOR. Data pasar diupdate setiap sore pukul 18:00 WIB.
            </p>
          </div>
        </section>

        {/* ════════════════════ FOOTER MINI ════════════════════ */}
        <div className="mt-16 px-4 md:px-6 pt-8 border-t border-border/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground/40">
            <div className="flex items-center gap-2">
              <BrandLogoIcon size={20} />
              <span className="font-black text-foreground">BDM<span className="text-amber-400">Flow</span></span>
              <span>·</span>
              <span>IDX Intelligence © 2026</span>
            </div>
            <div className="flex items-center gap-5 font-medium">
              <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="/backtest" className="hover:text-foreground transition-colors">Backtest Lab</Link>
              <Link href="/screener-fundamental" className="hover:text-foreground transition-colors">Fundamental</Link>
              <Link href="/screener" className="hover:text-foreground transition-colors">Screener</Link>
              <Link href="/auth" className="hover:text-foreground transition-colors">Masuk / Daftar</Link>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Update 18:00 WIB
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <Link href="/terms" className="hover:text-foreground transition-colors">Syarat &amp; Ketentuan</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Kontak</Link>
              <a href="mailto:mulyanto.my88@gmail.com" className="hover:text-foreground transition-colors">mulyanto.my88@gmail.com</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
