'use client'

import React from 'react'
import { getConvictionTier } from '@/lib/signals'

interface ConvictionBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ConvictionBadge({ score, size = 'md' }: ConvictionBadgeProps) {
  const tier = getConvictionTier(score)

  const sizeClasses = {
    sm: 'text-[8px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-1',
    lg: 'text-xs px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-black border ${tier.borderColor} ${tier.bgColor} ${tier.color} ${sizeClasses[size]}`}
      title={`${tier.action} · Risk: ${tier.risk}`}
    >
      {tier.icon} {tier.label}
    </span>
  )
}

export function ConvictionBar({ score, height = 4 }: { score: number; height?: number }) {
  const tier = getConvictionTier(score)
  const clamped = Math.min(Math.max(score, 0), 100)

  return (
    <div className="w-full">
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${
              clamped >= 80 ? '#e7b733' : clamped >= 65 ? '#22c55e' : clamped >= 45 ? '#eab308' : '#ef4444'
            }, ${
              clamped >= 80 ? '#c49a1a' : clamped >= 65 ? '#16a34a' : clamped >= 45 ? '#ca8a04' : '#dc2626'
            })`,
            boxShadow: `0 0 8px rgba(${
              clamped >= 80 ? '231,183,51' : clamped >= 65 ? '34,197,94' : clamped >= 45 ? '234,179,8' : '239,68,68'
            }, 0.25)`,
          }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-muted-foreground/40">{clamped} / 100</span>
        <span className={`text-[8px] font-bold ${tier.color}`}>{tier.label}</span>
      </div>
    </div>
  )
}
