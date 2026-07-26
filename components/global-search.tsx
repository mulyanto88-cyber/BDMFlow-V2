'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Clock, TrendingUp, ArrowRight, LayoutDashboard,
  LineChart, PieChart, Globe, Activity, BarChart2,
  Eye, Calculator, Bell, Zap, Brain, Shield,
  TrendingUp as TrendingUpIcon, Crown, Star,
} from 'lucide-react'
import { mdQuery } from '@/lib/api'

interface Suggestion {
  stock_code: string
  sector: string
  close: number
  change_percent: number
}

interface PageItem {
  href: string
  label: string
  icon: React.ElementType
  section: string
}

const PAGES: PageItem[] = [
  { href: '/dashboard',       label: 'Morning Brief',       icon: LayoutDashboard, section: 'Markets' },
  { href: '/composite',       label: 'Composite Command',   icon: LineChart,       section: 'Markets' },
  { href: '/bandarmologi',    label: 'Bandarmologi',        icon: Crown,           section: 'Markets' },
  { href: '/sector',          label: 'Sector Analytics',    icon: PieChart,        section: 'Markets' },
  { href: '/groups',          label: 'Group Intelligence',  icon: Globe,           section: 'Markets' },
  { href: '/screener',        label: 'Pro Screener',        icon: Search,          section: 'Screeners' },
  { href: '/volume-aov',      label: 'Breakout Scanner',    icon: Zap,             section: 'Screeners' },
  { href: '/smart-money',     label: 'Smart Money Matrix',  icon: Brain,           section: 'Screeners' },
  { href: '/radar',           label: 'Watchlist Radar',     icon: Activity,        section: 'Screeners' },
  { href: '/msci-screener',   label: 'MSCI Screener',       icon: Shield,          section: 'Screeners' },
  { href: '/ftse-screener',   label: 'FTSE Screener',       icon: Globe,           section: 'Screeners' },
  { href: '/foreign-flow',    label: 'Foreign Flow',        icon: Globe,           section: 'Aliran Dana' },
  { href: '/broker-flow',     label: 'Broker Flow Harian',  icon: Activity,        section: 'Aliran Dana' },
  { href: '/broker-tracker',  label: 'Broker Summary',      icon: BarChart2,       section: 'Aliran Dana' },
  { href: '/ksei-monthly',    label: 'KSEI Monthly',        icon: PieChart,        section: 'KSEI' },
  { href: '/ksei1persen',     label: 'KSEI > 1%',           icon: Eye,             section: 'KSEI' },
  { href: '/insider',         label: 'Insider Radar',       icon: Search,          section: 'KSEI' },
  { href: '/watchlist',       label: 'Watchlist & Alerts',  icon: Bell,            section: 'Tools' },
  { href: '/backtest',        label: 'Backtest Lab',        icon: Calculator,      section: 'Tools' },
  { href: '/right-issue-calc',label: 'Right Issue Calc',    icon: TrendingUpIcon,  section: 'Tools' },
]

const RECENT_KEY = 'bdmflow_recent_searches'
const MAX_RECENT = 5

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}
function saveRecent(code: string) {
  const prev = getRecent().filter(c => c !== code)
  localStorage.setItem(RECENT_KEY, JSON.stringify([code, ...prev].slice(0, MAX_RECENT)))
}

async function searchStocks(q: string): Promise<Suggestion[]> {
  const data = await mdQuery('search.stocks', [`${q.toUpperCase()}%`])
  return data as unknown as Suggestion[]
}

export default function GlobalSearch() {
  const router = useRouter()
  const [query,       setQuery]       = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const [loading,     setLoading]     = useState(false)
  const [recent,      setRecent]      = useState<string[]>([])
  const [isMac,       setIsMac]       = useState(false)

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
    setRecent(getRecent())
  }, [])

  const filteredPages = query
    ? PAGES.filter(p =>
        p.label.toLowerCase().includes(query.toLowerCase()) ||
        p.section.toLowerCase().includes(query.toLowerCase())
      )
    : []

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return }
    setLoading(true)
    try {
      const data = await searchStocks(q)
      setSuggestions(data)
      setOpen(true)
      setHighlighted(-1)
    } catch { setSuggestions([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query) { setSuggestions([]); if (!open) return }
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 220)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions, open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
        setRecent(getRecent())
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const openSearch = () => {
      inputRef.current?.scrollIntoView({ block: 'center' })
      inputRef.current?.focus()
      setOpen(true)
      setRecent(getRecent())
    }
    window.addEventListener('open-global-search', openSearch)
    return () => window.removeEventListener('open-global-search', openSearch)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const hasSuggestions = suggestions.length > 0
    const hasPages = filteredPages.length > 0
    const hasRecents = !query && recent.length > 0
    const total = hasSuggestions
      ? suggestions.length + filteredPages.length
      : hasPages
        ? filteredPages.length
        : hasRecents
          ? recent.length + PAGES.length
          : 0

    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, total - 1)) }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (hasSuggestions && highlighted >= 0) {
        const pagesCount = filteredPages.length
        if (highlighted < pagesCount) {
          router.push(filteredPages[highlighted].href)
          setQuery(''); setOpen(false)
          return
        }
        const stockIdx = highlighted - pagesCount
        const target = suggestions[stockIdx]?.stock_code ?? query.toUpperCase()
        if (target && target.length >= 2) navigateStock(target)
      } else if (hasPages && highlighted >= 0) {
        router.push(filteredPages[highlighted].href)
        setQuery(''); setOpen(false)
      } else if (hasRecents) {
        if (highlighted >= 0 && highlighted < recent.length) {
          navigateStock(recent[highlighted])
        } else if (highlighted >= recent.length) {
          const pageIdx = highlighted - recent.length
          router.push(PAGES[pageIdx].href)
          setQuery(''); setOpen(false)
        }
      } else if (query.length >= 2) {
        navigateStock(query.toUpperCase())
      }
    }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const navigateStock = (code: string) => {
    setQuery(''); setOpen(false); setSuggestions([])
    saveRecent(code.toUpperCase())
    setRecent(getRecent())
    router.push(`/stock/${code.toUpperCase()}`)
  }

  const showRecent    = open && !query && recent.length > 0
  const showSuggest   = open && suggestions.length > 0
  const showPages     = open && query && filteredPages.length > 0
  const showAllPages  = open && !query
  const showDropdown  = showRecent || showSuggest || showPages || showAllPages

  const chgColor = (chg: number) => chg >= 0 ? '#4ade80' : '#f87171'

  let globalIdx = 0

  return (
    <div ref={containerRef} className="relative flex-1 md:flex-none md:w-72">
      <Search
        size={13}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10"
      />

      {loading && (
        <svg className="absolute right-9 top-1/2 -translate-y-1/2 w-3 h-3 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"/>
          <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )}

      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { setOpen(true); setRecent(getRecent()) }}
        onKeyDown={handleKeyDown}
        placeholder="Cari saham atau halaman..."
        maxLength={30}
        autoComplete="off"
        className="w-full pl-8 pr-16 py-1.5 text-[12px] bg-surface-3 border border-line-3 rounded-xl focus:outline-none focus:border-primary/40 focus:bg-surface-4 transition-all placeholder:text-muted-foreground/50 font-mono tracking-wide"
        style={{ letterSpacing: query ? '0.08em' : undefined }}
      />

      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
        <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-line-4 bg-surface-3 text-[9px] font-mono text-muted-foreground/35">
          {isMac ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="hidden md:flex items-center px-1.5 py-0.5 rounded border border-line-4 bg-surface-3 text-[9px] font-mono text-muted-foreground/35">
          K
        </kbd>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 glass rounded-xl overflow-hidden shadow-2xl max-h-[480px] overflow-y-auto custom-scrollbar">

          {/* Page search results */}
          {showPages && (
            <>
              <div className="px-3 py-2 flex items-center gap-1.5 border-b border-line-2">
                <ArrowRight size={10} className="text-primary/50" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary/60">Halaman</span>
              </div>
              {filteredPages.map((page) => {
                const idx = globalIdx++
                const PageIcon = page.icon
                return (
                  <button
                    key={page.href}
                    onMouseDown={e => { e.preventDefault(); router.push(page.href); setQuery(''); setOpen(false) }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${highlighted === idx ? 'bg-primary/8' : 'hover:bg-surface-2'}`}
                  >
                    <PageIcon size={13} className="text-muted-foreground/50 shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground/80">{page.label}</span>
                    <span className="ml-auto text-[9px] text-muted-foreground/30">{page.section}</span>
                  </button>
                )
              })}
            </>
          )}

          {/* No-query state: all pages */}
          {showAllPages && (
            <>
              <div className="px-3 py-2 flex items-center gap-1.5 border-b border-line-2">
                <ArrowRight size={10} className="text-primary/50" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-primary/60">Halaman</span>
              </div>
              {PAGES.map((page) => {
                const idx = globalIdx++
                const PageIcon = page.icon
                return (
                  <button
                    key={page.href}
                    onMouseDown={e => { e.preventDefault(); router.push(page.href); setQuery(''); setOpen(false) }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${highlighted === idx ? 'bg-primary/8' : 'hover:bg-surface-2'}`}
                  >
                    <PageIcon size={13} className="text-muted-foreground/50 shrink-0" />
                    <span className="text-[11px] font-semibold text-foreground/80">{page.label}</span>
                    <span className="ml-auto text-[9px] text-muted-foreground/30">{page.section}</span>
                  </button>
                )
              })}
            </>
          )}

          {/* Recent searches */}
          {showRecent && (
            <>
              <div className="px-3 py-2 flex items-center gap-1.5 border-b border-line-2">
                <Clock size={9} className="text-muted-foreground/30" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/30">Pencarian Terakhir</span>
              </div>
              {recent.map((code) => {
                const idx = globalIdx++
                return (
                  <button
                    key={code}
                    onMouseDown={e => { e.preventDefault(); navigateStock(code) }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${highlighted === idx ? 'bg-primary/8' : 'hover:bg-surface-2'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="text-muted-foreground/30 shrink-0" />
                      <span className="font-mono font-black text-sm text-foreground/80">{code}</span>
                    </div>
                    <TrendingUp size={11} className="text-muted-foreground/20" />
                  </button>
                )
              })}
            </>
          )}

          {/* Stock search results */}
          {showSuggest && suggestions.map((s) => {
            const idx = globalIdx++
            const chg = Number(s.change_percent) || 0
            const isUp = chg >= 0
            return (
              <button
                key={s.stock_code}
                onMouseDown={e => { e.preventDefault(); navigateStock(s.stock_code) }}
                onMouseEnter={() => setHighlighted(idx)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${highlighted === idx ? 'bg-primary/8' : 'hover:bg-surface-2'}`}
              >
                <div>
                  <span className="font-mono font-black text-sm text-foreground">{s.stock_code}</span>
                  {s.sector && <span className="text-[10px] text-muted-foreground/40 ml-2">{s.sector}</span>}
                </div>
                <div className="text-right flex-shrink-0 ml-3 flex flex-col items-end">
                  <span className="text-[12px] font-semibold text-foreground/80 font-mono tabular-nums">
                    {Number(s.close).toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] font-black tabular-nums" style={{ color: chgColor(chg) }}>
                    {isUp ? '▲' : '▼'}{Math.abs(chg).toFixed(2)}%
                  </span>
                </div>
              </button>
            )
          })}

          {/* Footer hint */}
          <div className="px-3 py-1.5 flex items-center gap-3 border-t border-line-1">
            <span className="text-[9px] text-muted-foreground/25 flex items-center gap-1">
              <kbd className="font-mono">↑↓</kbd> navigasi
            </span>
            <span className="text-[9px] text-muted-foreground/25 flex items-center gap-1">
              <kbd className="font-mono">↵</kbd> pilih
            </span>
            <span className="text-[9px] text-muted-foreground/25 flex items-center gap-1">
              <kbd className="font-mono">Esc</kbd> tutup
            </span>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div className="fixed inset-0 z-[-1]" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}
