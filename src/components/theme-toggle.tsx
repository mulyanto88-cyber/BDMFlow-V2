'use client'

import { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Sparkles, Anchor } from 'lucide-react'

// Only themes with a full variable block in globals.css belong here. An earlier
// build listed "blue" and "midnight" with no block behind them, so picking one
// dropped `.dark`, matched no rule, and fell through to :root — the light theme.
// Whoever chose "Cyber Cyan" got a white screen. Add the block first, then the entry.
type Theme = 'dark' | 'light' | 'purple' | 'blue'

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
    label: 'Cyber Terminal',
    desc: 'Deep Emerald Obsidian · Cyber Gold',
    icon: <Sparkles size={14} className="text-amber-400" />,
    preview: '#06181d',
    bg: 'bg-gradient-to-br from-[#06181d] via-[#0b232a] to-[#153b47]',
    accent: '#fbbf24',
  },
  {
    key: 'light',
    label: 'Geist Light',
    desc: 'Swiss minimal · Grid engineering',
    icon: <Sun size={14} className="text-amber-500" />,
    preview: '#f8fafc',
    bg: 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]',
    accent: '#0f172a',
  },
  {
    key: 'blue',
    label: 'Deep Harbor',
    desc: 'Navy analitis · Aksen emas',
    icon: <Anchor size={14} className="text-sky-400" />,
    preview: '#0a1628',
    bg: 'bg-gradient-to-br from-[#0a1628] via-[#0f2648] to-[#1b3b6b]',
    accent: '#fbbf24',
  },
  {
    key: 'purple',
    label: 'Ungu Velvet',
    desc: 'Royal purple · Auth theme',
    icon: <Moon size={14} className="text-purple-400" />,
    preview: '#070310',
    bg: 'bg-gradient-to-br from-[#070310] via-[#120826] to-[#28124d]',
    accent: '#c084fc',
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
    // Light is marked explicitly with .theme-light rather than being "the absence
    // of a dark class". The light-mode overrides in globals.css key off that marker,
    // so adding a dark theme never requires touching their selectors — forgetting
    // to is what shipped purple and blue with light-mode text on a dark ground.
    // theme-midnight is still stripped so a stale class from the removed theme clears.
    root.classList.remove('dark', 'theme-light', 'theme-purple', 'theme-blue', 'theme-midnight')
    if (t === 'dark') root.classList.add('dark')
    if (t === 'light') root.classList.add('theme-light')
    if (t === 'purple') root.classList.add('theme-purple')
    if (t === 'blue') root.classList.add('theme-blue')
  }

  useEffect(() => {
    const sync = () => {
      // A saved value that no longer exists (e.g. 'midnight') fails this check and
      // is migrated to 'dark'.
      const saved = localStorage.getItem('bdmflow-theme') as Theme
      const valid: Theme[] = ['dark', 'light', 'purple', 'blue']
      const t = saved && valid.includes(saved) ? saved : 'light'
      if (t !== saved) localStorage.setItem('bdmflow-theme', t)
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
        className="flex items-center justify-center w-8 h-8 rounded-full border border-line-5 bg-surface-3 hover:bg-surface-4 hover:border-line-6 text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95 shadow-sm"
        title={`Tema: ${mounted ? current.label : '...'}`}
        aria-label="Pilih Tema"
      >
        {mounted ? current.icon : (
          <div className="w-3.5 h-3.5 rounded-full bg-muted-foreground/20" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-64 p-2.5 rounded-2xl border border-line-5 bg-card/95 backdrop-blur-2xl shadow-glass-lg z-50 animate-fade-in"
          style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 mb-1">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Pilih Tema UI
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-400/80 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {THEMES.length} TEMA
            </span>
          </div>

          <div className="space-y-1.5">
            {THEMES.map(t => {
              const active = theme === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => select(t.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group active:scale-[0.98] ${
                    active
                      ? 'bg-primary/10 border border-primary/30 shadow-sm'
                      : 'border border-transparent hover:bg-surface-3'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl shrink-0 border border-line-6 relative overflow-hidden shadow-inner ${t.bg}`}>
                    <div className="absolute inset-x-0 bottom-0 h-2" style={{ backgroundColor: t.accent }} />
                    <div className="absolute top-1.5 left-1.5 w-3.5 h-1 rounded-full bg-white/30" />
                    <div className="absolute top-3 left-1.5 w-2 h-1 rounded-full bg-white/20" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-extrabold ${active ? 'text-foreground' : 'text-foreground/80 group-hover:text-foreground'}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 truncate">{t.desc}</p>
                  </div>

                  {active && (
                    <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: t.accent, boxShadow: `0 0 10px ${t.accent}` }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
