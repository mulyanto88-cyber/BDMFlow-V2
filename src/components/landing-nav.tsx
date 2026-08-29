'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Crown, Sparkles, LogOut, ArrowRight, Menu, X, Shield } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import ThemeToggle from '@/components/theme-toggle'

import BrandLogo from '@/components/brand-logo'

export default function LandingNav() {
  const { user, loading, isPro, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b border-border/40 bg-background/80 transition-all">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <BrandLogo size="md" showText={true} />
        </Link>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/#fitur" className="hover:text-foreground transition-colors">
            Fitur
          </Link>
          <Link href="/backtest" className="hover:text-foreground transition-colors flex items-center gap-1">
            <span className="text-amber-500">🎯</span> Backtest Lab
          </Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Crown size={12} className="text-amber-400" />
            Paket Pro
          </Link>
        </nav>

        {/* Right CTA / Auth Buttons */}
        <div className="hidden sm:flex items-center gap-2.5">
          <ThemeToggle />

          {loading ? (
            <div className="w-20 h-8 rounded-xl bg-surface-2 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              {isPro ? (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-black text-[10px] tracking-widest border border-amber-500/30 flex items-center gap-1">
                  <Crown size={11} className="fill-amber-400" />
                  PRO
                </span>
              ) : (
                <Link
                  href="/pricing"
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                >
                  Upgrade Pro
                </Link>
              )}

              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-slate-950 btn-gradient-gold shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all active:scale-95"
              >
                <span>Buka Dashboard</span>
                <ArrowRight size={13} />
              </Link>

              <button
                onClick={() => signOut()}
                title={`Keluar (${user.email})`}
                aria-label="Logout"
                className="p-2 rounded-xl text-muted-foreground/70 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-90"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth?mode=login"
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
              >
                Masuk
              </Link>

              <Link
                href="/auth?mode=register"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-slate-950 btn-gradient-gold shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all active:scale-95"
              >
                <Sparkles size={13} />
                <span>Daftar Gratis</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-line-3 bg-surface-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-border/40 bg-background/95 backdrop-blur-2xl px-4 py-4 space-y-3 animate-slide-up">
          <nav className="flex flex-col space-y-2 text-xs font-bold text-muted-foreground">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-3 hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/#fitur"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-3 hover:text-foreground transition-colors"
            >
              Fitur Platform
            </Link>
            <Link
              href="/backtest"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-3 hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <span>🎯</span> Backtest Lab Akurasi
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-surface-3 hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <Crown size={13} className="text-amber-400" />
              Paket Langganan Pro
            </Link>
          </nav>

          <div className="pt-2 border-t border-border/30">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-between text-xs">
                  <div className="truncate min-w-0 pr-2">
                    <div className="font-bold text-foreground truncate">{user.email?.split('@')[0]}</div>
                    <div className="text-[10px] text-muted-foreground/60 truncate">{user.email}</div>
                  </div>
                  {isPro && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-black text-[9px] uppercase tracking-wider shrink-0">
                      PRO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 rounded-xl text-xs font-black text-center text-slate-950 btn-gradient-gold"
                  >
                    Dashboard →
                  </Link>
                  <button
                    onClick={() => { signOut(); setMobileMenuOpen(false) }}
                    className="py-2.5 rounded-xl text-xs font-bold text-center text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20"
                  >
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth?mode=login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl text-xs font-bold text-center bg-surface-2 hover:bg-surface-3 text-foreground border border-line-2 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 rounded-xl text-xs font-black text-center text-slate-950 btn-gradient-gold shadow-md shadow-amber-500/20"
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
