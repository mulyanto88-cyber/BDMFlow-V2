'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Search, Globe, Crown, Activity,
  PieChart, LineChart, Shield, Calculator, Bell,
  Menu, X
} from 'lucide-react'
import { useState } from 'react'

const navGroups = [
  {
    title: 'Markets & Sectors',
    items: [
      { href: '/dashboard', label: 'Market Overview', icon: <LayoutDashboard size={18} /> },
      { href: '/composite', label: 'Composite Command', icon: <LineChart size={18} /> },
      { href: '/bandarmologi', label: 'Bandarmologi', icon: <Crown size={18} /> },
      { href: '/sector', label: 'Sector Analytics', icon: <PieChart size={18} /> },
      { href: '/groups', label: 'Group Intelligence', icon: <Globe size={18} /> },
    ]
  },
  {
    title: 'Screeners',
    items: [
      { href: '/screener', label: 'Pro Screener', icon: <Search size={18} /> },
      { href: '/volume-aov', label: 'Breakout Scanner', icon: <PieChart size={18} /> },
      { href: '/smart-money', label: 'Smart Money Matrix', icon: <Crown size={18} /> },
      { href: '/radar', label: 'Watchlist Radar', icon: <Activity size={18} /> },
      { href: '/msci-screener', label: 'MSCI Screener', icon: <Shield size={18} /> },
      { href: '/ftse-screener', label: 'FTSE Screener', icon: <Globe size={18} /> },
    ]
  },
  {
    title: 'Aliran Dana',
    items: [
      { href: '/foreign-flow', label: 'Foreign Flow', icon: <Globe size={18} /> },
      { href: '/broker-flow', label: 'Broker Flow Harian', icon: <Activity size={18} /> },
      { href: '/broker-tracker', label: 'Broker Summary', icon: <Shield size={18} /> },
    ]
  },
  {
    title: 'KSEI',
    items: [
      { href: '/ksei-monthly', label: 'KSEI Monthly', icon: <PieChart size={18} /> },
      { href: '/ksei1persen', label: 'KSEI > 1%', icon: <Activity size={18} /> },
      { href: '/insider', label: 'Insider Radar', icon: <Search size={18} /> },
    ]
  },
  {
    title: 'Tools',
    items: [
      { href: '/watchlist', label: 'Watchlist & Alerts', icon: <Bell size={18} /> },
      { href: '/backtest', label: 'Backtest Lab', icon: <Calculator size={18} /> },
      { href: '/right-issue-calc', label: 'Right Issue Calc', icon: <Calculator size={18} /> },
    ]
  }
]

// For bottom nav on mobile
const mobileNav = [
  { href: '/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
  { href: '/foreign-flow', label: 'Flow', icon: <Globe size={20} /> },
  { href: '/screener', label: 'Screener', icon: <Search size={20} /> },
  { href: '/smart-money', label: 'Smart', icon: <Crown size={20} /> },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`hidden md:flex flex-col border-r transition-all duration-300 backdrop-blur-xl ${collapsed ? 'w-16' : 'w-64'} h-screen sticky top-0`}
        style={{ background: 'var(--sidebar-bg)', borderColor: 'var(--sidebar-border)' }}>
        <div className="h-14 flex items-center justify-between px-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.2)]">B</div>
              <span className="text-sm font-black text-amber-500 tracking-tight">BDMFlow</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[12px] font-mono bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 mx-auto">B</Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-slate-400 hover:text-slate-100 hidden lg:block">
            <Menu size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6 px-3">
              {!collapsed && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">{group.title}</p>}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} title={item.label}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                        active 
                          ? 'bg-amber-500/10 text-amber-400 font-bold' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 font-medium'
                      } ${collapsed ? 'justify-center' : ''}`}>
                      <span className={`${active ? 'text-amber-400' : 'text-slate-500'}`}>{item.icon}</span>
                      {!collapsed && <span className="text-[13px]">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 backdrop-blur-xl z-50 flex items-center justify-around px-2 pb-safe"
        style={{ background: 'var(--sidebar-bg)', borderTop: '1px solid var(--sidebar-border)' }}>
        {mobileNav.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-amber-400' : 'text-slate-500'}`}>
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
