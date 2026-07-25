'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { mdQuery } from '@/lib/api'

interface TickerItem {
  stock_code:     string
  close:          number
  change_percent: number
}

async function fetchTickers(): Promise<TickerItem[]> {
  try {
    const res = await mdQuery('ticker.top')
    return (res || []) as unknown as TickerItem[]
  } catch (err) {
    console.warn('[TickerTape] Fetch failed, falling back to static codes:', err)
    return []
  }
}

const SKELETON_CODES = ['BBCA', 'TLKM', 'BMRI', 'BBRI', 'ASII', 'GOTO', 'BYAN', 'ADRO', 'INDF', 'UNVR']

export default function TickerTape() {
  const [tickers, setTickers] = useState<TickerItem[]>([])
  const [ready, setReady]     = useState(false)
  const [time, setTime]       = useState('')
  const [date, setDate]       = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Ticker fetch
    const load = () => {
      fetchTickers()
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setTickers(data)
            setReady(true)
          }
        })
        .catch(err => console.warn('[TickerTape] load error:', err))
    }
    load()
    const interval = setInterval(load, 5 * 60 * 1000)

    // Clock tick
    const tick = () => {
      const now = new Date()
      setTime(format(now, 'HH:mm:ss'))
      setDate(format(now, 'EEE, dd MMM yyyy', { locale: localeId }))
    }
    tick()
    const clockInterval = setInterval(tick, 1000)

    return () => { clearInterval(interval); clearInterval(clockInterval) }
  }, [])

  const upCount   = tickers.filter(t => Number(t.change_percent) > 0).length
  const downCount = tickers.filter(t => Number(t.change_percent) < 0).length
  const items  = ready ? [...tickers, ...tickers] : SKELETON_CODES

  return (
    <div className="ticker-container h-7 flex items-stretch border-b border-border/60">

      {/* Left sentinel: market pulse badge */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-border/50 text-[10px] font-bold z-10"
        style={{
          background: 'var(--panel-bg)',
        }}
      >
        {ready ? (
          <>
            <span className="pulse-dot" />
            <span
              className="font-mono text-[9px] font-black"
              style={{ color: upCount > downCount ? '#16a34a' : upCount < downCount ? '#dc2626' : '#d97706' }}
            >
              {upCount > downCount ? 'BULL' : upCount < downCount ? 'BEAR' : 'FLAT'}
            </span>
            <span className="text-foreground/70 font-mono text-[9.5px] font-bold hidden sm:block">
              {upCount}↑{downCount}↓
            </span>
          </>
        ) : (
          <span className="text-foreground/80 font-mono text-[10px] font-bold">IDX</span>
        )}
      </div>

      {/* Scrolling items */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, var(--ticker-bg), transparent)' }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, var(--ticker-bg), transparent)' }}
        />

        <div className={`ticker-track h-full items-center ${!ready ? 'opacity-50' : ''}`}>
          {ready
            ? items.map((t, i) => {
                const item = t as TickerItem
                const chg  = Number(item.change_percent) || 0
                const isUp = chg >= 0
                return (
                  <Link
                    key={i}
                    href={`/stock/${item.stock_code}`}
                    className="ticker-item hover:bg-black/5 dark:hover:bg-surface-3 transition-colors cursor-pointer h-full items-center px-3 border-r border-border/40"
                  >
                    <span className="font-mono font-black text-[11px] text-foreground tracking-wide">
                      {item.stock_code}
                    </span>
                    <span className="font-mono text-[10.5px] font-bold text-foreground/80 tabular-nums">
                      {Number(item.close).toLocaleString('id-ID')}
                    </span>
                    <span
                      className={`text-[10px] font-black tabular-nums ${
                        isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {isUp ? '▲' : '▼'}{Math.abs(chg).toFixed(2)}%
                    </span>
                  </Link>
                )
              })
            : [...SKELETON_CODES, ...SKELETON_CODES].map((code, i) => (
                <span key={i} className="ticker-item px-3">
                  <span className="font-mono font-black text-[10.5px] text-foreground/60">{code}</span>
                </span>
              ))
          }
        </div>
      </div>

      {/* Right sentinel: Live Clock + Date */}
      {mounted && (
        <div
          className="hidden md:flex flex-shrink-0 items-center gap-2 px-3 border-l border-border/50 text-[10px] z-10 select-none"
          style={{
            background: 'var(--panel-bg)',
          }}
        >
          <span className="font-mono text-[11px] font-bold text-foreground tracking-wider tabular-nums">
            {time}
          </span>
          <span className="text-foreground/70 font-bold text-[9px]">WIB</span>
          <span className="hidden lg:block text-[10px] font-medium text-foreground/70 capitalize">
            {date}
          </span>
        </div>
      )}
    </div>
  )
}
