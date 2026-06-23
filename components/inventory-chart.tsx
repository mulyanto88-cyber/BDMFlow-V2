'use client'

import { useEffect, useMemo, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

export interface InvCandle { date: string; open: number; high: number; low: number; close: number }
export interface InvBrokerRow {
  date: string; broker_code: string; broker_name?: string;
  net_lot: number; role: 'ACC' | 'DIST'; total_lot: number
}

// Greens for accumulators (net buyers), reds for distributors (net sellers).
const ACC_COLORS = ['#22c55e', '#10b981', '#14b8a6', '#84cc16', '#06b6d4', '#34d399', '#0d9488', '#65a30d']
const DIST_COLORS = ['#ef4444', '#f97316', '#ec4899', '#f43f5e', '#f59e0b', '#dc2626', '#be123c', '#a855f7']

/**
 * Inventory Analysis — candlestick price (right scale) + per-broker CUMULATIVE net-lot
 * lines (left scale). Each broker line = its running inventory: rising = accumulating,
 * falling = distributing. Modelled on components/../src/components/stock-chart.tsx.
 */
export function InventoryChart({ price, brokers, height = 460 }: {
  price: InvCandle[]; brokers: InvBrokerRow[]; height?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Deterministic per-broker series (cumulative + color + role) — shared by chart and legend.
  const series = useMemo(() => {
    const byBroker = new Map<string, InvBrokerRow[]>()
    brokers.forEach(b => {
      if (!byBroker.has(b.broker_code)) byBroker.set(b.broker_code, [])
      byBroker.get(b.broker_code)!.push(b)
    })
    const codes = Array.from(byBroker.keys())
      .sort((a, b) => byBroker.get(b)![0].total_lot - byBroker.get(a)![0].total_lot)
    let accI = 0, disI = 0
    return codes.map(code => {
      const rows = byBroker.get(code)!.slice().sort((a, b) => a.date.localeCompare(b.date))
      const role = rows[0].role
      const color = role === 'ACC' ? ACC_COLORS[accI++ % ACC_COLORS.length] : DIST_COLORS[disI++ % DIST_COLORS.length]
      let cum = 0
      const data = rows.map(r => { cum += r.net_lot; return { time: r.date, value: cum } })
      return { code, name: rows[0].broker_name ?? code, role, color, data, final: cum }
    })
  }, [brokers])

  useEffect(() => {
    if (!ref.current || price.length === 0) return
    const container = ref.current

    const chart = createChart(container, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#71717a', fontSize: 11 },
      grid: { vertLines: { color: '#1e1e2e' }, horzLines: { color: '#1e1e2e' } },
      crosshair: { mode: 0, vertLine: { color: '#3b82f6', style: 2, width: 1 }, horzLine: { color: '#3b82f6', style: 2, width: 1 } },
      rightPriceScale: { borderColor: '#1e1e2e', scaleMargins: { top: 0.08, bottom: 0.08 } },
      leftPriceScale: { visible: true, borderColor: '#1e1e2e', scaleMargins: { top: 0.08, bottom: 0.08 } },
      timeScale: { borderColor: '#1e1e2e', timeVisible: false },
      width: container.clientWidth, height,
    })

    // Price candles → right scale
    const candles = chart.addCandlestickSeries({
      priceScaleId: 'right',
      upColor: '#22c55e', downColor: '#ef4444',
      borderUpColor: '#22c55e', borderDownColor: '#ef4444',
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: 0, minMove: 1 },
      priceLineVisible: false, lastValueVisible: false,
    })
    candles.setData(
      price.slice().sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({ time: d.date, open: d.open, high: d.high, low: d.low, close: d.close }))
    )

    // Broker cumulative inventory → left scale
    series.forEach(s => {
      const line = chart.addLineSeries({
        priceScaleId: 'left', color: s.color, lineWidth: 2,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
        priceLineVisible: false, lastValueVisible: false,
      })
      line.setData(s.data)
      // Broker code label at the line's end (last point) — like Stockbit, no value.
      const last = s.data[s.data.length - 1]
      if (last) line.setMarkers([{ time: last.time, position: 'inBar', color: s.color, shape: 'circle', text: s.code }])
    })

    chart.timeScale().fitContent()
    const onResize = () => chart.applyOptions({ width: container.clientWidth })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.remove() }
  }, [price, series, height])

  const accum = series.filter(s => s.role === 'ACC')
  const distrib = series.filter(s => s.role === 'DIST')

  return (
    <div className="space-y-3">
      <div ref={ref} className="w-full" style={{ height }} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[{ title: 'Net Akumulasi', rows: accum }, { title: 'Net Distribusi', rows: distrib }].map(g => (
          <div key={g.title} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/50 mb-2">{g.title}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {g.rows.length === 0 && <span className="text-[10px] text-muted-foreground/40">—</span>}
              {g.rows.map(s => (
                <span key={s.code} className="flex items-center gap-1.5 text-[11px]">
                  <span className="w-3 h-[2px] rounded-full" style={{ background: s.color }} />
                  <span className="font-bold text-foreground/80">{s.code}</span>
                  <span className="font-mono text-muted-foreground/45">{Math.round(s.final).toLocaleString('id-ID')} lot</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
