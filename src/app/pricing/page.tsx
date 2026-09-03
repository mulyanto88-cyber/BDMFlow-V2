export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Crown, Check, ShieldCheck, Zap, Info, BarChart3, Users, Target, Activity, HelpCircle } from 'lucide-react'
import CheckoutButton from '@/components/checkout-button'
import PaidBanner from '@/components/paid-banner'

export default function PricingPage() {
  return (
    <div className="space-y-12 animate-fade-in pb-16 max-w-5xl mx-auto px-4 sm:px-6">
      <PaidBanner />

      {/* ══ HERO HEADER ═══════════════════════════════════════════════════ */}
      <div className="text-center space-y-4 pt-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-black tracking-wide uppercase shadow-xs">
          <Crown className="w-3.5 h-3.5 text-amber-400" />
          <span>Promo Peluncuran • Early Bird</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-tight">
          Investasi Cerdas untuk <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            Akurasi Trading Terukur
          </span>
        </h1>
        
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          Dapatkan intelijen pasar modal setara institusi: lacak Smart Money, pergerakan Broker Pengendali, dan data kepemilikan KSEI 1% secara real-time.
        </p>
      </div>

      {/* ══ PRICING CARDS GRID (FREE VS PRO) ══════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
        
        {/* 1. Free Tier */}
        <div className="glass rounded-3xl p-6 sm:p-8 border border-border/50 flex flex-col justify-between relative bg-surface-1/40 shadow-xs">
          <div>
            <div className="mb-6">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                Akun Standar
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-foreground">Gratis</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Fitur esensial untuk pemantauan dasar pergerakan pasar modal.
              </p>
            </div>

            <div className="space-y-3 py-5 border-t border-line-2">
              {[
                'Market Overview IHSG real-time',
                'Stock Detail & Chart dasar',
                'Foreign Flow ringkasan harian',
                'Pencarian saham terbatas (5/hari)',
                'Akses data tertunda (delayed data)'
              ].map((f, j) => (
                <div key={j} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-surface-3 flex items-center justify-center text-muted-foreground text-[10px] shrink-0">
                    ✓
                  </span>
                  <span className="text-xs text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/auth"
              className="w-full py-3 rounded-xl text-xs font-bold transition-all text-center block bg-surface-2 hover:bg-surface-3 text-foreground border border-line-2 shadow-xs"
            >
              Mulai Akun Gratis
            </Link>
          </div>
        </div>

        {/* 2. Pro Tier (Early Bird Hero Card) */}
        <div className="rounded-3xl p-6 sm:p-8 border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/[0.08] via-card to-card flex flex-col justify-between relative shadow-2xl shadow-amber-500/10">
          {/* Badge Promo */}
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/30 whitespace-nowrap">
            🔥 Early Bird • Kuota Terbatas
          </span>

          <div>
            <div className="mb-6">
              <span className="text-xs font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">
                BDMFlow Pro Full Access
              </span>
              
              {/* Price Anchoring / Harga Coret */}
              <div className="flex items-baseline gap-2.5 mt-2">
                <span className="text-sm sm:text-base font-bold text-muted-foreground/60 line-through font-mono">
                  Rp 55.000
                </span>
                <span className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                  Rp 30K
                </span>
                <span className="text-xs text-muted-foreground font-mono">/ bulan</span>
              </div>

              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <span>Atau <strong>Rp 79K / 3 bulan</strong> (Hanya Rp 26.300/bln)</span>
              </div>
            </div>

            {/* Pro Features List (Strictly Public & High Value) */}
            <div className="space-y-3 py-5 border-t border-line-2">
              {[
                { text: 'Smart Money Flow & Broker DNA Matrix', desc: 'Lacak akumulasi vs distribusi broker dominan' },
                { text: 'KSEI Intel 1% & 5% Insider Ownership', desc: 'Deteksi pergerakan konglomerat & pemegang saham besar' },
                { text: 'Screener Pro & FTSE / MSCI Radar', desc: 'Filter saham potensial breakout secara real-time' },
                { text: 'AOV Spike Anomaly & Whale Tracker', desc: 'Indikator transaksi anomali transaksi volume besar' },
                { text: 'Backtest Lab Win Rate Sinyal', desc: 'Uji akurasi historis strategi sebelum eksekusi' },
                { text: 'Akses Penuh Tanpa Batas & Tanpa Iklan', desc: 'Analisa tanpa limit harian' }
              ].map((f, j) => (
                <div key={j} className="flex items-start gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center text-[10px] shrink-0 font-black mt-0.5">
                    ✓
                  </span>
                  <div>
                    <span className="text-xs text-foreground font-bold block">{f.text}</span>
                    <span className="text-[10.5px] text-muted-foreground block">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-line-2">
            <CheckoutButton />
          </div>
        </div>

      </div>

      {/* ══ VALUE HIGHLIGHT PILLARS ═══════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto pt-6 border-t border-border/30">
        <h2 className="text-center text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">
          Keunggulan Analisa BDMFlow
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-surface-1/60 border border-border/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Data Asli &amp; Terverifikasi</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Disinkronisasi langsung dari data resmi transaksi bursa IDX dan KSEI tanpa estimasi buatan.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-1/60 border border-border/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Logika Bandarmologi Murni</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Melihat siapa yang mengendalikan harga: broker asing, institusi lokal, atau ritel yang terjebak.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-surface-1/60 border border-border/40 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Tingkatkan Win Rate</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Hindari beli di pucuk fase distribusi dan ikuti jejak Smart Money saat mereka masih akumulasi.
            </p>
          </div>
        </div>
      </div>

      {/* ══ FAQ RINGKAS ═══════════════════════════════════════════════════ */}
      <div className="max-w-2xl mx-auto pt-6 space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-black text-foreground">Pertanyaan Umum (FAQ)</h2>
          <p className="text-xs text-muted-foreground">Hal-hal yang sering ditanyakan seputar langganan Pro.</p>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-surface-1/40 border border-border/40 space-y-1">
            <h4 className="text-xs font-bold text-foreground">Bagaimana cara aktivasi akun Pro setelah bayar?</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Setelah konfirmasi via WhatsApp atau transfer QRIS/BCA, tim kami akan mengaktifkan paket Pro di akun Anda dalam waktu 1-5 menit.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1/40 border border-border/40 space-y-1">
            <h4 className="text-xs font-bold text-foreground">Apakah ada sistem langganan potong saldo otomatis (auto-renew)?</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tidak ada. Anda bebas memilih kapan ingin memperpanjang paket langganan tanpa khawatir saldo terpotong otomatis.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-1/40 border border-border/40 space-y-1">
            <h4 className="text-xs font-bold text-foreground">Apakah saya bisa mengakses dashboard di Smartphone?</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Bisa. Dashboard BDMFlow dirancang sepenuhnya responsif dan nyaman dibuka melalui Browser HP, Tablet, maupun Laptop/PC.
            </p>
          </div>
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="text-center pt-2">
        <Link href="/dashboard" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
          <span>← Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* Compliance / Footer Note */}
      <div className="border-t border-border/20 pt-6 text-center space-y-2 max-w-2xl mx-auto">
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
          Aktivasi cepat via Transfer Bank &amp; QRIS. Layanan bantuan dan konfirmasi tersedia melalui WhatsApp resmi BDMFlow.
        </p>
        <p className="text-[10.5px] text-muted-foreground/50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/terms" className="underline hover:text-muted-foreground transition-colors">Syarat &amp; Ketentuan</Link>
          <Link href="/privacy" className="underline hover:text-muted-foreground transition-colors">Kebijakan Privasi</Link>
          <Link href="/contact" className="underline hover:text-muted-foreground transition-colors">Kontak</Link>
          <a href="mailto:mulyanto.my88@gmail.com" className="hover:text-muted-foreground transition-colors">mulyanto.my88@gmail.com</a>
        </p>
      </div>
    </div>
  )
}
