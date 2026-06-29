'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface TickerItem {
  stock_code:     string
  close:          number
  change_percent: number
}

async function fetchTickers(): Promise<TickerItem[]> {
  const res = await fetch('/api/motherduck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        SELECT stock_code, close, change_percent
        FROM market.vw_stock_latest
        WHERE value > 1000000000
        ORDER BY ABS(change_percent) DESC
        LIMIT 20
      `,
    }),
  })
  const json = await res.json()
  return json.data || []
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
      fetchTickers().then(data => {
        if (data.length > 0) {
          setTickers(data)
          setReady(true)
        }
      })
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
    <div className="ticker-container h-7 flex items-stretch">

      {/* Left sentinel: market pulse badge */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3 border-r text-[10px] font-bold z-10"
        style={{
          borderColor: 'rgba(var(--primary-glow-rgb),0.12)',
          background:  'var(--panel-bg)',
        }}
      >
        {ready ? (
          <>
            <span className="pulse-dot" />
            <span
              className="font-mono text-[9px] font-black"
              style={{ color: upCount > downCount ? '#4ade80' : upCount < downCount ? '#f87171' : '#fbbf24' }}
            >
              {upCount > downCount ? 'BULL' : upCount < downCount ? 'BEAR' : 'FLAT'}
            </span>
            <span className="text-muted-foreground/30 font-mono text-[9px] hidden sm:block">
              {upCount}↑{downCount}↓
            </span>
          </>
        ) : (
          <span className="text-muted-foreground/25 font-mono text-[9px]">IDX</span>
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

        <div className={`ticker-track h-full items-center ${!ready ? 'opacity-30' : ''}`}>
          {ready
            ? items.map((t, i) => {
                const item = t as TickerItem
                const chg  = Number(item.change_percent) || 0
                const isUp = chg >= 0
                return (
                  <Link
                    key={i}
                    href={`/stock/${item.stock_code}`}
                    className="ticker-item hover:opacity-70 transition-opacity cursor-pointer h-full items-center"
                  >
                    <span className="font-mono font-black text-[10.5px] text-foreground/80 tracking-wide">
                      {item.stock_code}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground/60 tabular-nums">
                      {Number(item.close).toLocaleString('id-ID')}
                    </span>
                    <span
                      className="text-[9.5px] font-black tabular-nums"
                      style={{ color: isUp ? '#4ade80' : '#f87171' }}
                    >
                      {isUp ? '▲' : '▼'}{Math.abs(chg).toFixed(2)}%
                    </span>
                  </Link>
                )
              })
            : [...SKELETON_CODES, ...SKELETON_CODES].map((code, i) => (
                <span key={i} className="ticker-item">
                  <span className="font-mono font-black text-[10.5px] text-muted-foreground/40">{code}</span>
                </span>
              ))
          }
        </div>
      </div>

      {/* Right sentinel: Live Clock + Date */}
      {mounted && (
        <div
          className="hidden md:flex flex-shrink-0 items-center gap-2 px-3 border-l text-[10px] z-10 select-none"
          style={{
            borderColor: 'rgba(var(--primary-glow-rgb),0.12)',
            background: 'var(--panel-bg)',
          }}
        >
          <span className="font-mono text-[11px] font-semibold text-foreground/70 tracking-wider tabular-nums">
            {time}
          </span>
          <span className="text-muted-foreground/25 text-[9px]">WIB</span>
          <span className="hidden lg:block text-[10px] text-muted-foreground/35 capitalize">
            {date}
          </span>
        </div>
      )}
    </div>
  )
}
