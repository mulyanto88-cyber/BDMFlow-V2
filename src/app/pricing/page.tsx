export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Crown, Check, ShieldCheck, Zap, Info } from 'lucide-react'
import CheckoutButton from '@/components/checkout-button'
import PaidBanner from '@/components/paid-banner'

export default function PricingPage() {
  return (
    <div className="space-y-10 animate-fade-in pb-12 max-w-6xl mx-auto px-4">
      <PaidBanner />

      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
          <Crown className="w-7 h-7 text-black" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Pilihan Paket Langganan</h1>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Pilih paket yang sesuai kebutuhan analisis pasar saham Anda. Nikmati fitur terlengkap tanpa batasan.
        </p>
      </div>

      {/* 3 Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* 1. Free Tier */}
        <div className="glass rounded-3xl p-6 border border-border/40 flex flex-col justify-between relative bg-surface-1/50 shadow-xs">
          <div>
            <div className="mb-5">
              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Akun Dasar</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-foreground">Gratis</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Akses fitur esensial pasar modal.</p>
            </div>

            <div className="space-y-2.5 py-4 border-t border-line-2">
              {[
                'Market Overview real-time',
                'Stock Detail & Chart dasar',
                '5 pencarian per hari',
                'Komunitas & Edukasi'
              ].map((f, j) => (
                <div key={j} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-surface-3 flex items-center justify-center text-muted-foreground text-[10px] shrink-0">✓</span>
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
              Mulai Gratis
            </Link>
          </div>
        </div>

        {/* 2. Pro Tier (Hero Card) */}
        <div className="rounded-3xl p-6 sm:p-7 border-2 border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] via-card to-card flex flex-col justify-between relative shadow-xl shadow-amber-500/5 order-first md:order-none">
          <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-md shadow-amber-500/20">
            🔥 Paling Populer
          </span>

          <div>
            <div className="mb-4">
              <span className="text-xs font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest">BDMFlow Pro</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-foreground">Rp 55K</span>
                <span className="text-xs text-muted-foreground font-mono">/ bulan</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Atau <strong>Rp 135K / 3 bulan</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">(Hemat 18% · Rp 45K/bln)</span>
              </p>
            </div>

            {/* Features List */}
            <div className="space-y-2.5 py-4 border-t border-line-2">
              {[
                'Semua fitur Free tanpa batas',
                'Screener Pro & FTSE Radar unlimited',
                'Big Player Flow Tracker (5% & 1%)',
                'Smart Money Score & Broker DNA',
                'Whale Tracker & KSEI Intel',
                'Backtest Lab Akurasi Sinyal (Win Rate)',
                'Priority Data Updates & Alerts'
              ].map((f, j) => (
                <div key={j} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 text-[10px] shrink-0 font-black">✓</span>
                  <span className="text-xs text-foreground/90 font-medium">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 border-t border-line-2">
            <CheckoutButton />
          </div>
        </div>

        {/* 3. Institutional Tier */}
        <div className="glass rounded-3xl p-6 border border-purple-500/30 flex flex-col justify-between relative bg-surface-1/50 shadow-xs">
          <div>
            <div className="mb-5">
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Institutional</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-foreground">Custom</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Untuk sekuritas, fund manager &amp; tim riset.</p>
            </div>

            <div className="space-y-2.5 py-4 border-t border-line-2">
              {[
                'Semua fitur Pro',
                'Direct API access & custom feed',
                'Multi-user institutional dashboard',
                'Dedicated 24/7 technical support',
                'Custom screening algorithm & alerting'
              ].map((f, j) => (
                <div key={j} className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 text-[10px] shrink-0 font-bold">✓</span>
                  <span className="text-xs text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="mailto:mulyanto.my88@gmail.com?subject=BDMFlow%20Institutional%20Inquiry"
              className="w-full py-3 rounded-xl text-xs font-bold transition-all text-center block bg-surface-2 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30 shadow-xs"
            >
              Hubungi Tim Kami
            </Link>
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
          Pembayaran diproses dengan aman melalui QRIS, Virtual Account, &amp; E-Wallet. Aktivasi instan setelah konfirmasi pembayaran.
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
