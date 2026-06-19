'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu, X, Sun, Moon, Globe, ChevronLeft, ChevronRight,
  TrendingUp, Zap, Command, Palette,
} from 'lucide-react'

// ====================== SVG ICONS ======================
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="5.8" height="5.8" rx="1.3" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9.2" y="1" width="5.8" height="5.8" rx="1.3" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="9.2" width="5.8" height="5.8" rx="1.3" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9.2" y="9.2" width="5.8" height="5.8" rx="1.3" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6.8" cy="6.8" r="5.2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M11 11L14.2 14.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  flow: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 12L6 7.5L9 9.5L14.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 2H14.5V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  building: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1.5" width="12" height="13" rx="1.2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M5.8 5.5H10.2M5.8 8H10.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <rect x="5.8" y="10.5" width="4.4" height="4" rx="0.7" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  crown: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 12H13.5L14.5 14.5H1.5L2.5 12Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M3.5 12L1.5 5L5.5 8L8 2.5L10.5 8L14.5 5L12.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  lab: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5.5 1.5V7L1.8 13.4H14.2L10.5 7V1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5.5 1.5H10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="5.5" cy="10" r="0.9" fill="currentColor"/>
      <circle cx="8.5" cy="11.5" r="0.9" fill="currentColor"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8C1 8 3.8 2.5 8 2.5C12.2 2.5 15 8 15 8C15 8 12.2 13.5 8 13.5C3.8 13.5 1 8 1 8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  sector: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="5.8" height="5.8" rx="1.1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9.2" y="1" width="5.8" height="3.8" rx="1.1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="1" y="9.2" width="5.8" height="5.8" rx="1.1" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="9.2" y="7.2" width="5.8" height="7.8" rx="1.1" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  globe: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 1.5C8 1.5 5.2 4.2 5.2 8C5.2 11.8 8 14.5 8 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M8 1.5C8 1.5 10.8 4.2 10.8 8C10.8 11.8 8 14.5 8 14.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M1.5 8H14.5M2.6 4.8H13.4M2.6 11.2H13.4" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
    </svg>
  ),
  insider: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5.5" r="2.7" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 14.2C2 11.5 4.7 9.5 8 9.5C11.3 9.5 14 11.5 14 14.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="13" cy="3.8" r="1.7" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M14.5 8.5C14.5 7 13.5 5.8 13 5.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  shield: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1L1.5 3.6V7.5C1.5 11.2 4.2 14.2 8 14.8C11.8 14.2 14.5 11.2 14.5 7.5V3.6L8 1Z"/>
    </svg>
  ),
  calc: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1.5" width="12" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="4" y="3.5" width="8" height="2.5" rx="0.8" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="4.8" cy="9"  r="0.85" fill="currentColor"/>
      <circle cx="8"   cy="9"  r="0.85" fill="currentColor"/>
      <circle cx="11.2"cy="9"  r="0.85" fill="currentColor"/>
      <circle cx="4.8" cy="12" r="0.85" fill="currentColor"/>
      <circle cx="8"   cy="12" r="0.85" fill="currentColor"/>
      <circle cx="11.2"cy="12" r="0.85" fill="currentColor"/>
    </svg>
  ),
}

// ====================== NAV GROUPS ======================
const navGroups = [
  {
    title: 'Pasar & Sektor',
    groupIcon: <TrendingUp size={14} />,
    accentColor: '#3b82f6',
    items: [
      { href: '/dashboard', label: 'Market Overview',    icon: icons.dashboard, shortcut: '1' },
      { href: '/composite', label: 'Composite Command',  icon: icons.shield,   badge: 'V2' },
      { href: '/bandarmologi', label: 'Bandarmologi',     icon: icons.crown,   badge: 'V2' },
      { href: '/sector',    label: 'Sector Analytics',   icon: icons.sector,    shortcut: '2' },
      { href: '/groups',    label: 'Group Intelligence', icon: icons.building },
    ]
  },
  {
    title: 'Screener & Scanner',
    groupIcon: <Zap size={14} />,
    accentColor: '#e7b733',
    items: [
      { href: '/screener',      label: 'Screener Pro',        icon: icons.search,  badge: 'PRO' },
      { href: '/volume-aov',    label: 'Breakout Scanner',    icon: icons.sector,  badge: 'NEW' },
      { href: '/smart-money',   label: 'Smart Money Matrix',  icon: icons.crown,   shortcut: '3' },
      { href: '/radar',         label: 'Watchlist Radar',     icon: icons.eye,     badge: 'PRO' },
      { href: '/msci-screener', label: 'MSCI Screener',       icon: icons.shield },
      { href: '/ftse-screener', label: 'FTSE Screener',       icon: icons.globe, badge: 'NEW' },
    ]
  },
  {
    title: 'Aliran Dana — IDX',
    groupIcon: <Globe size={14} />,
    accentColor: '#22c55e',
    items: [
      { href: '/foreign-flow',   label: 'Foreign Flow',        icon: icons.globe },
      { href: '/broker-flow',    label: 'Broker Flow Harian',  icon: icons.flow,  badge: 'NEW' },
      { href: '/broker-tracker', label: 'Broker Summary',      icon: icons.flow,  badge: 'PRO' },
    ]
  },
  {
    title: 'Kepemilikan — KSEI',
    groupIcon: <Command size={14} />,
    accentColor: '#a78bfa',
    items: [
      { href: '/ksei-monthly',  label: 'KSEI Smart Money',    icon: icons.crown,    badge: 'NEW' },
      { href: '/ksei1persen',   label: 'KSEI >1% Bulanan',    icon: icons.eye,      badge: 'PRO' },
      { href: '/major-holder',  label: 'KSEI >5% Harian',     icon: icons.building, badge: 'NEW' },
      { href: '/insider',       label: 'Insider Radar',        icon: icons.insider },
    ]
  },
  {
    title: 'Personal Tools',
    groupIcon: <Palette size={14} />,
    accentColor: '#f472b6',
    items: [
      { href: '/alerts',          label: 'Alert Center',      icon: icons.eye,  badge: 'V2' },
      { href: '/watchlist',        label: 'Watchlist & Alerts', icon: icons.eye,  badge: 'PRO' },
      { href: '/backtest',         label: 'Backtest Lab',       icon: icons.lab,  badge: 'BETA' },
      { href: '/right-issue-calc', label: 'Right Issue Calc',   icon: icons.calc },
    ]
  },
]

const badgeStyles: Record<string, string> = {
  V2:   'bg-purple-500/[0.16] text-purple-300 border-purple-500/30',
  PRO:  'bg-amber-500/[0.16] text-amber-300 border-amber-500/30',
  NEW:  'bg-emerald-500/[0.16] text-emerald-300 border-emerald-500/30',
  BETA: 'bg-violet-500/[0.16] text-violet-300 border-violet-500/30',
}

// ====================== FLYOUT PANEL ======================
type FlyoutProps = {
  group: typeof navGroups[0]
  anchorY: number
  onClose: () => void
  isActive: (href: string) => boolean
}

function FlyoutPanel({ group, anchorY, onClose, isActive }: FlyoutProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const PANEL_H_ESTIMATE = group.items.length * 40 + 52
  const top = Math.min(anchorY, window.innerHeight - PANEL_H_ESTIMATE - 16)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col"
      style={{
        left: 66, top,
        minWidth: 230,
        background: 'var(--sidebar-bg, rgba(3,6,14,0.98))',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14,
        boxShadow: '0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(231,183,51,0.06)',
        animation: 'flyout-in 180ms cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}
    >
      <div className="absolute top-0 inset-x-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${group.accentColor}66, transparent)` }} />

      <div className="px-4 pt-3 pb-2 border-b border-white/[0.04] flex items-center gap-2.5">
        <span className="text-muted-foreground/40" style={{ color: `${group.accentColor}99` }}>{group.groupIcon}</span>
        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground/35 select-none">{group.title}</p>
      </div>

      <div className="p-1.5 space-y-0.5">
        {group.items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-[10px] transition-all duration-150 group/fi sidebar-nav-item",
                active
                  ? "text-gold-400"
                  : "text-muted-foreground border-transparent hover:bg-white/5 hover:border-white/10 hover:text-foreground"
              ].join(" ")}
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, rgba(231,183,51,0.13), rgba(231,183,51,0.07))',
                      border: '1px solid rgba(231,183,51,0.24)',
                      boxShadow: '0 0 18px rgba(231,183,51,0.08)',
                    }
                  : {}
              }
            >
              <span className="flex-shrink-0 flex w-[16px] items-center"
                style={active ? { filter: 'drop-shadow(0 0 6px rgba(231,183,51,0.80))' } : undefined}>
                {item.icon}
              </span>
              <span className="flex-1 text-[12px] font-semibold whitespace-nowrap tracking-[-0.01em]">
                {item.label}
              </span>
              {(item as any).badge && (
                <span className={`text-[7.5px] font-black px-1.5 py-[3px] rounded-md border flex-shrink-0 ${badgeStyles[(item as any).badge] ?? ''}`}>
                  {(item as any).badge}
                </span>
              )}
              {(item as any).shortcut && (
                <kbd className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] font-mono text-muted-foreground/25 flex-shrink-0">
                  {'\u2318'}{(item as any).shortcut}
                </kbd>
              )}
            </Link>
          )
        })}
      </div>

      <div className="absolute top-1/2 -translate-y-1/2 -left-[6px] w-3 h-3 rotate-45"
        style={{
          background: 'var(--sidebar-bg, rgba(3,6,14,0.98))',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRight: 'none',
          borderTop: 'none',
        }} />
    </div>
  )
}

// ====================== MAIN COMPONENT ======================
export default function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded]     = useState(false)
  const [hoverExpand, setHoverExpand] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme]           = useState<'dark' | 'light' | 'blue' | 'midnight'>('dark')
  const [mounted, setMounted]       = useState(false)
  const [flyoutGroupIndex, setFlyoutGroupIndex] = useState<number | null>(null)
  const [flyoutAnchorY, setFlyoutAnchorY]       = useState(0)

  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    setMounted(true)
    const isExpanded = localStorage.getItem('sidebar-expanded') === 'true'
    setExpanded(isExpanded)
    document.documentElement.classList.toggle('sidebar-expanded', isExpanded)

    const syncTheme = () => {
      const saved = localStorage.getItem('bdmflow-theme') as 'dark' | 'light' | 'blue' | 'midnight'
      const t = saved && ['dark','light','blue','midnight'].includes(saved) ? saved : 'dark'
      setTheme(t)
    }
    syncTheme()
    window.addEventListener('bdmflow-theme-change', syncTheme)
    return () => window.removeEventListener('bdmflow-theme-change', syncTheme)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setFlyoutGroupIndex(null)
    setHoverExpand(false)
  }, [pathname])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        window.dispatchEvent(new Event('open-global-search'))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleExpand = () => {
    const next = !expanded
    setExpanded(next)
    setFlyoutGroupIndex(null)
    document.documentElement.classList.toggle('sidebar-expanded', next)
    localStorage.setItem('sidebar-expanded', next ? 'true' : 'false')
  }

  const toggleTheme = () => {
    const map: Record<string, 'dark' | 'midnight' | 'blue' | 'light'> = {
      dark: 'midnight', midnight: 'blue', blue: 'light', light: 'dark'
    }
    const next = map[theme]
    setTheme(next)
    const root = document.documentElement
    root.classList.remove('dark', 'theme-blue', 'theme-midnight')
    if (next === 'dark') root.classList.add('dark')
    if (next === 'blue') root.classList.add('theme-blue')
    if (next === 'midnight') root.classList.add('theme-midnight')
    localStorage.setItem('bdmflow-theme', next)
    window.dispatchEvent(new Event('bdmflow-theme-change'))
  }

  const isActive = useCallback((href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : href === '/'
        ? pathname === '/'
        : pathname.startsWith(href),
  [pathname])

  const handleGroupIconClick = (e: React.MouseEvent, groupIndex: number) => {
    if (expanded) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const anchorY = rect.top - 8
    if (flyoutGroupIndex === groupIndex) {
      setFlyoutGroupIndex(null)
    } else {
      setFlyoutAnchorY(anchorY)
      setFlyoutGroupIndex(groupIndex)
    }
  }

  const closeFlyout = useCallback(() => setFlyoutGroupIndex(null), [])

  const show = expanded || mobileOpen || hoverExpand

  const themeConfig = {
    dark:     { icon: <Moon size={12} className="text-amber-400" />,    label: 'Dark Navy',       next: '\u2192 Midnight', color: '#facc15' },
    midnight: { icon: <Palette size={12} className="text-cyan-400" />,   label: 'Plasma Edge',     next: '\u2192 Blue',     color: '#00ffcc' },
    blue:     { icon: <Globe size={12} className="text-indigo-400" />,   label: 'Midnight Azure',  next: '\u2192 Light',    color: '#818cf8' },
    light:    { icon: <Sun  size={12} className="text-amber-400" />,     label: 'Light Silver',    next: '\u2192 Dark',     color: '#facc15' },
  }

  return (
    <>
      <style>{`
        @keyframes flyout-in {
          from { opacity: 0; transform: translateX(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)    scale(1); }
        }
      `}</style>

      {flyoutGroupIndex !== null && !expanded && !hoverExpand && (
        <FlyoutPanel
          group={navGroups[flyoutGroupIndex]}
          anchorY={flyoutAnchorY}
          onClose={closeFlyout}
          isActive={isActive}
        />
      )}

      {!mobileOpen && (
        <div className="fixed top-0 left-0 z-40 w-5 h-full md:hidden"
          onTouchStart={() => setMobileOpen(true)} aria-hidden="true" />
      )}

      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 p-2.5 rounded-xl border border-white/10 bg-black/60 backdrop-blur-xl md:hidden shadow-xl"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)} />
      )}

      <aside
        onMouseEnter={() => {
          if (!expanded) {
            if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
            setHoverExpand(true)
          }
        }}
        onMouseLeave={() => {
          if (!expanded) {
            hoverTimeout.current = setTimeout(() => setHoverExpand(false), 200)
          }
        }}
        className={[
          'fixed top-0 left-0 z-40 h-full flex flex-col',
          'sidebar-surface',
          'transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0',
          (expanded || hoverExpand) ? 'w-[220px]' : 'w-[60px]',
        ].join(' ')}
        style={{
          borderRight: '1px solid rgba(255,255,255,0.04)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.3), 1px 0 0 rgba(255,255,255,0.02)',
        }}
      >
        <div className="absolute top-0 inset-x-0 h-[1.5px] pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(231,183,51,0.5) 20%, rgba(231,183,51,0.7) 50%, rgba(231,183,51,0.5) 80%, transparent 100%)' }} />

        <div className="absolute top-0 right-0 w-full h-56 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse 90% 55% at 85% 0%, rgba(231,183,51,0.05), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-full h-40 pointer-events-none z-0"
          style={{ background: 'radial-gradient(ellipse 90% 50% at 15% 100%, rgba(231,183,51,0.03), transparent 70%)' }} />

        {/* ═══ LOGO ═══ */}
        <div className="relative z-10 flex items-center h-[52px] px-3 border-b border-white/[0.03] flex-shrink-0 gap-2.5">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-[11px] blur-md opacity-30"
              style={{ background: 'linear-gradient(145deg, #f0c040, #e7b733, #c49a1a)' }} />
            <div
              className="relative w-[32px] h-[32px] rounded-[11px] flex items-center justify-center font-black text-[14px] font-mono"
              style={{
                background: 'linear-gradient(145deg, #f0c040 0%, #e7b733 45%, #c49a1a 100%)',
                color: '#0a122c',
                boxShadow: '0 0 0 1px rgba(231,183,51,0.25), 0 2px 16px rgba(231,183,51,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              B
            </div>
          </div>

          {show && (
            <div className="flex-1 overflow-hidden">
              <p className="text-[14px] font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 leading-none tracking-[-0.02em]">BDMFlow</p>
              <p className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground/40 mt-[3px] font-semibold">Flow Intelligence</p>
            </div>
          )}

          <button
            onClick={toggleExpand}
            title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground/25 hover:text-muted-foreground/60 hover:bg-white/[0.06] transition-all duration-200 flex-shrink-0"
          >
            <ChevronLeft size={12} className={`transition-transform duration-250 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* ═══ NAVIGATION ═══ */}
        <nav ref={navRef} className="flex-1 py-1 overflow-y-auto relative z-10">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'pt-0' : ''}>

              {gi > 0 && (
                <div className="mx-3 mb-1">
                  <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04), transparent 70%)' }} />
                </div>
              )}

              {show && (
                <div className="flex items-center gap-2 px-3.5 pt-1 pb-1">
                  <span style={{ color: `${group.accentColor}99` }} className="opacity-60">{group.groupIcon}</span>
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/25 select-none">{group.title}</p>
                </div>
              )}

              {!show && (
                <div className="flex flex-col items-center mb-0 relative">
                  <button
                    onClick={(e) => handleGroupIconClick(e, gi)}
                    title={group.title}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 relative"
                    style={{
                      color: flyoutGroupIndex === gi ? group.accentColor : 'hsl(var(--muted-foreground) / 0.4)',
                      background: flyoutGroupIndex === gi ? `${group.accentColor}15` : 'transparent',
                      border: flyoutGroupIndex === gi ? `1px solid ${group.accentColor}25` : '1px solid transparent',
                    }}
                  >
                    {flyoutGroupIndex === gi && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ background: group.accentColor }} />
                    )}
                    {group.groupIcon}
                  </button>
                </div>
              )}

              {show && group.items.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      'relative flex items-center gap-3 mx-2 my-[1px] px-3 py-[6px] rounded-xl sidebar-nav-item',
                      'transition-all duration-[180ms] group/nav',
                      active ? 'text-gold-400' : 'text-muted-foreground border-transparent hover:bg-white/5 hover:border-white/10 hover:text-foreground',
                    ].join(' ')}
                    style={
                      active
                        ? {
                            background: 'linear-gradient(135deg, rgba(231,183,51,0.12), rgba(231,183,51,0.06))',
                            border: '1px solid rgba(231,183,51,0.22)',
                            boxShadow: '0 0 24px rgba(231,183,51,0.08), inset 0 1px 0 rgba(231,183,51,0.10)',
                          }
                        : {}
                    }
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-full"
                        style={{
                          background: 'linear-gradient(180deg, #e7b733, rgba(231,183,51,0.6))',
                          boxShadow: '0 0 8px rgba(231,183,51,0.50)',
                        }} />
                    )}

                    <span className="flex-shrink-0 flex w-[16px] items-center"
                      style={active ? { filter: 'drop-shadow(0 0 6px rgba(231,183,51,0.80))' } : undefined}>
                      {item.icon}
                    </span>

                    <div className="flex items-center flex-1 gap-2 min-w-0">
                      <span className="flex-1 text-[12px] font-semibold whitespace-nowrap tracking-[-0.01em]">
                        {item.label}
                      </span>
                      {(item as any).badge && (
                        <span className={`text-[7.5px] font-black px-1.5 py-[3px] rounded-md border flex-shrink-0 ${badgeStyles[(item as any).badge] ?? ''}`}>
                          {(item as any).badge}
                        </span>
                      )}
                    </div>

                    {(item as any).shortcut && (
                      <kbd className="text-[8.5px] px-1.5 py-[3px] rounded-md bg-white/[0.05] border border-white/[0.04] font-mono text-muted-foreground/20 opacity-0 group-hover/nav:opacity-100 transition-opacity duration-200 flex-shrink-0">
                        {'\u2318'}{(item as any).shortcut}
                      </kbd>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ═══ FOOTER ═══ */}
        <div className="relative z-10 flex-shrink-0 p-3 border-t border-white/[0.03]">
          {show ? (
            <div className="space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2.5 px-3 py-[8px] rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-all duration-200 group/th"
              >
                <span className="flex-shrink-0 opacity-70 group-hover/th:opacity-100 transition-opacity">
                  {mounted && themeConfig[theme].icon}
                </span>
                <span className="flex-1 text-left text-[10.5px] font-semibold">
                  {mounted ? themeConfig[theme].label : 'Theme'}
                </span>
                <span className="text-[8px] text-muted-foreground/25 font-mono">
                  {mounted ? themeConfig[theme].next : ''}
                </span>
              </button>

              <div className="flex items-center justify-between px-1">
                <span className="font-mono text-[9px] text-muted-foreground/20 font-medium">v2.5.0</span>
                <div className="flex items-center gap-1.5">
                  <span className="pulse-dot" />
                  <span className="text-[8.5px] text-muted-foreground/25 font-mono">Live</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={toggleTheme}
                title={mounted ? themeConfig[theme].next : 'Toggle theme'}
                className="w-9 h-9 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                {mounted && themeConfig[theme].icon}
              </button>
              <span className="pulse-dot" title="Live \u00B7 T+1" />
              <span className="font-mono text-[8px] text-muted-foreground/15 font-medium">v2.5</span>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
