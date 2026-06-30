'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, TrendingUp } from 'lucide-react'

interface Suggestion {
  stock_code: string
  sector: string
  close: number
  change_percent: number
}

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
  const res = await fetch('/api/motherduck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        SELECT stock_code, sector, close, change_percent
        FROM market.vw_stock_latest
        WHERE stock_code ILIKE $1
        ORDER BY value DESC
        LIMIT 8
      `,
      params: [`${q.toUpperCase()}%`],
    }),
  })
  const json = await res.json()
  return json.data || []
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

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ⌘K / Ctrl+K global shortcut
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

  // open-global-search event (from mobile FAB)
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
    const total = suggestions.length > 0 ? suggestions.length : recent.length
    if (e.key === 'ArrowDown')  { e.preventDefault(); setHighlighted(h => Math.min(h + 1, total - 1)) }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) {
        const target = highlighted >= 0 ? suggestions[highlighted]?.stock_code : query.toUpperCase()
        if (target && target.length >= 2) navigate(target)
      } else if (recent.length > 0 && highlighted >= 0) {
        navigate(recent[highlighted])
      } else if (query.length >= 2) {
        navigate(query.toUpperCase())
      }
    }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const navigate = (code: string) => {
    setQuery(''); setOpen(false); setSuggestions([])
    saveRecent(code.toUpperCase())
    setRecent(getRecent())
    router.push(`/stock/${code.toUpperCase()}`)
  }

  const showRecent    = open && !query && recent.length > 0
  const showSuggest   = open && suggestions.length > 0
  const showDropdown  = showRecent || showSuggest

  const chgColor = (chg: number) => chg >= 0 ? '#4ade80' : '#f87171'

  return (
    <div ref={containerRef} className="relative flex-1 md:flex-none md:w-72">
      {/* Search icon */}
      <Search
        size={13}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10"
      />

      {/* Spinner */}
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
        onChange={e => setQuery(e.target.value.toUpperCase())}
        onFocus={() => { setOpen(true); setRecent(getRecent()) }}
        onKeyDown={handleKeyDown}
        placeholder="Cari saham..."
        maxLength={6}
        autoComplete="off"
        className="w-full pl-8 pr-16 py-1.5 text-[12px] bg-white/[0.04] border border-white/[0.07] rounded-xl focus:outline-none focus:border-primary/40 focus:bg-white/[0.06] transition-all placeholder:text-muted-foreground/40 uppercase font-mono tracking-wide"
        style={{ letterSpacing: query ? '0.08em' : undefined }}
      />

      {/* ⌘K hint */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none">
        <kbd className="hidden md:flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-[9px] font-mono text-muted-foreground/35">
          {isMac ? '⌘' : 'Ctrl'}
        </kbd>
        <kbd className="hidden md:flex items-center px-1.5 py-0.5 rounded border border-white/[0.08] bg-white/[0.04] text-[9px] font-mono text-muted-foreground/35">
          K
        </kbd>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 glass rounded-xl overflow-hidden shadow-2xl">
          {showRecent && (
            <>
              <div className="px-3 py-2 flex items-center gap-1.5 border-b border-white/[0.05]">
                <Clock size={9} className="text-muted-foreground/30" />
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground/30">Pencarian Terakhir</span>
              </div>
              {recent.map((code, i) => (
                <button
                  key={code}
                  onMouseDown={e => { e.preventDefault(); navigate(code) }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${highlighted === i ? 'bg-primary/8' : 'hover:bg-white/[0.03]'}`}
                >
                  <div className="flex items-center gap-2">
                    <Clock size={11} className="text-muted-foreground/30 shrink-0" />
                    <span className="font-mono font-black text-sm text-foreground/80">{code}</span>
                  </div>
                  <TrendingUp size={11} className="text-muted-foreground/20" />
                </button>
              ))}
            </>
          )}

          {showSuggest && suggestions.map((s, i) => {
            const chg = Number(s.change_percent) || 0
            const isUp = chg >= 0
            return (
              <button
                key={s.stock_code}
                onMouseDown={e => { e.preventDefault(); navigate(s.stock_code) }}
                onMouseEnter={() => setHighlighted(i)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${highlighted === i ? 'bg-primary/8' : 'hover:bg-white/[0.03]'}`}
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
          <div className="px-3 py-1.5 flex items-center gap-3 border-t border-white/[0.04]">
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
    </div>
  )
}
