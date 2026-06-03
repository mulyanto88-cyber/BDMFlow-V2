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
    <div className="glass rounded-xl p-4 border border-white/[0.06] card-hover">
      <Icon className={`w-4 h-4 ${color} mb-2`} />
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-black mt-1 ${color}`}>{value}</p>
      {trend && (
        <p className={`text-[10px] mt-0.5 ${
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-amber-400'
        }`}>
          {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '⏸'} {subtitle || ''}
        </p>
      )}
    </div>
  )
}
