'use client'

import { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Globe, Palette } from 'lucide-react'

type Theme = 'dark' | 'light' | 'blue' | 'midnight'

interface ThemeConfig {
  key: Theme
  label: string
  desc: string
  icon: React.ReactNode
  preview: string
  bg: string
  accent: string
}

const THEMES: ThemeConfig[] = [
  {
    key: 'dark',
    label: 'Dark Navy',
    desc: 'Deep navy · gold accents',
    icon: <Moon size={13} className="text-amber-400" />,
    preview: '#060a16',
    bg: 'bg-gradient-to-br from-[#060a16] to-[#0f1a36]',
    accent: '#e7b733',
  },
  {
    key: 'midnight',
    label: 'Plasma Edge',
    desc: 'Dark teal · neon cyan glow',
    icon: <Palette size={13} className="text-cyan-400" />,
    preview: '#061512',
    bg: 'bg-gradient-to-br from-[#061512] to-[#0d1f1a]',
    accent: '#00ffcc',
  },
  {
    key: 'blue',
    label: 'Midnight Azure',
    desc: 'Deep indigo · elegant',
    icon: <Globe size={13} className="text-indigo-400" />,
    preview: '#05060f',
    bg: 'bg-gradient-to-br from-[#05060f] to-[#0d0f24]',
    accent: '#818cf8',
  },
  {
    key: 'light',
    label: 'Light Silver',
    desc: 'Clean white · gold',
    icon: <Sun size={13} className="text-amber-400" />,
    preview: '#f5f7fa',
    bg: 'bg-gradient-to-br from-[#f5f7fa] to-[#e8ecf2]',
    accent: '#c49a1a',
  },
]

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const applyTheme = (t: Theme) => {
    setTheme(t)
    const root = document.documentElement
    root.classList.remove('dark', 'theme-blue', 'theme-midnight')
    if (t === 'dark') root.classList.add('dark')
    if (t === 'blue') root.classList.add('theme-blue')
    if (t === 'midnight') root.classList.add('theme-midnight')
  }

  useEffect(() => {
    const sync = () => {
      const saved = localStorage.getItem('bdmflow-theme') as Theme
      const t = saved && ['dark', 'light', 'blue', 'midnight'].includes(saved) ? saved : 'dark'
      applyTheme(t)
    }
    sync()
    setMounted(true)
    window.addEventListener('bdmflow-theme-change', sync)
    return () => window.removeEventListener('bdmflow-theme-change', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
  }, [open])

  const select = (t: Theme) => {
    applyTheme(t)
    localStorage.setItem('bdmflow-theme', t)
    window.dispatchEvent(new Event('bdmflow-theme-change'))
    setOpen(false)
  }

  const current = THEMES.find(t => t.key === theme) ?? THEMES[0]

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={[
          'flex items-center justify-center w-8 h-8 rounded-full',
          'border border-white/[0.07] bg-white/[0.03]',
          'hover:bg-white/[0.07] hover:border-white/[0.12]',
          'text-muted-foreground hover:text-foreground',
          'transition-all duration-200',
          'active:scale-90',
        ].join(' ')}
        title={`Theme: ${mounted ? current.label : '...'}`}
      >
        {mounted ? current.icon : (
          <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-56 p-2 rounded-2xl border border-white/[0.08] bg-black/90 backdrop-blur-2xl shadow-2xl z-50 animate-scale-in"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          <p className="px-3 py-1.5 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
            Theme
          </p>
          <div className="space-y-1">
            {THEMES.map(t => (
              <button
                key={t.key}
                onClick={() => select(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  theme === t.key
                    ? 'bg-white/[0.08] border border-white/[0.10]'
                    : 'border border-transparent hover:bg-white/[0.04]'
                }`}
              >
                {/* Theme preview swatch */}
                <div className={`w-8 h-8 rounded-lg shrink-0 border border-white/[0.10] relative overflow-hidden ${t.bg}`}>
                  <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ backgroundColor: t.accent }} />
                  <div className="absolute top-1.5 left-1.5 w-3 h-0.5 rounded-full bg-white/20" />
                  <div className="absolute top-2.5 left-1.5 w-2 h-0.5 rounded-full bg-white/10" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[11px] font-bold ${theme === t.key ? 'text-foreground' : 'text-foreground/70'}`}>
                    {t.label}
                  </p>
                  <p className="text-[9px] text-muted-foreground/50">{t.desc}</p>
                </div>
                {theme === t.key && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: t.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
