'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/auth-context'
import TickerTape from './ticker-tape'
import GlobalSearch from './global-search'
import ThemeToggle from './theme-toggle'
import InlineActionCenter from './inline-action-center'
import Sidebar from './sidebar'

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

  const [trialLeft, setTrialLeft] = useState<number | null>(null)
  const [trialReady, setTrialReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user) { setTrialReady(true); return }
    let ts = Number(localStorage.getItem(TRIAL_KEY)) || 0
    if (!ts && proPage) {
      ts = Date.now()
      localStorage.setItem(TRIAL_KEY, String(ts))
    }
    setTrialLeft(ts ? Math.ceil(TRIAL_DAYS - (Date.now() - ts) / 86400000) : null)
    setTrialReady(true)
  }, [user, proPage, pathname])

  const trialActive = trialLeft !== null && trialLeft > 0
  const guestAllowed = freePage || trialActive

  useEffect(() => {
    if (!loading && trialReady && !user && proPage && !guestAllowed) router.replace('/auth')
  }, [loading, trialReady, user, proPage, guestAllowed, router])

  // Bare public pages (landing, auth, pricing) — no shell.
  if (publicPage) {
    return (
      <main className="w-full">
        {children}
      </main>
    )
  }

  // Loading / blocked
  if (loading || !trialReady || (!user && !guestAllowed)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      </div>
    )
  }

  const guestMsg =
    trialLeft === null
      ? '🎁 Trial Pro aktif — 7 hari gratis, tanpa daftar.'
      : trialLeft > 0
        ? `🎁 Trial Pro — ${trialLeft} hari tersisa.`
        : '⏳ Trial habis.'

  return (
    <div className="flex min-h-screen text-foreground selection:bg-amber-500/30" style={{ background: 'hsl(var(--background))' }}>
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* ═══ ROW 1: Command Strip ═══ */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 lg:px-6 backdrop-blur-xl"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}>
          
          {/* Left side spacing for mobile */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.2)]">B</div>
            <span className="text-sm font-black text-amber-500 tracking-tight">BDMFlow</span>
          </div>
          
          <div className="hidden md:block"></div>

          {/* Right: Search + Theme + CTA */}
          <div className="flex items-center gap-3 ml-auto">
            <GlobalSearch />
            <ThemeToggle />
            {user ? (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-bold text-[10px] tracking-widest border border-amber-500/20">PRO</span>
            ) : (
              <Link
                href="/auth"
                className="px-3 py-1.5 rounded-lg text-[11px] font-black text-slate-950 whitespace-nowrap bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              >
                Daftar Gratis
              </Link>
            )}
          </div>
        </header>

        {/* ═══ Guest Banner (slim) ═══ */}
        {!user && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold bg-amber-500/10 border-b border-amber-500/20 text-amber-400/90">
            <span>{guestMsg}</span>
            <Link href="/auth" className="underline font-black hover:text-amber-200">Daftar gratis →</Link>
          </div>
        )}

        {/* ═══ ROW 2: Ticker Tape ═══ */}
        <TickerTape />

        {/* ═══ MAIN CONTENT ═══ */}
        <main className="flex-1 w-full pb-20 md:pb-8">
          {children}
        </main>
      </div>

      <InlineActionCenter />
    </div>
  )
}
