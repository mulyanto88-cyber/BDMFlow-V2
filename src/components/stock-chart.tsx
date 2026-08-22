'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

interface OHLCV {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
  foreign?: number
  vwma?: number
}

export function StockChart({ data, height = 500 }: { data: OHLCV[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return
    const container = containerRef.current

    // Palet mengikuti tema aktif (light default → Geist Light).
    const rootCls = document.documentElement.classList
    const isDark = rootCls.contains('dark') || rootCls.contains('theme-purple') || rootCls.contains('theme-blue')
    const C = {
      grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.06)',
      text: isDark ? '#71717a' : '#64748b',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
      crosshair: isDark ? '#3b82f6' : '#4f46e5',
    }

    const chart = createChart(container, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: C.text, fontSize: 11 },
      grid: { vertLines: { color: C.grid }, horzLines: { color: C.grid } },
      crosshair: { mode: 0, vertLine: { color: C.crosshair, style: 2, width: 1, labelBackgroundColor: C.crosshair }, horzLine: { color: C.crosshair, style: 2, width: 1, labelBackgroundColor: C.crosshair } },
      rightPriceScale: { borderColor: C.border, scaleMargins: { top: 0.05, bottom: 0.25 } },
      timeScale: { borderColor: C.border, timeVisible: false },
      width: container.clientWidth, height,
    })

    const candles = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', borderUpColor: '#22c55e', borderDownColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444' })
    const vwmaLine = chart.addLineSeries({ color: '#eab308', lineWidth: 1, lineStyle: 2, priceFormat: { type: 'price' } })
    const foreignHist = chart.addHistogramSeries({ color: '#22c55e80', priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 }, visible: false })

    const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time))
    const cdl: any[] = []; const vwma: any[] = []; const fgn: any[] = []
    for (const d of sorted) {
      cdl.push({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })
      if (d.vwma && d.vwma > 0) vwma.push({ time: d.time, value: d.vwma })
      if (d.foreign !== undefined) fgn.push({ time: d.time, value: d.foreign, color: d.foreign >= 0 ? '#22c55e60' : '#ef444460' })
    }
    candles.setData(cdl)
    if (vwma.length) vwmaLine.setData(vwma)
    if (fgn.length) foreignHist.setData(fgn)
    chart.timeScale().fitContent()

    const onResize = () => chart.applyOptions({ width: container.clientWidth })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.remove() }
  }, [data, height])

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
}
