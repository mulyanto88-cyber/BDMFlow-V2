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
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<{ candle: any; vwma: any; foreign: any } | null>(null)

  // Create chart ONCE
  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const chart = createChart(container, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#71717a', fontSize: 11 },
      grid: { vertLines: { color: '#1e1e2e' }, horzLines: { color: '#1e1e2e' } },
      crosshair: { mode: 0, vertLine: { color: '#3b82f6', style: 2, width: 1, labelBackgroundColor: '#3b82f6' }, horzLine: { color: '#3b82f6', style: 2, width: 1, labelBackgroundColor: '#3b82f6' } },
      rightPriceScale: { borderColor: '#1e1e2e', scaleMargins: { top: 0.05, bottom: 0.25 } },
      timeScale: { borderColor: '#1e1e2e', timeVisible: false },
      width: container.clientWidth, height,
    })
    const candle = chart.addCandlestickSeries({ upColor: '#22c55e', downColor: '#ef4444', borderUpColor: '#22c55e', borderDownColor: '#ef4444', wickUpColor: '#22c55e', wickDownColor: '#ef4444' })
    const vwma = chart.addLineSeries({ color: '#eab308', lineWidth: 1, lineStyle: 2, priceFormat: { type: 'price' } })
    const foreign = chart.addHistogramSeries({ color: '#22c55e80', priceFormat: { type: 'volume' }, priceScaleId: 'volume' })
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.85, bottom: 0 }, visible: false })

    seriesRef.current = { candle, vwma, foreign }
    chartRef.current = chart

    const onResize = () => chart.applyOptions({ width: container.clientWidth })
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); chart.remove(); chartRef.current = null; seriesRef.current = null }
  }, [height])

  // Update data ONLY
  useEffect(() => {
    if (data.length === 0 || !seriesRef.current) return
    const { candle, vwma, foreign } = seriesRef.current
    const sorted = [...data].sort((a, b) => a.time.localeCompare(b.time))
    const cdl: any[] = []; const vwmaData: any[] = []; const fgn: any[] = []
    for (const d of sorted) {
      cdl.push({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })
      if (d.vwma && d.vwma > 0) vwmaData.push({ time: d.time, value: d.vwma })
      if (d.foreign !== undefined) fgn.push({ time: d.time, value: d.foreign, color: d.foreign >= 0 ? '#22c55e60' : '#ef444460' })
    }
    candle.setData(cdl)
    if (vwmaData.length) vwma.setData(vwmaData)
    if (fgn.length) foreign.setData(fgn)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
}
