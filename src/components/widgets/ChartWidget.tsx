import React, { useState, useEffect, useRef } from 'react'
import { Maximize2, Minimize2, Loader2, AlertTriangle } from 'lucide-react'
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'

const PERIOD_OPTIONS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
  { label: '3Y', days: 1095 },
]

interface ChartWidgetProps {
  stockCode?: string // Optional, if not provided uses activeTicker from store
}

export function ChartWidget({ stockCode: propCode }: ChartWidgetProps) {
  const { activeTicker, period, setPeriod } = useTerminalStore()
  const code = propCode || activeTicker

  const { data, isLoading, error } = useStockOverview(code, period)
  const historyData = data?.historyData || []

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartWrapRef = useRef<HTMLDivElement>(null)
  const [chartReady, setChartReady] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).LightweightCharts) { setChartReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js'
    script.crossOrigin = 'anonymous'
    script.async = true
    script.onload = () => setChartReady(true)
    document.body.appendChild(script)
    return () => { script.remove() }
  }, [])

  const toggleFullscreen = () => {
    if (!chartWrapRef.current) return
    if (!isFullscreen) chartWrapRef.current.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
    setIsFullscreen(f => !f)
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    if (!chartReady || !chartContainerRef.current || !historyData.length) return
    const lwc = (window as any).LightweightCharts
    if (!lwc) return

    chartContainerRef.current.innerHTML = ''
    const chartHeight = isFullscreen
      ? Math.max(400, (chartContainerRef.current.clientHeight || window.innerHeight - 120))
      : 600
    const chart = lwc.createChart(chartContainerRef.current, {
      height: chartHeight,
      localization: { priceFormatter: (p: number) => Math.round(p).toLocaleString('id-ID') },
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(51,65,85,0.15)' }, horzLines: { color: 'rgba(51,65,85,0.15)' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: 'rgba(51,65,85,0.5)' },
      timeScale: { borderColor: 'rgba(51,65,85,0.5)', timeVisible: true },
    })

    chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.38 } })

    let cumSum = 0
    const cumulativeNF = historyData.map((d: any) => { cumSum += d.net_foreign; return cumSum })
    const cnfMin = Math.min(...cumulativeNF)
    const cnfMax = Math.max(...cumulativeNF)
    const cnfRange = cnfMax - cnfMin || 1
    const pLow  = Math.min(...historyData.map((d: any) => d.low).filter((v: number) => v > 0))
    const pHigh = Math.max(...historyData.map((d: any) => d.high).filter((v: number) => v > 0))
    const pRange = pHigh - pLow || 1
    const targetLow  = pLow  + pRange * 0.15
    const targetHigh = pLow  + pRange * 0.65
    const nfLineData = historyData.map((d: any, i: number) => ({
      time: d.time,
      value: ((cumulativeNF[i] - cnfMin) / cnfRange) * (targetHigh - targetLow) + targetLow,
    }))
    const nfLineSeries = chart.addLineSeries({
      color: 'rgba(20,184,166,0.6)', lineWidth: 2, crosshairMarkerVisible: false,
      lastValueVisible: false, priceLineVisible: false, priceScaleId: 'right',
    })
    nfLineSeries.setData(nfLineData)

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    candleSeries.setData(historyData.map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })))

    const markers: any[] = []
    historyData.forEach((d: any) => {
      if (d.whale_signal || d.aov_ratio >= 1.5)
        markers.push({ time: d.time, position: 'aboveBar', color: '#10b981', shape: 'circle', size: 1.5, text: '★' })
      if (d.aov_ratio <= 0.6 && d.aov_ratio > 0)
        markers.push({ time: d.time, position: 'belowBar', color: '#ef4444', shape: 'circle', size: 1.5, text: '⚡' })
      if (d.big_player_anomaly)
        markers.push({ time: d.time, position: 'belowBar', color: '#ec4899', shape: 'circle', size: 1.5, text: '◆' })
    })
    markers.sort((a, b) => (a.time < b.time ? -1 : 1))
    candleSeries.setMarkers(markers)

    const vwmaSeries = chart.addLineSeries({ color: '#3b82f6', lineWidth: 2, lineStyle: 2, crosshairMarkerVisible: false, lastValueVisible: true, priceLineVisible: false })
    vwmaSeries.setData(historyData.filter((d: any) => d.vwma > 0).map((d: any) => ({ time: d.time, value: d.vwma })))

    const aovSeries = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 2, priceScaleId: 'left' })
    chart.priceScale('left').applyOptions({ scaleMargins: { top: 0.62, bottom: 0.22 } })
    aovSeries.setData(historyData.map((d: any) => ({ time: d.time, value: d.aov_ratio })))
    aovSeries.createPriceLine({ price: 1.5, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '1.5x' })
    aovSeries.createPriceLine({ price: 0.6, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '0.6x' })

    const volSeries = chart.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'volume' } })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.67, bottom: 0.18 } })
    volSeries.setData(historyData.map((d: any) => ({ time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)' })))

    const foreignSeries = chart.addHistogramSeries({ priceScaleId: 'foreign' })
    chart.priceScale('foreign').applyOptions({ scaleMargins: { top: 0.86, bottom: 0.02 } })
    foreignSeries.setData(historyData.map((d: any) => ({ time: d.time, value: d.net_foreign, color: d.net_foreign >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)' })))

    const tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = 'position:absolute;display:none;padding:8px 12px;background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:8px;font-size:11px;color:hsl(var(--foreground));z-index:100;pointer-events:none;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);'
    chartContainerRef.current.appendChild(tooltipEl)

    const candleData = historyData.map((d: any) => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }))

    chart.subscribeCrosshairMove((param: any) => {
      if (!param.point || !param.time) { tooltipEl.style.display = 'none'; return }
      const data = param.seriesData.get(candleSeries) as any
      if (!data) { tooltipEl.style.display = 'none'; return }
      const idx = candleData.findIndex((d: any) => d.time === data.time)
      const prevClose = idx > 0 ? candleData[idx - 1].close : data.open
      const chgPct = prevClose > 0 ? ((data.close - prevClose) / prevClose) * 100 : 0
      const chgColor = chgPct >= 0 ? '#22c55e' : '#ef4444'
      tooltipEl.innerHTML = [
        `<div style="font-weight:700;margin-bottom:4px;">${data.time}</div>`,
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;">`,
        `<span style="color:#94a3b8">O</span><span style="text-align:right">${data.open.toLocaleString('id-ID')}</span>`,
        `<span style="color:#94a3b8">H</span><span style="text-align:right">${data.high.toLocaleString('id-ID')}</span>`,
        `<span style="color:#94a3b8">L</span><span style="text-align:right">${data.low.toLocaleString('id-ID')}</span>`,
        `<span style="color:#94a3b8">C</span><span style="text-align:right">${data.close.toLocaleString('id-ID')}</span>`,
        `</div>`,
        `<div style="margin-top:4px;text-align:right;font-weight:700;color:${chgColor}">${chgPct >= 0 ? '+' : ''}${chgPct.toFixed(2)}%</div>`,
      ].join('')
      const rect = chartContainerRef.current!.getBoundingClientRect()
      const x = param.point.x + 16
      const y = param.point.y - 10
      tooltipEl.style.display = 'block'
      tooltipEl.style.left = `${x}px`
      tooltipEl.style.top = `${y}px`
      if (x + 180 > rect.width) tooltipEl.style.left = `${param.point.x - 180}px`
    })

    chart.timeScale().fitContent()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: isFullscreen ? chartContainerRef.current.clientHeight : 600 })
      }
    }
    window.addEventListener('resize', handleResize)
    requestAnimationFrame(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: isFullscreen ? Math.max(400, chartContainerRef.current.clientHeight) : 600 })
      }
    })
    return () => { window.removeEventListener('resize', handleResize); chart.remove() }
  }, [historyData, chartReady, isFullscreen])

  if (!code) return <div className="glass rounded-2xl p-5 text-center text-muted-foreground border border-white/[0.06]">Pilih saham untuk melihat Chart</div>

  return (
    <div ref={chartWrapRef} className={`glass rounded-2xl p-4 border border-white/[0.06] relative group ${isFullscreen ? 'fixed inset-0 z-50 rounded-none bg-background flex flex-col' : ''}`}>
      <div className="relative z-10 flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.days} onClick={() => setPeriod(opt.days)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${period === opt.days ? 'bg-gold-400/20 text-gold-400' : 'text-muted-foreground hover:text-foreground'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-muted-foreground hover:text-gold-400 transition-colors">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex items-center gap-3 text-[9px] text-muted-foreground mb-2 flex-wrap relative z-10">
        <span className="text-blue-400">── VWMA 20</span>
        <span className="text-purple-400">── AOV Ratio</span>
        <span className="flex items-center gap-1"><span className="text-teal-400">──</span><span className="text-emerald-400/80">▌</span> Net Foreign</span>
        <span className="text-emerald-400">★ Whale</span>
        <span className="text-red-400">⚡ Low AOV</span>
        <span className="text-pink-400">◆ Anomaly</span>
      </div>
      {isFullscreen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
          <span className="text-[15vw] font-black text-foreground/[0.04] select-none uppercase tracking-tighter leading-none">{code}</span>
        </div>
      )}
      
      {isLoading ? (
        <div className="w-full h-[600px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="w-full h-[600px] flex flex-col items-center justify-center text-red-400">
          <AlertTriangle className="w-10 h-10 mb-2" />
          <p>Gagal memuat data chart</p>
        </div>
      ) : (
        <div ref={chartContainerRef} className={`w-full ${isFullscreen ? 'flex-1 min-h-0' : 'h-[600px]'}`} />
      )}
    </div>
  )
}
