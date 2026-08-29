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
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]"
      >
        <defs>
          {/* Shield Outer Gold Gradient */}
          <linearGradient id="shieldGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Shield Inner Deep Royal Navy */}
          <linearGradient id="shieldNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0e3a53" />
            <stop offset="50%" stopColor="#082133" />
            <stop offset="100%" stopColor="#03101c" />
          </linearGradient>

          {/* Arrow Vibrant Gold Flame */}
          <linearGradient id="arrowGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="85%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          {/* Cyan Glow Accent */}
          <linearGradient id="cyanAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          {/* Filter for 3D metallic bevel */}
          <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* 1. Outer Shield Bevel */}
        <path
          d="M50 6 L88 18 C88 56 68 84 50 94 C32 84 12 56 12 18 Z"
          fill="url(#shieldGold)"
          stroke="#ca8a04"
          strokeWidth="1.5"
        />

        {/* 2. Inner Shield Face */}
        <path
          d="M50 12 L82 22 C82 54 65 78 50 87 C35 78 18 54 18 22 Z"
          fill="url(#shieldNavy)"
        />

        {/* 3. Subtle Circuit/Grid Lines on Inner Shield */}
        <path
          d="M32 30 L45 30 L55 42 L72 42"
          stroke="url(#cyanAccent)"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          opacity="0.6"
        />
        <circle cx="32" cy="30" r="1.5" fill="#38bdf8" opacity="0.8" />
        <circle cx="72" cy="42" r="1.5" fill="#38bdf8" opacity="0.8" />

        {/* 4. Stylized Letter "B" Geometric Structure */}
        <path
          d="M32 26 L48 26 C56 26 62 30 62 36 C62 41 57 44 52 45 C59 46 64 50 64 57 C64 64 57 69 48 69 L32 69 Z"
          fill="none"
          stroke="url(#shieldNavy)"
          strokeWidth="5"
          opacity="0.3"
        />
        <path
          d="M34 28 L47 28 C54 28 59 31 59 36 C59 40 55 43 50 44 C56 45 61 49 61 55 C61 62 55 66 47 66 L34 66 Z"
          fill="none"
          stroke="#0284c7"
          strokeWidth="3.5"
          opacity="0.8"
        />

        {/* 5. Powerful 3D Dynamic Golden Growth Arrow & Trend Line */}
        <path
          d="M22 62 L40 46 L54 56 L82 24"
          fill="none"
          stroke="url(#arrowGold)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#goldGlow)"
        />
        
        {/* Arrow Head (Bursting outside top right) */}
        <polygon
          points="88,18 72,22 84,34"
          fill="url(#arrowGold)"
          stroke="#fef08a"
          strokeWidth="1"
          filter="url(#goldGlow)"
        />

        {/* Highlight flare on arrow apex */}
        <circle cx="82" cy="24" r="2.5" fill="#ffffff" />
        <circle cx="54" cy="56" r="2.5" fill="#fef08a" />
        <circle cx="40" cy="46" r="2" fill="#fef08a" />
      </svg>

      {/* Pulsing Live indicator dot */}
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
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
    sm: 26,
    md: 34,
    lg: 44,
    xl: 56,
  }

  const px = iconSizes[size] || 34

  return (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <BrandLogoIcon size={px} />

      {showText && (
        <div className={`flex flex-col ${textClassName}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-black tracking-tight text-base sm:text-lg bg-gradient-to-r from-foreground via-foreground to-foreground group-hover:from-amber-400 group-hover:to-amber-200 transition-all duration-300">
              BDM<span className="text-amber-500 dark:text-amber-400">Flow</span>
            </span>
          </div>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-400/90 mt-0.5">
            IDX INTELLIGENCE
          </span>
        </div>
      )}
    </div>
  )
}
