'use client'

import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface SectionHeaderProps {
  icon: LucideIcon
  label: string
  subtitle?: string
  action?: { href: string; label: string }
  lastUpdated?: string
  iconColor?: string
}

export default function SectionHeader({
  icon: Icon,
  label,
  subtitle,
  action,
  lastUpdated,
  iconColor = 'text-emerald-400',
}: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <h2 className="text-sm font-black text-white uppercase tracking-widest">{label}</h2>
        {subtitle && (
          <span className="text-[9px] text-muted-foreground/40 hidden sm:inline">· {subtitle}</span>
        )}
        {lastUpdated && (
          <span className="text-[8px] text-muted-foreground/30 hidden lg:inline font-mono">
            · {lastUpdated}
          </span>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-[9px] font-black text-primary hover:text-white transition-colors uppercase tracking-widest"
        >
          {action.label} →
        </Link>
      )}
    </div>
  )
}
