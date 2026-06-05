export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Zap, Globe, BarChart2, Eye, TrendingUp, Calculator,
  Shield, CheckCircle, ArrowRight, Star, Search,
  Activity, Brain, Building2, Lock,
} from 'lucide-react'

// ── Features data ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Search,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    title: 'Screener Pro',
    desc: 'Filter 900+ saham IDX dengan 15+ sinyal — Smart Money, Whale Signal, Foreign Flow, Breakout Scanner, dan MSCI Screener dalam satu tampilan.',
    badge: 'PRO',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    icon: Brain,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Smart Money Matrix',
    desc: 'Lacak pergerakan dana institusi, whale signal, dan big player anomaly secara real-time. Ketahui ke mana uang besar mengalir sebelum terlambat.',
    badge: null,
    badgeColor: '',
  },
  {
    icon: Globe,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    title: 'Foreign Flow Intelligence',
    desc: 'Monitor aliran dana asing per saham, sektor, dan konglomerat. Visualisasi divergensi harga vs kumulatif foreign flow dengan chart interaktif.',
    badge: null,
    badgeColor: '',
  },
  {
    icon: BarChart2,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    title: 'Broker Tracker & Flow',
    desc: 'Analisis ringkasan broker harian, identifikasi broker dominan, dan lacak konsistensi akumulasi / distribusi oleh broker-broker besar.',
    badge: 'PRO',
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  },
  {
    icon: Eye,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'KSEI Intelligence',
    desc: 'Data kepemilikan KSEI >1%, stealth accumulation signal, perubahan bulanan kepemilikan, dan Major Holder tracker untuk 900+ emiten IDX.',
    badge: 'PRO',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    icon: Calculator,
    color: 'text-gold-400',
    bg: 'bg-gold-400/10 border-gold-400/20',
    title: 'Personal Tools',
    desc: 'Backtest Lab untuk validasi strategi, Watchlist & Alert personal, Right Issue Calculator, dan Radar scoring system dengan 20+ parameter.',
    badge: 'PRO',
    badgeColor: 'bg-gold-400/15 text-gold-400 border-gold-400/30',
  },
]

const STATS = [
  { value: '900+', label: 'Saham IDX dipantau', color: 'text-gold-400' },
  { value: '15+',  label: 'Tipe sinyal tersedia', color: 'text-emerald-400' },
  { value: 'T+1',  label: 'Data harian real-time', color: 'text-sky-400' },
  { value: '5',    label: 'Sumber data terintegrasi', color: 'text-purple-400' },
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
    <div className="max-w-[1100px] mx-auto space-y-20 pb-20 animate-fade-in">

      {/* ════════════════════ HERO ════════════════════ */}
      <section className="pt-10 md:pt-14 text-center space-y-7">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-400/25 bg-gold-400/[0.07] text-[11px] font-black uppercase tracking-[0.18em] text-gold-400">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse" />
          Platform Riset Saham IDX
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.08]">
            <span className="gradient-gold">Analisis Saham IDX</span>
            <br />
            <span className="text-foreground">dengan Data Institusi</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Lacak Smart Money, Foreign Flow, dan KSEI secara real-time.
            Screener Pro, Backtest Lab, Broker Tracker, dan 10+ tools lainnya
            — semua dalam satu platform untuk investor IDX yang serius.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/auth"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-black text-sm text-black transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #e7b733, #f0c040)',
              boxShadow: '0 4px 24px rgba(231,183,51,0.35)',
            }}
          >
            Mulai Gratis <ArrowRight size={15} />
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold text-foreground/80 border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] transition-all duration-200"
          >
            Lihat Dashboard
          </Link>
        </div>

        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground/50">
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-400/70" />
            Gratis selamanya (paket Free)
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-400/70" />
            Tidak perlu kartu kredit
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-emerald-400/70" />
            Data IDX T+1 setiap hari
          </span>
        </div>
      </section>

      {/* ════════════════════ STATS STRIP ════════════════════ */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map(s => (
            <div key={s.label} className="glass rounded-2xl p-5 text-center card-hover">
              <p className={`text-3xl font-black ${s.color} leading-none mb-1.5`}>{s.value}</p>
              <p className="text-[11px] text-muted-foreground/60 font-semibold leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════ FEATURES GRID ════════════════════ */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">
            Fitur Platform
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            Semua yang Anda butuhkan, dalam satu tempat
          </h2>
          <p className="text-sm text-muted-foreground/65 max-w-xl mx-auto">
            Dari screening saham hingga analisis kepemilikan institusi — BDMFlow IDX menghadirkan data grade institusional untuk investor ritel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="glass rounded-2xl p-5 card-hover flex flex-col gap-3.5">
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center border ${f.bg}`}>
                    <Icon size={18} className={f.color} />
                  </div>
                  {f.badge && (
                    <span className={`text-[9px] font-black uppercase tracking-[0.12em] px-2 py-1 rounded-lg border ${f.badgeColor}`}>
                      {f.badge}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-[13px] font-black text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-[11.5px] text-muted-foreground/65 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════ VALUE PROPS ════════════════════ */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Activity,
              color: 'text-emerald-400',
              bg: 'from-emerald-500/10 to-transparent border-emerald-500/20',
              title: 'Data Segar Setiap Hari',
              desc: 'Data T+1 dari IDX, KSEI, dan sumber resmi lainnya. Diproses otomatis setiap malam supaya Anda selalu analisis dengan data terbaru.',
            },
            {
              icon: Shield,
              color: 'text-gold-400',
              bg: 'from-gold-400/10 to-transparent border-gold-400/20',
              title: 'Dirancang untuk IDX',
              desc: 'Bukan adaptasi dari platform asing — BDMFlow IDX dibangun dari nol khusus untuk pasar Indonesia. KSEI, bandarmologi, grup konglomerat.',
            },
            {
              icon: TrendingUp,
              color: 'text-sky-400',
              bg: 'from-sky-500/10 to-transparent border-sky-500/20',
              title: 'Keputusan Lebih Terinformasi',
              desc: 'Gabungkan data Smart Money, Foreign Flow, dan KSEI dalam satu analisis terpadu. Kurangi noise, fokus pada signal yang penting.',
            },
          ].map(v => {
            const Icon = v.icon
            return (
              <div
                key={v.title}
                className={`rounded-2xl p-6 border bg-gradient-to-br ${v.bg}`}
              >
                <Icon size={22} className={`${v.color} mb-4`} />
                <h3 className="text-[13px] font-black text-foreground mb-2">{v.title}</h3>
                <p className="text-[11.5px] text-muted-foreground/65 leading-relaxed">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ════════════════════ PRICING ════════════════════ */}
      <section className="space-y-6" id="pricing">
        <div className="text-center space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground/40">
            Pricing
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-foreground">
            Pilih paket yang tepat untuk Anda
          </h2>
          <p className="text-sm text-muted-foreground/65">
            Mulai gratis, upgrade kapan saja. Tidak ada kontrak jangka panjang.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-[780px] mx-auto">

          {/* FREE */}
          <div className="glass rounded-2xl p-7 border border-border/50 flex flex-col">
            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground/45 mb-3">Free</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black text-foreground">Rp 0</span>
                <span className="text-sm text-muted-foreground/50 mb-1.5">/ bulan</span>
              </div>
              <p className="text-[11px] text-muted-foreground/50 mt-2">
                Akses dasar untuk mulai mengenal pasar IDX
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[11.5px] text-muted-foreground/70">
                  <CheckCircle size={13} className="text-emerald-400/70 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-[11.5px] text-muted-foreground/35">
                <Lock size={13} className="mt-0.5 shrink-0" />
                Fitur Premium terkunci
              </li>
            </ul>

            <Link
              href="/auth"
              className="w-full py-3 rounded-xl text-sm font-bold text-center border border-border/50 bg-white/[0.04] hover:bg-white/[0.08] text-foreground/70 hover:text-foreground transition-all duration-200"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* PRO */}
          <div
            className="rounded-2xl p-7 flex flex-col relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(231,183,51,0.09), rgba(231,183,51,0.03))',
              border: '1px solid rgba(231,183,51,0.25)',
              boxShadow: '0 8px 40px rgba(231,183,51,0.10)',
            }}
          >
            {/* Popular badge */}
            <div
              className="absolute top-5 right-5 text-[9px] font-black uppercase tracking-[0.14em] px-2.5 py-1 rounded-full text-black"
              style={{ background: 'linear-gradient(135deg, #e7b733, #f0c040)' }}
            >
              Terpopuler
            </div>

            <div className="mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-400/70 mb-3">Pro</p>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black gradient-gold">Rp 149K</span>
                <span className="text-sm text-muted-foreground/50 mb-1.5">/ bulan</span>
              </div>
              <p className="text-[11px] text-muted-foreground/55 mt-2">
                Akses penuh ke semua fitur tanpa batasan
              </p>
            </div>

            <ul className="space-y-2.5 flex-1 mb-7">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-[11.5px] text-foreground/75">
                  <CheckCircle size={13} className="text-gold-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/auth"
              className="w-full py-3 rounded-xl text-sm font-black text-center text-black transition-all duration-200 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #e7b733, #f0c040)',
                boxShadow: '0 4px 20px rgba(231,183,51,0.30)',
              }}
            >
              Mulai Pro Sekarang →
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/30">
          * Harga dapat berubah sewaktu-waktu. Lihat halaman{' '}
          <Link href="/pricing" className="underline hover:text-muted-foreground/60 transition-colors">
            pricing
          </Link>{' '}
          untuk detail.
        </p>
      </section>

      {/* ════════════════════ FINAL CTA ════════════════════ */}
      <section>
        <div
          className="rounded-3xl p-10 md:p-14 text-center space-y-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(231,183,51,0.08), rgba(231,183,51,0.03), rgba(0,0,0,0))',
            border: '1px solid rgba(231,183,51,0.15)',
          }}
        >
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 50% 0%, rgba(231,183,51,0.15), transparent 65%)',
            }}
          />

          <div className="relative space-y-4">
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-gold-400 fill-gold-400" />
              ))}
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-foreground leading-tight">
              Mulai Analisis Lebih Cerdas
              <br />
              <span className="gradient-gold">Hari Ini</span>
            </h2>
            <p className="text-sm text-muted-foreground/65 max-w-lg mx-auto leading-relaxed">
              Bergabung dengan investor IDX yang sudah menggunakan data institusional
              untuk keputusan investasi yang lebih terinformasi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/auth"
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm text-black transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #e7b733, #f0c040)',
                  boxShadow: '0 4px 24px rgba(231,183,51,0.35)',
                }}
              >
                Daftar Gratis <ArrowRight size={15} />
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-bold text-muted-foreground/60 hover:text-foreground/80 transition-colors"
              >
                Lihat Dashboard dulu →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════ FOOTER MINI ════════════════════ */}
      <section className="border-t border-border/30 pt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground/35">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] font-mono"
              style={{
                background: 'linear-gradient(135deg,#e7b733,#c49a1a)',
                color: '#0a122c',
              }}
            >B</div>
            <span className="font-bold text-muted-foreground/50">BDMFlow IDX</span>
            <span>·</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="hover:text-muted-foreground/60 transition-colors">Pricing</Link>
            <Link href="/dashboard" className="hover:text-muted-foreground/60 transition-colors">Dashboard</Link>
            <Link href="/auth" className="hover:text-muted-foreground/60 transition-colors">Login</Link>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
              Not financial advice. DYOR.
            </span>
          </div>
        </div>
      </section>

    </div>
  )
}
