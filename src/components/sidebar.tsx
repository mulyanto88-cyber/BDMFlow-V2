'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, Globe, Crown, Activity,
  PieChart, LineChart, Shield, Calculator, Bell,
  Menu, ChevronLeft, Zap, Eye, BarChart2, Brain,
  TrendingUp, Star, X, LogOut, User, Lock, Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import BrandLogo, { BrandLogoIcon } from '@/components/brand-logo'

const ADMIN_EMAILS = ['mulyanto.my88@gmail.com']

const navGroups = [
  {
    title: 'Markets & Sectors',
    items: [
      { href: '/dashboard',    label: 'Morning Brief',     icon: LayoutDashboard, badge: null },
      { href: '/composite',    label: 'Composite Command', icon: LineChart,        badge: null },
      { href: '/bandarmologi', label: 'Bandarmologi',      icon: Crown,            badge: 'HOT' },
      { href: '/sector',       label: 'Sector Analytics',  icon: PieChart,         badge: null },
      { href: '/groups',       label: 'Group Intelligence',icon: Globe,            badge: null },
    ]
  },
  {
    title: 'Screeners',
    items: [
      { href: '/screener',              label: 'Pro Screener',          icon: Search,    badge: null },
      { href: '/screener-fundamental',  label: 'Fundamental Screener', icon: PieChart,  badge: 'HOT' },
      { href: '/volume-aov',            label: 'Breakout Scanner',      icon: Zap,       badge: null },
      { href: '/smart-money',           label: 'Smart Money Matrix',    icon: Brain,     badge: null },
      { href: '/radar',                 label: 'Watchlist Radar',       icon: Activity,  badge: null },
      { href: '/msci-screener',         label: 'MSCI Screener',         icon: Shield,    badge: null },
      { href: '/ftse-screener',         label: 'FTSE Screener',         icon: Globe,     badge: null },
      { href: '/backtest',              label: 'Backtest Lab',          icon: Calculator, badge: 'HOT' },
    ]
  },
  {
    title: 'Aliran Dana',
    items: [
      { href: '/foreign-flow',    label: 'Foreign Flow',        icon: Globe,     badge: null },
      { href: '/broker-flow',     label: 'Broker Flow Harian',  icon: Activity,  badge: null },
      { href: '/broker-tracker',  label: 'Broker Summary',      icon: BarChart2, badge: null },
    ]
  },
  {
    title: 'KSEI',
    items: [
      { href: '/ksei-monthly', label: 'KSEI Monthly',  icon: PieChart,  badge: null },
      { href: '/ksei1persen',  label: 'KSEI > 1%',     icon: Eye,       badge: null },
      { href: '/insider',      label: 'Insider Radar', icon: Search,    badge: 'NEW' },
    ]
  },
  {
    title: 'Tools',
    items: [
      { href: '/watchlist',        label: 'Watchlist & Alerts',  icon: Bell,       badge: null },
      { href: '/right-issue-calc', label: 'Right Issue Calc',    icon: TrendingUp, badge: null },
    ]
  },
  {
    title: 'AI & Labs',
    items: [
      { href: '/scalper-copas', label: 'Open=Low Lab',       icon: Zap,      badge: 'NEW', adminOnly: true },
      { href: '#ai-copilot',    label: 'AI Intelligence',    icon: Sparkles, badge: 'VIP', adminOnly: true },
    ]
  }
]

// Four thumb-reachable destinations; everything else lives behind "Menu", which
// opens the full drawer. Before this, 15 of the 20 pages had no way in on a phone.
const mobileNav = [
  { href: '/dashboard',    label: 'Brief',    icon: LayoutDashboard },
  { href: '/screener',     label: 'Screener', icon: Search },
  { href: '/foreign-flow', label: 'Flow',     icon: Globe },
  { href: '/watchlist',    label: 'Watch',    icon: Bell },
]

const BADGE_STYLES: Record<string, string> = {
  HOT:  'bg-red-500/15 text-red-400 border-red-500/30',
  NEW:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  BETA: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  VIP:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

const COLLAPSE_KEY = 'bdmflow-sidebar-collapsed'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, isPro, signOut } = useAuth()

  const isAdmin = !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Restore after mount — reading localStorage during render would desync SSR.
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1')
    setMounted(true)
  }, [])

  const toggleCollapsed = (next: boolean) => {
    setCollapsed(next)
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
  }

  // Navigating should dismiss the drawer, otherwise it covers the page you chose.
  useEffect(() => { setDrawerOpen(false) }, [pathname])

  // While the drawer is up: Escape closes it and the page behind must not scroll.
  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex flex-col border-r ${mounted ? 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''} ${collapsed ? 'w-[64px]' : 'w-[248px]'} h-[calc(100vh_-_1.5rem)] sticky top-3 shrink-0`}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      >
        {/* Logo bar */}
        <div
          className="h-16 flex items-center justify-between px-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2 group overflow-hidden">
              <BrandLogo size="md" showText={true} />
            </Link>
          ) : (
            <Link href="/" className="mx-auto relative" title="BDMFlow IDX Intelligence">
              <BrandLogoIcon size={36} />
            </Link>
          )}

          {!collapsed && (
            <button
              onClick={() => toggleCollapsed(true)}
              className="flex w-6 h-6 items-center justify-center rounded-md text-muted-foreground/60 hover:text-muted-foreground hover:bg-surface-3 transition-all active:scale-90"
              title="Ciutkan sidebar"
              aria-label="Ciutkan sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => toggleCollapsed(false)}
              className="flex mx-auto mt-3 w-8 h-8 items-center justify-center rounded-lg text-muted-foreground/60 hover:text-muted-foreground hover:bg-surface-3 transition-all active:scale-90"
            title="Lebarkan sidebar"
            aria-label="Lebarkan sidebar"
          >
            <Menu size={14} />
          </button>
        )}

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-1">
              {/* One quiet rule for every group. Five different gradients used to
                  colour these dividers, which read as decoration rather than
                  structure and fought the premium surface. */}
              {!collapsed && (
                <div className="flex items-center gap-2 px-4 py-2">
                    <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.20em] shrink-0">
                    {group.title}
                  </p>
                  <div className="h-px flex-1 bg-[color:var(--sidebar-border)]" />
                </div>
              )}
              {collapsed && idx > 0 && <div className="mx-3 my-2 h-px bg-border/30" />}

              <div className="px-2 space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  const locked = !!(item as any).adminOnly && !isAdmin

                  // Locked "Coming Soon" state for adminOnly items when user is not admin
                  if (locked) {
                    return (
                      <div
                        key={item.href}
                        title={collapsed ? `${item.label} — Coming Soon` : undefined}
                        className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-not-allowed opacity-60 group ${collapsed ? 'justify-center' : ''}`}
                      >
                        <span className="shrink-0 text-foreground/40">
                          <Icon size={15} />
                        </span>

                        {!collapsed && (
                          <>
                            <span className="text-[12px] font-semibold leading-none flex-1 min-w-0 truncate text-foreground/50">
                              {item.label}
                            </span>
                            <span className="flex items-center gap-0.5 text-[8px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 rounded border shrink-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/25">
                              <Lock size={7} />
                              Soon
                            </span>
                          </>
                        )}

                        {collapsed && (
                          <span
                            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400/60"
                          />
                        )}
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group ${
                        active
                          ? 'bg-primary/10 text-foreground font-bold'
                          : 'text-foreground/80 hover:text-foreground hover:bg-black/5 dark:hover:bg-surface-3'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{
                            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)',
                            boxShadow: '0 0 8px hsl(var(--primary))',
                          }}
                        />
                      )}

                      <span className={`shrink-0 transition-colors ${active ? 'text-primary' : 'text-foreground/60 group-hover:text-foreground'}`}>
                        <Icon size={15} />
                      </span>

                      {!collapsed && (
                        <>
                          <span className={`text-[12px] font-semibold leading-none flex-1 min-w-0 truncate ${active ? 'font-bold text-foreground' : ''}`}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className={`text-[8px] font-black uppercase tracking-[0.10em] px-1.5 py-0.5 rounded border shrink-0 ${BADGE_STYLES[item.badge]}`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}

                      {collapsed && item.badge && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{
                            background: item.badge === 'HOT' ? '#ef4444' : item.badge === 'NEW' ? '#22c55e' : item.badge === 'VIP' ? '#f59e0b' : '#a855f7'
                          }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom: plan status & user account */}
        {!collapsed ? (
          <div className="p-3 shrink-0 space-y-2" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            {isPro ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-1.5 font-black text-amber-400">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="text-[10.5px] uppercase tracking-wider">Pro Member</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-amber-400/80 bg-amber-500/15 px-1.5 py-0.5 rounded">
                  AKTIF
                </span>
              </div>
            ) : (
              <Link
                href="/pricing"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-xs font-black text-amber-400 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Crown size={12} />
                  <span className="text-[10.5px] uppercase tracking-wider">Upgrade Pro</span>
                </div>
                <span className="text-[10px]">→</span>
              </Link>
            )}

            {/* User Profile & Logout */}
            {user ? (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-surface-2/70 border border-line-2 text-xs">
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[10.5px] font-bold truncate text-foreground/90">{user.email?.split('@')[0]}</div>
                  <div className="text-[9px] text-muted-foreground/50 truncate">{user.email}</div>
                </div>
                <button
                  onClick={() => signOut()}
                  title={`Keluar (${user.email})`}
                  className="p-1.5 rounded-lg text-muted-foreground/60 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                >
                  <LogOut size={13} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pt-0.5">
                <Link
                  href="/auth?mode=login"
                  className="flex-1 py-1.5 text-center rounded-lg text-[10.5px] font-bold bg-surface-2 hover:bg-surface-3 text-foreground/80 transition-colors border border-line-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="flex-1 py-1.5 text-center rounded-lg text-[10.5px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-xs transition-opacity hover:opacity-90"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Collapsed bottom avatar/logout */
          user && (
            <div className="p-2 flex justify-center" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
              <button
                onClick={() => signOut()}
                title={`Keluar (${user.email})`}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={14} />
              </button>
            </div>
          )
        )}
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade"
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
            className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-3xl border-t animate-slide-up pb-safe shadow-2xl"
            style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0 relative"
              style={{ borderBottom: '1px solid var(--sidebar-border)' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30 absolute left-1/2 -translate-x-1/2 top-2" aria-hidden="true" />
                <h2 className="text-sm font-black tracking-tight mt-1">Semua Menu & Fitur</h2>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-line-3 bg-surface-2 text-muted-foreground hover:text-foreground active:scale-90 transition-all mt-1"
                aria-label="Tutup menu"
              >
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto px-3.5 py-3.5 custom-scrollbar pb-8 space-y-4">
              {navGroups.map((group, idx) => (
                <div key={idx} className="last:mb-1">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.20em] shrink-0">
                      {group.title}
                    </p>
                    <div className="h-px flex-1 bg-[color:var(--sidebar-border)]" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const active = isActive(item.href)
                      const Icon = item.icon
                      const locked = !!(item as any).adminOnly && !isAdmin

                      if (locked) {
                        return (
                          <div
                            key={item.href}
                            className="flex items-center gap-2 px-3 py-3 rounded-xl border border-line-3 bg-surface-2/50 opacity-50 cursor-not-allowed"
                          >
                            <Icon size={16} className="text-muted-foreground/40 shrink-0" />
                            <span className="text-[11.5px] font-semibold leading-tight min-w-0 truncate text-muted-foreground/50">{item.label}</span>
                            <span className="ml-auto flex items-center gap-0.5 text-[7px] font-black uppercase px-1 py-0.5 rounded border shrink-0 bg-indigo-500/10 text-indigo-400 border-indigo-500/25">
                              <Lock size={6} />
                              Soon
                            </span>
                          </div>
                        )
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-2 px-3 py-3 rounded-xl border transition-all active:scale-[0.97] ${
                            active
                              ? 'bg-primary/15 border-primary/30 text-foreground font-bold shadow-sm'
                              : 'bg-surface-2/90 border-line-3 text-muted-foreground/85 hover:text-foreground hover:bg-surface-3'
                          }`}
                        >
                          <Icon size={16} className={active ? 'text-primary shrink-0' : 'text-muted-foreground/60 shrink-0'} />
                          <span className="text-[11.5px] font-semibold leading-tight min-w-0 truncate">{item.label}</span>
                          {item.badge && (
                            <span className={`ml-auto text-[7px] font-black uppercase px-1 py-0.5 rounded border shrink-0 ${BADGE_STYLES[item.badge]}`}>
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Upgrade Banner in drawer */}
              {!isPro && (
                <Link
                  href="/pricing"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/25 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Crown size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider block">Upgrade ke Pro</span>
                      <span className="text-[10px] text-muted-foreground font-medium">Buka seluruh fitur screener & intel flow</span>
                    </div>
                  </div>
                  <ChevronLeft size={14} className="text-amber-400 rotate-180" />
                </Link>
              )}

              {/* User Account & Logout in drawer */}
              <div className="pt-2 space-y-2">
                {user ? (
                  <div className="p-3 rounded-xl bg-surface-2/90 border border-line-2 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-foreground truncate">{user.email?.split('@')[0]}</div>
                        <div className="text-[10px] text-muted-foreground/60 truncate">{user.email}</div>
                      </div>
                      {isPro && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-black text-[9px] uppercase tracking-wider">
                          PRO
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { signOut(); setDrawerOpen(false) }}
                      className="w-full py-2 rounded-lg text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                    >
                      <LogOut size={13} />
                      <span>Keluar dari Akun</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/auth?mode=login"
                      onClick={() => setDrawerOpen(false)}
                      className="py-2.5 rounded-xl text-xs font-bold text-center bg-surface-2 hover:bg-surface-3 text-foreground border border-line-2 transition-colors"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/auth?mode=register"
                      onClick={() => setDrawerOpen(false)}
                      className="py-2.5 rounded-xl text-xs font-black text-center text-slate-950 btn-gradient-gold shadow-md shadow-amber-500/20"
                    >
                      Daftar
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE BOTTOM NAV ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 w-full z-50 backdrop-blur-xl"
        style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-stretch h-16 safe-bottom">
          {mobileNav.map(item => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-all active:scale-90 ${active ? 'text-primary font-bold' : 'text-muted-foreground/60'}`}
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] rounded-b-full"
                    style={{ background: 'hsl(var(--primary))', boxShadow: '0 0 8px hsl(var(--primary))' }}
                  />
                )}
                <Icon size={19} className={active ? 'text-primary' : 'text-muted-foreground/60'} />
                <span className="text-[9.5px] font-bold tracking-tight">{item.label}</span>
              </Link>
            )
          })}

          {/* The way into the other destinations. */}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-expanded={drawerOpen}
            aria-haspopup="dialog"
            className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-all active:scale-90 ${drawerOpen ? 'text-primary font-bold' : 'text-muted-foreground/60'}`}
          >
            <Menu size={19} />
            <span className="text-[9.5px] font-bold tracking-tight">Menu</span>
          </button>
        </div>
      </div>
    </>
  )
}
