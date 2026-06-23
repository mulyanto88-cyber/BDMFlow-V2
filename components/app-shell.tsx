'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import Sidebar from './sidebar'
import TickerTape from './ticker-tape'
import GlobalSearch from './global-search'
import ThemeToggle from './theme-toggle'
import LiveClock from './live-clock'
import InlineActionCenter from './inline-action-center'
import MobileBottomNav from './mobile-bottom-nav'
import InstallButton from './install-button'

// Bare pages (no shell): landing, auth, pricing.
const PUBLIC_ROUTES = ['/', '/auth', '/pricing']
// Always-free pages (full shell, no account, no expiry) — the advertised Free tier.
const FREE_ROUTES = ['/dashboard', '/sector', '/groups']
// Everything else = Pro: open during a 7-day guest trial, then requires a (free) signup.
const TRIAL_DAYS = 7
const TRIAL_KEY = 'bdmflow_trial_start'

const isPublic = (p: string) => PUBLIC_ROUTES.includes(p)
const isFree = (p: string) => FREE_ROUTES.includes(p)

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()

  const publicPage = isPublic(pathname)
  const freePage = isFree(pathname)
  const proPage = !publicPage && !freePage

  // Guest trial, resolved on the client only (localStorage → avoids SSR hydration mismatch).
  // trialLeft: days remaining; null = trial never started. NOTE: client-side & bypassable by
  // design — a soft conversion nudge for the free phase, not a hard paywall.
  const [trialLeft, setTrialLeft] = useState<number | null>(null)
  const [trialReady, setTrialReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user) { setTrialReady(true); return } // signed-in users skip the trial entirely
    let ts = Number(localStorage.getItem(TRIAL_KEY)) || 0
    // Start the 7-day clock the first time a guest opens a Pro page.
    if (!ts && proPage) {
      ts = Date.now()
      localStorage.setItem(TRIAL_KEY, String(ts))
    }
    setTrialLeft(ts ? Math.ceil(TRIAL_DAYS - (Date.now() - ts) / 86400000) : null)
    setTrialReady(true)
  }, [user, proPage, pathname])

  const trialActive = trialLeft !== null && trialLeft > 0
  // Guests may always view free pages, or any page while their trial is active.
  const guestAllowed = freePage || trialActive

  // Once the trial is over, push guests off Pro pages to signup.
  useEffect(() => {
    if (!loading && trialReady && !user && proPage && !guestAllowed) router.replace('/auth')
  }, [loading, trialReady, user, proPage, guestAllowed, router])

  // Bare public pages (landing, auth, pricing) — no shell.
  if (publicPage) {
    return (
      <main className="px-3 sm:px-5 lg:px-7 py-4 md:py-6 pb-16">
        {children}
      </main>
    )
  }

  // Wait for auth + trial to resolve, or hold a blocked guest while redirecting.
  if (loading || !trialReady || (!user && !guestAllowed)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
      </div>
    )
  }

  // Guest banner copy adapts to trial state.
  const guestMsg =
    trialLeft === null
      ? '👀 Semua fitur Pro gratis 7 hari, tanpa daftar. Daftar gratis = akses permanen + watchlist & alert tersimpan.'
      : trialLeft > 0
        ? `🎁 Trial Pro aktif — ${trialLeft} hari tersisa. Daftar gratis = akses permanen (watchlist & alert tersimpan), tak terputus saat trial habis.`
        : '⏳ Trial 7 hari habis. Daftar gratis = akses penuh permanen + watchlist & alert tersimpan.'

  // Authenticated, or a guest on an allowed page → full app shell.
  return (
    <>
      <Sidebar />

      <div className="sidebar-offset flex flex-col min-h-screen transition-all duration-200">

        <header className="app-header sticky top-0 z-30 h-14 flex items-center px-5 gap-3">
          <div className="flex items-center gap-2 md:hidden">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 font-mono"
              style={{
                background: 'linear-gradient(135deg,#e7b733,#c49a1a)',
                color: '#0a122c',
                boxShadow: '0 2px 10px rgba(231,183,51,0.30)',
              }}
            >B</div>
            <p className="text-sm font-black gradient-gold">BDMFlow</p>
          </div>

          <div className="hidden md:flex items-center gap-3 flex-1">
            <LiveClock />
          </div>

          <GlobalSearch />

          <div className="flex items-center gap-2 flex-shrink-0">
            <InstallButton />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] text-[10px] text-muted-foreground/60">
              <span className="pulse-dot" />
              <span className="font-mono">T+1</span>
            </div>
            <ThemeToggle />
            {user ? (
              <span className="badge-pro">PRO</span>
            ) : (
              <Link
                href="/auth"
                className="px-3 py-1.5 rounded-lg text-[11px] font-black text-black whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#e7b733,#f0c040)', boxShadow: '0 2px 12px rgba(231,183,51,0.30)' }}
              >
                Daftar Gratis
              </Link>
            )}
          </div>
        </header>

        {/* Guest banner — only for visitors without an account. */}
        {!user && (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-[11px] font-semibold bg-gold-400/[0.08] border-b border-gold-400/15 text-gold-300 text-center">
            <span>{guestMsg}</span>
            <Link href="/auth" className="underline font-black hover:text-gold-200">Daftar gratis →</Link>
          </div>
        )}

        <TickerTape />

        <main className="flex-1 px-3 sm:px-5 lg:px-7 py-4 md:py-5 pb-20 md:pb-5">
          {children}
        </main>

        <footer className="hidden md:block border-t border-white/[0.04] py-3.5 px-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[10.5px] text-muted-foreground/40">
            <p>
              © 2026 <span className="font-semibold text-muted-foreground/60">BDMFlow</span>
              {' '}· IDX Flow Intelligence · Data sourced from KSEI &amp; IDX.
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
              Not financial advice. DYOR.
            </p>
          </div>
        </footer>
      </div>

      <MobileBottomNav />
      <InlineActionCenter />
    </>
  )
}
