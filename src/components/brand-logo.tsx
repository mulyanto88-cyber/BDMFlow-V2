'use client'

import React from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  textClassName?: string
}

export function BrandLogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-shield-trans.png"
        alt="BDMFlow Shield"
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.35)]"
      />
      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-background shadow-[0_0_6px_rgba(52,211,153,0.9)] animate-pulse" />
    </div>
  )
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = ''
}: BrandLogoProps) {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 54,
  }

  const px = iconSizes[size] || 36

  return (
    <div className={`flex items-center gap-2 group select-none shrink-0 whitespace-nowrap ${className}`}>
      <BrandLogoIcon size={px} />

      {showText && (
        <div className={`flex flex-col justify-center text-left ${textClassName}`}>
          <div className="flex items-center leading-none">
            <span className="font-black tracking-tight text-[15px] sm:text-[16px] text-foreground">
              BDM<span className="text-amber-500 dark:text-amber-400">Flow</span>
            </span>
          </div>
          <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400/90 mt-0.5 leading-none">
            IDX INTELLIGENCE
          </span>
        </div>
      )}
    </div>
  )
}
