'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, Globe, Crown, Activity,
  PieChart, LineChart, Shield, Calculator, Bell,
  Menu, ChevronLeft, Zap, Eye, BarChart2, Brain,
  TrendingUp, Star,
} from 'lucide-react'
import { useState } from 'react'

const navGroups = [
  {
    title: 'Markets & Sectors',
    color: 'from-purple-500/60 to-blue-500/60',
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
    color: 'from-amber-500/60 to-orange-500/60',
    items: [
      { href: '/screener',      label: 'Pro Screener',        icon: Search,    badge: 'PRO' },
      { href: '/volume-aov',    label: 'Breakout Scanner',    icon: Zap,       badge: null },
      { href: '/smart-money',   label: 'Smart Money Matrix',  icon: Brain,     badge: null },
      { href: '/radar',         label: 'Watchlist Radar',     icon: Activity,  badge: null },
      { href: '/msci-screener', label: 'MSCI Screener',       icon: Shield,    badge: null },
      { href: '/ftse-screener', label: 'FTSE Screener',       icon: Globe,     badge: null },
    ]
  },
  {
    title: 'Aliran Dana',
    color: 'from-teal-500/60 to-emerald-500/60',
    items: [
      { href: '/foreign-flow',    label: 'Foreign Flow',        icon: Globe,     badge: null },
      { href: '/broker-flow',     label: 'Broker Flow Harian',  icon: Activity,  badge: null },
      { href: '/broker-tracker',  label: 'Broker Summary',      icon: BarChart2, badge: null },
    ]
  },
  {
    title: 'KSEI',
    color: 'from-sky-500/60 to-cyan-500/60',
    items: [
      { href: '/ksei-monthly', label: 'KSEI Monthly',  icon: PieChart,  badge: null },
      { href: '/ksei1persen',  label: 'KSEI > 1%',     icon: Eye,       badge: null },
      { href: '/insider',      label: 'Insider Radar', icon: Search,    badge: 'NEW' },
    ]
  },
  {
    title: 'Tools',
    color: 'from-rose-500/60 to-pink-500/60',
    items: [
      { href: '/watchlist',        label: 'Watchlist & Alerts',  icon: Bell,       badge: null },
      { href: '/backtest',         label: 'Backtest Lab',         icon: Calculator, badge: 'BETA' },
      { href: '/right-issue-calc', label: 'Right Issue Calc',    icon: TrendingUp, badge: null },
    ]
  }
]

const mobileNav = [
  { href: '/dashboard',    label: 'Brief',    icon: LayoutDashboard },
  { href: '/foreign-flow', label: 'Flow',     icon: Globe },
  { href: '/screener',     label: 'Screener', icon: Search },
  { href: '/smart-money',  label: 'Smart',    icon: Brain },
  { href: '/watchlist',    label: 'Watch',    icon: Bell },
]

const BADGE_STYLES: Record<string, string> = {
  PRO:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  HOT:  'bg-red-500/15 text-red-400 border-red-500/30',
  NEW:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  BETA: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex flex-col border-r transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? 'w-[60px]' : 'w-[228px]'} h-screen sticky top-0 shrink-0`}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}
      >
        {/* Logo bar */}
        <div
          className="h-14 flex items-center justify-between px-3 shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Logo mark */}
              <div className="relative w-7 h-7 shrink-0">
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_14px_rgba(251,191,36,0.35)]" />
                <div className="absolute inset-0 flex items-center justify-center font-black text-[12px] font-mono text-slate-950">B</div>
                {/* Live pulse dot */}
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-[1.5px] border-[color:var(--sidebar-bg)] animate-pulse" />
              </div>
              <div>
                <span className="text-[13px] font-black tracking-tight bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">
                  BDMFlow
                </span>
                <span className="block text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40 -mt-0.5">
                  IDX Intelligence
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/" className="mx-auto relative">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-[13px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.3)]">B</div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-[1.5px] border-[color:var(--sidebar-bg)] animate-pulse" />
            </Link>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex w-6 h-6 items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5 transition-all"
              title="Collapse sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex mx-auto mt-3 w-8 h-8 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5 transition-all"
            title="Expand sidebar"
          >
            <Menu size={14} />
          </button>
        )}

        {/* Nav groups */}
        <div className="flex-1 overflow-y-auto py-3 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-1">
              {/* Group header */}
              {!collapsed && (
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className={`h-px flex-1 bg-gradient-to-r ${group.color} opacity-40`} />
                  <p className="text-[9px] font-black text-muted-foreground/35 uppercase tracking-[0.20em] shrink-0">
                    {group.title}
                  </p>
                  <div className={`h-px flex-1 bg-gradient-to-l ${group.color} opacity-40`} />
                </div>
              )}
              {collapsed && idx > 0 && (
                <div className="mx-3 my-2 h-px bg-border/30" />
              )}

              <div className="px-2 space-y-0.5">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/')
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 group ${
                        active
                          ? 'bg-primary/8 text-foreground'
                          : 'text-muted-foreground/70 hover:text-foreground hover:bg-white/[0.04]'
                      } ${collapsed ? 'justify-center' : ''}`}
                    >
                      {/* Active glow line */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                          style={{
                            background: 'linear-gradient(180deg, hsl(var(--primary)) 0%, transparent 100%)',
                            boxShadow: '0 0 8px hsl(var(--primary))',
                          }}
                        />
                      )}

                      <span className={`shrink-0 transition-colors ${active ? 'text-primary' : 'text-muted-foreground/50 group-hover:text-muted-foreground'}`}>
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

                      {/* Collapsed badge dot */}
                      {collapsed && item.badge && (
                        <span
                          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                          style={{
                            background: item.badge === 'PRO' ? '#f59e0b' : item.badge === 'HOT' ? '#ef4444' : item.badge === 'NEW' ? '#22c55e' : '#a855f7'
                          }}
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom: PRO CTA */}
        {!collapsed && (
          <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
            <div className="rounded-xl p-3 bg-gradient-to-br from-amber-500/8 to-amber-500/3 border border-amber-500/15">
              <div className="flex items-center gap-2 mb-2">
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.14em]">Pro Aktif</span>
              </div>
              <p className="text-[9px] text-muted-foreground/50 leading-snug">
                Semua fitur terbuka. Data T+1 setiap hari.
              </p>
            </div>
          </div>
        )}
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 w-full z-50"
        style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--sidebar-border)' }}
      >
        <div className="flex items-stretch h-16 pb-safe">
          {mobileNav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center flex-1 gap-1 transition-all ${active ? 'text-primary' : 'text-muted-foreground/50'}`}
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-b-full"
                    style={{
                      background: 'hsl(var(--primary))',
                      boxShadow: '0 0 8px hsl(var(--primary))',
                    }}
                  />
                )}
                <Icon size={18} />
                <span className="text-[9px] font-bold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
