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
import { ChevronRight, Bell } from 'lucide-react'

// Bare pages (no shell): landing, auth, pricing.
const PUBLIC_ROUTES = ['/', '/auth', '/pricing']
// Always-free pages (full shell, no account, no expiry) — the advertised Free tier.
const FREE_ROUTES = ['/dashboard', '/sector', '/groups']
// Everything else = Pro: open during a 7-day guest trial, then requires a (free) signup.
const TRIAL_DAYS = 7
const TRIAL_KEY = 'bdmflow_trial_start'

const isPublic = (p: string) => PUBLIC_ROUTES.includes(p)
const isFree   = (p: string) => FREE_ROUTES.includes(p)

// ── Page title map for breadcrumb ───────────────────────────────────────────
const PAGE_META: Record<string, { title: string; parent?: string }> = {
  '/dashboard':       { title: 'Morning Brief' },
  '/composite':       { title: 'Composite Command',  parent: 'Markets' },
  '/bandarmologi':    { title: 'Bandarmologi',        parent: 'Markets' },
  '/sector':          { title: 'Sector Analytics',   parent: 'Markets' },
  '/groups':          { title: 'Group Intelligence',  parent: 'Markets' },
  '/screener':        { title: 'Pro Screener',        parent: 'Screeners' },
  '/volume-aov':      { title: 'Breakout Scanner',   parent: 'Screeners' },
  '/smart-money':     { title: 'Smart Money Matrix', parent: 'Screeners' },
  '/radar':           { title: 'Watchlist Radar',    parent: 'Screeners' },
  '/msci-screener':   { title: 'MSCI Screener',      parent: 'Screeners' },
  '/ftse-screener':   { title: 'FTSE Screener',      parent: 'Screeners' },
  '/foreign-flow':    { title: 'Foreign Flow',       parent: 'Aliran Dana' },
  '/broker-flow':     { title: 'Broker Flow Harian', parent: 'Aliran Dana' },
  '/broker-tracker':  { title: 'Broker Summary',     parent: 'Aliran Dana' },
  '/ksei-monthly':    { title: 'KSEI Monthly',       parent: 'KSEI' },
  '/ksei1persen':     { title: 'KSEI > 1%',          parent: 'KSEI' },
  '/insider':         { title: 'Insider Radar',      parent: 'KSEI' },
  '/watchlist':       { title: 'Watchlist & Alerts', parent: 'Tools' },
  '/backtest':        { title: 'Backtest Lab',        parent: 'Tools' },
  '/right-issue-calc':{ title: 'Right Issue Calc',   parent: 'Tools' },
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, loading } = useAuth()

  const publicPage = isPublic(pathname)
  const freePage   = isFree(pathname)
  const proPage    = !publicPage && !freePage

  const [trialLeft, setTrialLeft]   = useState<number | null>(null)
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

  const trialActive  = trialLeft !== null && trialLeft > 0
  const guestAllowed = freePage || trialActive

  useEffect(() => {
    if (!loading && trialReady && !user && proPage && !guestAllowed) router.replace('/auth')
  }, [loading, trialReady, user, proPage, guestAllowed, router])

  // Bare public pages (landing, auth, pricing) — no shell.
  if (publicPage) {
    return <main className="w-full">{children}</main>
  }

  // Loading / blocked
  if (loading || !trialReady || (!user && !guestAllowed)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <span className="text-[11px] text-muted-foreground/40 font-mono">Loading...</span>
        </div>
      </div>
    )
  }

  // Breadcrumb
  const pageMeta = PAGE_META[pathname] ?? { title: pathname.replace('/', '').replace(/-/g, ' ') }

  const guestMsg =
    trialLeft === null
      ? '🎁 Trial Pro aktif — 7 hari gratis, tanpa daftar.'
      : trialLeft > 0
        ? `🎁 Trial Pro — ${trialLeft} hari tersisa.`
        : '⏳ Trial habis.'

  return (
    <div className="flex min-h-screen text-foreground selection:bg-primary/20" style={{ background: 'hsl(var(--background))' }}>
      
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">

        {/* ═══ HEADER ═══ */}
        <header
          className="sticky top-0 z-30 flex items-center h-14 px-4 lg:px-5 gap-4 backdrop-blur-xl"
          style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}
        >
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.2)]">B</div>
            <span className="text-sm font-black text-amber-500 tracking-tight">BDMFlow</span>
          </div>

          {/* Breadcrumb — desktop only */}
          <nav className="hidden md:flex items-center gap-1.5 text-[11px] shrink-0">
            <span className="text-muted-foreground/30 font-medium">BDMFlow</span>
            {pageMeta.parent && (
              <>
                <ChevronRight size={11} className="text-muted-foreground/20" />
                <span className="text-muted-foreground/40 font-medium">{pageMeta.parent}</span>
              </>
            )}
            <ChevronRight size={11} className="text-muted-foreground/20" />
            <span className="font-bold text-foreground/80">{pageMeta.title}</span>
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right: Search + Notification + Theme + CTA */}
          <div className="flex items-center gap-2">
            <GlobalSearch />

            {/* Notification bell — decorative for now */}
            <button
              className="hidden md:flex w-8 h-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground transition-all relative"
              title="Notifikasi"
            >
              <Bell size={14} />
              {/* unread dot */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-[1.5px] ring-[color:var(--header-bg)]" />
            </button>

            <ThemeToggle />

            {user ? (
              <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-black text-[10px] tracking-widest border border-primary/20">
                PRO
              </span>
            ) : (
              <Link
                href="/auth"
                className="px-3 py-1.5 rounded-lg text-[11px] font-black text-slate-950 whitespace-nowrap bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all"
              >
                Daftar Gratis
              </Link>
            )}
          </div>
        </header>

        {/* ═══ Guest Banner (slim, tasteful) ═══ */}
        {!user && (
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-[10px] font-semibold border-b"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(245,158,11,0.06) 50%, transparent 100%)',
              borderColor: 'rgba(245,158,11,0.15)',
            }}
          >
            <span className="w-1 h-1 rounded-full bg-amber-400/60 animate-pulse" />
            <span className="text-amber-400/80">{guestMsg}</span>
            <span className="text-muted-foreground/30">·</span>
            <Link href="/auth" className="font-black text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors">
              Daftar gratis →
            </Link>
          </div>
        )}

        {/* ═══ Ticker Tape ═══ */}
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
