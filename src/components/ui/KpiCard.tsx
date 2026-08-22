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
    <div className="neo-card relative group overflow-hidden rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <div className={`p-2 rounded-lg bg-surface-2 border border-line-3 group-hover:scale-105 transition-transform ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-1">
        <p className="text-2xl font-black font-mono tracking-tight text-foreground">
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
