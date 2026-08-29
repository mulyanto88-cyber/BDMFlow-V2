'use client'

import React from 'react'

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  textClassName?: string
}

export function BrandLogoIcon({ size = 44, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: (size * 340) / 290 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-shield-trans.png"
        alt="BDMFlow Shield"
        width={size}
        height={Math.round((size * 340) / 290)}
        className="w-full h-full object-contain drop-shadow-[0_6px_16px_rgba(245,158,11,0.28)] hover:scale-105 transition-transform duration-200"
      />
    </div>
  )
}

export default function BrandLogo({
  size = 'md',
  showText = true,
  className = '',
  textClassName = ''
}: BrandLogoProps) {
  const configs = {
    sm: { iconSize: 34, title: 'text-[17px]', sub: 'text-[9px] tracking-[0.22em]' },
    md: { iconSize: 44, title: 'text-[20px] sm:text-[22px]', sub: 'text-[10px] sm:text-[11px] tracking-[0.24em]' },
    lg: { iconSize: 56, title: 'text-[26px] sm:text-[28px]', sub: 'text-[12px] sm:text-[13px] tracking-[0.26em]' },
    xl: { iconSize: 72, title: 'text-[34px] sm:text-[36px]', sub: 'text-[15px] tracking-[0.28em]' },
  }

  const cfg = configs[size] || configs.md

  return (
    <div className={`flex items-center gap-3 group select-none shrink-0 whitespace-nowrap ${className}`}>
      <BrandLogoIcon size={cfg.iconSize} />

      {showText && (
        <div className={`flex flex-col justify-center text-left ${textClassName}`}>
          <div className="flex items-center leading-none font-sans">
            <span className={`font-black tracking-tight ${cfg.title} text-[#0b2742] dark:text-white transition-colors`}>
              BDM
            </span>
            <span className={`font-black tracking-tight ${cfg.title} text-[#0f6d7a] dark:text-[#2dd4bf] transition-colors`}>
              Flow
            </span>
          </div>
          <span className={`font-bold uppercase ${cfg.sub} text-slate-500 dark:text-slate-400 mt-1 leading-none font-mono`}>
            IDX INTELLIGENCE
          </span>
        </div>
      )}
    </div>
  )
}
