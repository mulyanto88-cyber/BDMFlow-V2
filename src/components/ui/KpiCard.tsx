'use client'

import { type LucideIcon } from 'lucide-react'

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

export default function KpiCard({
  icon: Icon,
  label,
  value,
  color = 'text-primary',
  trend,
  subtitle,
}: KpiCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-xl p-4 transition-all duration-300 backdrop-blur-xl border border-line-4 hover:border-amber-500/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_24px_rgba(196,154,26,0.12)] bg-gradient-to-b from-white/[0.04] to-white/[0.01]">
      {/* Top edge glass reflection line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-60" />
      
      {/* Ambient background hover glow */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-amber-500/5 blur-2xl group-hover:bg-amber-500/15 transition-all duration-500 pointer-events-none" />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <div className={`p-2 rounded-lg bg-surface-2 border border-line-3 group-hover:scale-105 transition-transform ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-1">
        <p className="text-2xl font-black font-mono tracking-tight text-foreground group-hover:text-amber-400 transition-colors">
          {value}
        </p>
      </div>

      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-1.5">
          {trend && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                trend === 'up'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : trend === 'down'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '⏸'}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] font-medium text-muted-foreground/70 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
