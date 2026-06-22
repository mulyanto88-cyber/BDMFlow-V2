'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import Sidebar from './sidebar'
import TickerTape from './ticker-tape'
import GlobalSearch from './global-search'
import ThemeToggle from './theme-toggle'
import LiveClock from './live-clock'
import InlineActionCenter from './inline-action-center'
import MobileBottomNav from './mobile-bottom-nav'
import InstallButton from './install-button'

// Pages reachable WITHOUT an account. Everything else requires a (free) login.
const PUBLIC_ROUTES = ['/', '/auth', '/pricing']
const isPublic = (path: string) => PUBLIC_ROUTES.includes(path)

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useAuth()
  const publicPage = isPublic(pathname)

  // Auth gate: send unauthenticated visitors to the landing page (which carries Daftar/Login CTAs).
  useEffect(() => {
    if (!loading && !user && !publicPage) router.replace('/')
  }, [loading, user, publicPage, router])

  // Public pages (landing, auth) render clean — no sidebar / header / ticker / bottom-nav.
  if (publicPage) {
    return (
      <main className="px-3 sm:px-5 lg:px-7 py-4 md:py-6 pb-16">
        {children}
      </main>
    )
  }

  // Protected page while auth resolves or just before redirect → minimal loader (no shell flash).
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gold-400/30 border-t-gold-400 animate-spin" />
      </div>
    )
  }

  // Authenticated → full app shell.
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
            <span className="badge-pro">PRO</span>
          </div>
        </header>

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
