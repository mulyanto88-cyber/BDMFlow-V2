'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, TrendingUp, Zap, Search, ShieldAlert } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',            label: 'Market',   icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/radar',       label: 'Radar',    icon: <Search           className="w-5 h-5" /> },
  { href: '/smart-money', label: 'Smart $',  icon: <Zap              className="w-5 h-5" /> },
  { href: '/groups',      label: 'Groups',   icon: <TrendingUp       className="w-5 h-5" /> },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const NavItem = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const active = isActive(item.href)
    return (
      <Link
        href={item.href}
        className={`relative flex-1 flex flex-col items-center justify-center h-14 rounded-2xl active:scale-90 transition-all duration-300 ${
          active ? 'bg-white/[0.08] text-white' : 'text-muted-foreground/60 hover:text-muted-foreground'
        }`}
      >
        <div className={`transition-transform duration-300 ${active ? '-translate-y-1.5' : ''}`}>
          {item.icon}
        </div>
        <span 
          className={`absolute bottom-2 text-[9px] font-black uppercase tracking-widest transition-opacity duration-300 ${
            active ? 'opacity-100 text-white' : 'opacity-0'
          }`}
        >
          {item.label}
        </span>
      </Link>
    )
  }

  return (
    <>
      {/* Spacer so content doesn't hide behind nav */}
      <div className="md:hidden h-20" />
      
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-between px-2 pb-safe pt-1"
        style={{
          background: 'rgba(5,9,20,0.85)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <NavItem item={NAV_ITEMS[0]} />
        <NavItem item={NAV_ITEMS[1]} />
        
        {/* Center Quick Action Button */}
        <div className="relative flex-1 flex justify-center items-center">
          <button 
            onClick={() => window.dispatchEvent(new Event('open-global-search'))}
            className="absolute -top-7 w-[52px] h-[52px] rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 shadow-[0_4px_20px_rgba(168,85,247,0.4)] flex items-center justify-center text-white border-[3px] border-[#050914] active:scale-90 transition-all hover:brightness-110"
          >
            <Search size={22} className="opacity-90" />
          </button>
        </div>

        <NavItem item={NAV_ITEMS[2]} />
        <NavItem item={NAV_ITEMS[3]} />
      </nav>
    </>
  )
}
