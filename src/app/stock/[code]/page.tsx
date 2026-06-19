'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { formatRupiah, formatNumber, formatShares } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Activity, Clock,
  Target, DollarSign, PieChart as PieChartIcon, Building2,
  Globe, Shield, Maximize2, Minimize2, ExternalLink,
  Users, Loader2, AlertTriangle, BarChart as BarChartIcon, Eye, Key
} from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend as RechartLegend, ReferenceLine,
} from 'recharts'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────
const PERIOD_OPTIONS = [
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: '6M', days: 180 },
  { label: '1Y', days: 365 },
  { label: '2Y', days: 730 },
  { label: '3Y', days: 1095 },
]

const INVESTOR_TYPE_COLORS: Record<string, string> = {
  'Corporate': '#10b981', 'Individual': '#3b82f6',
  'Fund Manager': '#f59e0b', 'Financial Institutional': '#8b5cf6',
  'Insurance': '#ec4899', 'Pension Fund': '#06b6d4',
  'Securities': '#f97316', 'Others': '#6b7280',
}

function netColor(v: number) {
  if (v > 5)  return 'text-emerald-400'
  if (v > 0)  return 'text-emerald-300/70'
  if (v < -5) return 'text-red-400'
  if (v < 0)  return 'text-red-300/70'
  return 'text-slate-400'
}

function fmtFlow(v: number): string {
  const abs = Math.abs(v)
  const sign = v >= 0 ? '+' : '-'
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)} T`
  if (abs >= 1e9)  return `${sign}${(abs / 1e9).toFixed(1)} M`
  if (abs >= 1e6)  return `${sign}${(abs / 1e6).toFixed(0)}Jt`
  if (abs === 0)   return '0'
  return `${sign}${abs.toLocaleString('id-ID')}`
}

// ─── Scorecard helpers ──────────────────────────────────────────────────────
function tierCls(t: string): string {
  switch (t) {
    case 'STRONG_BUY': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
    case 'BUY':        return 'bg-green-500/15 text-green-400 border border-green-500/30'
    case 'ACCUMULATE': return 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
    case 'WATCH':      return 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
    default:           return 'bg-slate-500/10 text-muted-foreground border border-white/10'
  }
}
function ScoreBar({ label, v, max }: { label: string; v: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (Number(v || 0) / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground w-12 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full bg-gold-400/70" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] font-mono text-muted-foreground w-9 text-right">{Number(v || 0)}/{max}</span>
    </div>
  )
}
function ScoreKPI({ label, val, pos }: { label: string; val: string; pos?: boolean }) {
  const c = pos === undefined ? 'text-foreground' : pos ? 'text-emerald-400' : 'text-red-400'
  return (
    <div className="flex flex-col">
      <span className="text-[8px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`font-bold ${c}`}>{val}</span>
    </div>
  )
}

const TABS = [
  { id: 'overview',   label: 'Overview',   icon: Target },
  { id: 'broker',     label: 'Broker DNA', icon: Building2 },
  { id: 'ksei',       label: 'KSEI Intel', icon: TrendingUp },
  { id: 'insider',    label: 'Insider',    icon: Key },
  { id: 'ownership',  label: 'Ownership',  icon: Users },
  { id: 'technicals', label: 'Technicals', icon: BarChartIcon },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function StockDetailPage() {
  const params = useParams()
  const stockCode = (params?.code as string)?.toUpperCase() || ''

  const [period, setPeriod] = useState(365)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [stockData, setStockData] = useState<any>(null)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [smartMoneyIndex, setSmartMoneyIndex] = useState<any>(null)
  const [brokerData, setBrokerData] = useState<any[]>([])
  const [ownershipDetails, setOwnershipDetails] = useState<any[]>([])
  const [whaleMovement, setWhaleMovement] = useState<any[]>([])
  const [foreignDivergence, setForeignDivergence] = useState<any>(null)
  const [foreignFlowTrend, setForeignFlowTrend] = useState<any[]>([])
  const [concentrationIndex, setConcentrationIndex] = useState<any>(null)
  const [institutionalChange, setInstitutionalChange] = useState<any[]>([])
  const [stealthDivergence, setStealthDivergence] = useState<any>(null)
  const [brokerConsistency, setBrokerConsistency] = useState<any[]>([])
  const [volumeSpikes, setVolumeSpikes] = useState<any[]>([])
  const [whaleActivity, setWhaleActivity] = useState<any>(null)
  const [scorecard, setScorecard] = useState<any>(null)
  const [scVerdict, setScVerdict] = useState<any>(null)

  const [brokerRolling, setBrokerRolling] = useState<any>(null)
  const [brokerBuyers, setBrokerBuyers] = useState<any[]>([])
  const [brokerSellers, setBrokerSellers] = useState<any[]>([])
  const [kseiTrend, setKseiTrend] = useState<any[]>([])
  const [insiderFeed, setInsiderFeed] = useState<any[]>([])
  const [insiderScore, setInsiderScore] = useState<any>(null)
  const loadedTabs = useRef<Set<string>>(new Set())

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartWrapRef = useRef<HTMLDivElement>(null)
  const [chartReady, setChartReady] = useState(false)

  // ─── Load Lightweight Charts ───────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ((window as any).LightweightCharts) { setChartReady(true); return }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js'
    script.crossOrigin = 'anonymous' // COEP require-corp: load via CORS so the cross-origin script isn't blocked
    script.async = true
    script.onload = () => setChartReady(true)
    document.body.appendChild(script)
    return () => { script.remove() }
  }, [])

  // ─── Fullscreen ────────────────────────────────────────────────────────────
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

  // ─── Fetch Overview ────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async (code: string, days: number) => {
    if (!code) return
    setIsLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch(`/api/stock-detail?code=${code}&days=${days}`)
      const json = await res.json()
      if (!res.ok || json.error) { setErrorMsg(json.error || 'Failed'); return }

      setStockData(json.stockData)
      setSmartMoneyIndex(json.smartMoneyIndex)
      setScorecard(json.scorecard || null)
      setScVerdict(json.verdict || null)
      setForeignDivergence(json.foreignDivergence)
      setForeignFlowTrend(json.foreignFlowTrend || [])
      setConcentrationIndex(json.concentrationIndex || null)
      setInstitutionalChange(json.institutionalChange || [])
      setStealthDivergence(json.stealthDivergence || null)
      setBrokerConsistency(json.brokerConsistency || [])
      setVolumeSpikes(json.volumeSpikes || [])
      setWhaleActivity(json.whaleActivity || null)
      setBrokerData(json.brokerData || [])
      setOwnershipDetails((json.ownershipDetails || []).map((d: any) => ({
        investor_name: d.investor_name, investor_type: d.investor_type,
        local_foreign: d.local_foreign, percentage: Number(d.percentage),
        shares: Number(d.total_holding_shares || 0),
      })))
      setWhaleMovement(json.whaleMovement || [])
      setHistoryData((json.historyData || []).map((d: any) => ({
        time: String(d.trading_date).split('T')[0],
        open: Number(d.open_price) || Number(d.previous) || Number(d.close) || 0,
        high: Number(d.high) || Number(d.close) || 0,
        low: Number(d.low) || Number(d.close) || 0,
        close: Number(d.close) || 0,
        volume: Number(d.volume) || 0,
        net_foreign: Number(d.net_foreign_value) || 0,
        aov_ratio: Number(d.aov_ratio_ma20) || 1,
        vwma: Number(d.vwma_20d) || 0,
        whale_signal: !!d.whale_signal,
        big_player_anomaly: !!d.big_player_anomaly,
      })))
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed')
    } finally { setIsLoading(false) }
    loadedTabs.current.add('overview')
  }, [])

  // ─── Fetch chart only (decoupled from heavy package — period toggle is cheap) ──
  const fetchChart = useCallback(async (code: string, days: number) => {
    if (!code) return
    try {
      const res = await fetch(`/api/stock-detail?action=chart&code=${code}&days=${days}`)
      const json = await res.json()
      if (Array.isArray(json.data)) {
        const mapped = json.data
          .filter((d: any) => d && d.trading_date)
          .map((d: any) => ({
            time: String(d.trading_date).split('T')[0],
            open: Number(d.open_price) || Number(d.close) || 0,
            high: Number(d.high) || Number(d.close) || 0,
            low: Number(d.low) || Number(d.close) || 0,
            close: Number(d.close) || 0,
            volume: Number(d.volume) || 0,
            net_foreign: Number(d.net_foreign_value) || 0,
            aov_ratio: Number(d.aov_ratio_ma20) || 1,
            vwma: Number(d.vwma_20d) || 0,
            whale_signal: !!d.whale_signal,
            big_player_anomaly: !!d.big_player_anomaly,
          }))
          .filter((d: any) => /^\d{4}-\d{2}-\d{2}$/.test(d.time))
        if (mapped.length) setHistoryData(mapped)
      }
    } catch { /* keep last chart on error */ }
  }, [])

  // Heavy 14-query package loads ONCE per stock (no longer re-fires on period change)
  useEffect(() => {
    if (stockCode) fetchAllData(stockCode, period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockCode, fetchAllData])

  // Only the cheap chart query re-runs when the timeframe changes
  useEffect(() => {
    if (stockCode) fetchChart(stockCode, period)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockCode, period, fetchChart])

  // ─── Lazy-load tab data ────────────────────────────────────────────────────
  const loadTab = useCallback(async (tab: string) => {
    if (loadedTabs.current.has(tab)) return
    loadedTabs.current.add(tab)

    if (tab === 'broker') {
      const res = await fetch(`/api/radar?action=broker_breakdown&code=${stockCode}`)
      const json = await res.json().catch(() => ({}))
      setBrokerRolling(json.rolling)
      setBrokerBuyers(json.topBuyers || [])
      setBrokerSellers(json.topSellers || [])
    }
    if (tab === 'ksei') {
      const res = await fetch(`/api/ksei-monthly?action=stock_trend&code=${stockCode}`)
      const json = await res.json().catch(() => ({}))
      setKseiTrend(json.data || [])
    }
    if (tab === 'insider') {
      const [feedRes, insight] = await Promise.all([
        fetch(`/api/stock-detail?action=insider_signal&code=${stockCode}`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/stock-detail?action=conviction&code=${stockCode}`).then(r => r.json()).catch(() => ({})),
      ])
      setInsiderFeed(feedRes.alerts || [])
      setInsiderScore(feedRes.score || insight.data || null)
    }
  }, [stockCode])

  function handleTab(tab: string) {
    setActiveTab(tab)
    loadTab(tab)
  }

  // ─── Render Chart ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!chartReady || !chartContainerRef.current || !historyData.length || activeTab !== 'overview') return
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
    const cumulativeNF = historyData.map(d => { cumSum += d.net_foreign; return cumSum })
    const cnfMin = Math.min(...cumulativeNF)
    const cnfMax = Math.max(...cumulativeNF)
    const cnfRange = cnfMax - cnfMin || 1
    const pLow  = Math.min(...historyData.map(d => d.low).filter(v => v > 0))
    const pHigh = Math.max(...historyData.map(d => d.high).filter(v => v > 0))
    const pRange = pHigh - pLow || 1
    const targetLow  = pLow  + pRange * 0.15
    const targetHigh = pLow  + pRange * 0.65
    const nfLineData = historyData.map((d, i) => ({
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
    candleSeries.setData(historyData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close })))

    const markers: any[] = []
    historyData.forEach(d => {
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
    vwmaSeries.setData(historyData.filter(d => d.vwma > 0).map(d => ({ time: d.time, value: d.vwma })))

    const aovSeries = chart.addLineSeries({ color: '#8b5cf6', lineWidth: 2, priceScaleId: 'left' })
    chart.priceScale('left').applyOptions({ scaleMargins: { top: 0.62, bottom: 0.22 } })
    aovSeries.setData(historyData.map(d => ({ time: d.time, value: d.aov_ratio })))
    aovSeries.createPriceLine({ price: 1.5, color: '#22c55e', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '1.5x' })
    aovSeries.createPriceLine({ price: 0.6, color: '#ef4444', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '0.6x' })

    const volSeries = chart.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'volume' } })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.67, bottom: 0.18 } })
    volSeries.setData(historyData.map(d => ({ time: d.time, value: d.volume, color: d.close >= d.open ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)' })))

    const foreignSeries = chart.addHistogramSeries({ priceScaleId: 'foreign' })
    chart.priceScale('foreign').applyOptions({ scaleMargins: { top: 0.86, bottom: 0.02 } })
    foreignSeries.setData(historyData.map(d => ({ time: d.time, value: d.net_foreign, color: d.net_foreign >= 0 ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.8)' })))

    const tooltipEl = document.createElement('div')
    tooltipEl.style.cssText = 'position:absolute;display:none;padding:8px 12px;background:hsl(var(--card));border:1px solid hsl(var(--border));border-radius:8px;font-size:11px;color:hsl(var(--foreground));z-index:100;pointer-events:none;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);'
    chartContainerRef.current.appendChild(tooltipEl)

    const candleData = historyData.map(d => ({ time: d.time, open: d.open, high: d.high, low: d.low, close: d.close }))

    chart.subscribeCrosshairMove((param: any) => {
      if (!param.point || !param.time) { tooltipEl.style.display = 'none'; return }
      const data = param.seriesData.get(candleSeries) as any
      if (!data) { tooltipEl.style.display = 'none'; return }
      const idx = candleData.findIndex(d => d.time === data.time)
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
  }, [historyData, chartReady, isFullscreen, activeTab])

  // ─── Derived ───────────────────────────────────────────────────────────────
  const smiScore = smartMoneyIndex?.smart_money_score || 0
  const convictionScore = useMemo(() => {
    let s = smiScore
    if (stockData?.whale_signal) s = Math.min(100, s + 10)
    if ((stockData?.aov_ratio_ma20 || 1) >= 1.5) s = Math.min(100, s + 10)
    return Math.round(s)
  }, [smiScore, stockData])

  const verdict = useMemo(() => {
    let score = 0
    const reasons: string[] = []
    if (convictionScore >= 80) { score += 3; reasons.push('Conviction tinggi') }
    else if (convictionScore >= 60) { score += 1.5; reasons.push('Conviction moderat') }
    else reasons.push('Conviction rendah')
    if (smiScore >= 60) { score += 2; reasons.push('Smart Money positif') }
    else if (smiScore < 30) { score -= 1; reasons.push('Smart Money negatif') }
    const netF = stockData?.net_foreign_value || 0
    if (netF > 1e9) { score += 1.5; reasons.push('Foreign net buy besar') }
    else if (netF < -1e9) { score -= 1; reasons.push('Foreign net sell besar') }
    if ((stockData?.aov_ratio_ma20 || 1) >= 1.5) { score += 1; reasons.push('AOV spike (whale aktif)') }
    if (score >= 5) return { label: 'STRONG BUY', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', reasons }
    if (score >= 3) return { label: 'WATCH / ACCUMULATE', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', reasons }
    if (score >= 1) return { label: 'HOLD / MONITOR', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', reasons }
    return { label: 'AVOID / REDUCE', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', reasons }
  }, [convictionScore, smiScore, stockData])

  const ownershipPieData = useMemo(() => {
    if (!ownershipDetails.length) return []
    const groupMap: Record<string, { totalPct: number; totalShares: number; count: number }> = {}
    ownershipDetails.forEach((d: any) => {
      const type = d.investor_type || 'Others'
      if (!groupMap[type]) groupMap[type] = { totalPct: 0, totalShares: 0, count: 0 }
      groupMap[type].totalPct += d.percentage
      groupMap[type].totalShares += d.shares
      groupMap[type].count += 1
    })
    return Object.entries(groupMap).map(([name, data]) => ({ name, value: data.totalPct, shares: data.totalShares, count: data.count }))
  }, [ownershipDetails])

  // ─── Foreign Flow derived — multi-period & mini chart ─────────────────────
  // foreignFlowTrend is ASC (oldest → newest)
  const flow7d  = useMemo(() => foreignFlowTrend.slice(-7).reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const flow30d = useMemo(() => foreignFlowTrend.slice(-30).reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const flow60d = useMemo(() => foreignFlowTrend.reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0), [foreignFlowTrend])
  const latestTrend = useMemo(() => foreignFlowTrend.length ? foreignFlowTrend[foreignFlowTrend.length - 1] : null, [foreignFlowTrend])
  const miniFlowData = useMemo(() =>
    foreignFlowTrend.slice(-30).map((d: any) => ({
      date: String(d.trading_date).slice(5),
      net: Number(d.net_foreign_value),
    })), [foreignFlowTrend])

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="sidebar-offset flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
      <p className="ml-3 text-gold-400 font-bold tracking-tight">Loading {stockCode}…</p>
    </div>
  )
  if (errorMsg) return (
    <div className="sidebar-offset glass rounded-2xl p-12 text-center border border-red-500/20">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="text-red-400 font-medium">{errorMsg}</p>
    </div>
  )
  if (!stockData) return null

  const publicShares  = (stockData.tradeable_shares || 0) * ((stockData.free_float || 0) / 100)
  const floatCap      = publicShares * stockData.close
  const dailyTurnover = publicShares > 0 ? ((stockData.volume || 0) / publicShares) * 100 : 0
  const marketCap     = (stockData.tradeable_shares || 0) * stockData.close

  return (
    <div className="sidebar-offset space-y-4 pb-12 animate-fade-in">

      {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
      <div className="glass rounded-2xl p-4 lg:p-5 border border-white/[0.06] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-amber-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row gap-4 justify-between items-stretch">
          {/* Price block */}
          <div className="flex flex-col justify-center min-w-fit">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl lg:text-4xl font-black font-mono tracking-tight gradient-gold">{stockCode}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground border border-white/[0.08] text-[10px] font-bold uppercase tracking-wider">{stockData.sector || 'Stock'}</span>
            </div>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-4xl lg:text-5xl font-black tracking-tighter">{formatRupiah(stockData.close)}</span>
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-sm lg:text-base ${stockData.change_percent >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {stockData.change_percent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(stockData.change_percent).toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 font-medium flex gap-2 lg:gap-3 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/[0.06] w-fit">
              <span>H: <span className="text-foreground/80">{formatNumber(stockData.high)}</span></span>
              <span>L: <span className="text-foreground/80">{formatNumber(stockData.low)}</span></span>
              <span>O: <span className="text-foreground/80">{formatNumber(stockData.open_price)}</span></span>
              <span className="opacity-30">|</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {String(stockData.trading_date).split('T')[0]}</span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 xl:max-w-[400px]">
            {[
              { l: 'Market Cap', v: formatRupiah(marketCap),           c: 'text-purple-400' },
              { l: 'Float Cap',  v: formatRupiah(floatCap),            c: 'text-purple-400' },
              { l: 'Public Shr', v: formatShares(publicShares),        c: 'text-cyan-400'   },
              { l: 'Volume',     v: formatShares(stockData.volume),    c: 'text-orange-400' },
              { l: 'Value',      v: formatRupiah(stockData.value),     c: 'text-blue-400'   },
            ].map((m, i) => (
              <div key={i} className="metric-card p-2.5 rounded-xl flex flex-col justify-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1 font-medium">{m.l}</p>
                <p className={`text-sm font-black ${m.c} tracking-tight`}>{m.v}</p>
              </div>
            ))}
          </div>

          {/* Verdict panel */}
          <div className={`rounded-2xl p-3.5 ${verdict.bg} border ${verdict.border} xl:min-w-[200px] xl:max-w-[230px] flex flex-col justify-center relative overflow-hidden shrink-0`}>
            <div className="absolute -right-4 -bottom-4 opacity-[0.04]"><Shield className="w-24 h-24" /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-2">
                <Shield className={`w-3.5 h-3.5 ${verdict.color}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Verdict</span>
              </div>
              <p className={`text-lg font-black ${verdict.color} mb-2 tracking-tight`}>{verdict.label}</p>
              <div className="space-y-1">
                {verdict.reasons.map((r, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-black/10 px-1.5 py-1 rounded">
                    <span className={`text-[9px] ${verdict.color} shrink-0`}>◆</span>
                    <p className="text-[10px] text-foreground/80 font-medium leading-tight">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom KPI strip */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3 pt-3 border-t border-white/[0.05]">
          {[
            { l: 'Conviction',   v: `${convictionScore}`,                           c: convictionScore >= 80 ? 'text-emerald-400' : convictionScore >= 60 ? 'text-amber-400' : 'text-red-400' },
            { l: 'Smart Money',  v: `${Math.round(smiScore)}`,                      c: smiScore >= 60 ? 'text-emerald-400' : smiScore >= 30 ? 'text-amber-400' : 'text-red-400' },
            { l: 'Foreign Flow', v: formatRupiah(stockData.net_foreign_value),      c: stockData.net_foreign_value >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { l: 'AOV Ratio',    v: `${(stockData.aov_ratio_ma20||1).toFixed(2)}x`, c: stockData.aov_ratio_ma20 >= 1.5 ? 'text-purple-400' : 'text-muted-foreground' },
            { l: 'Turnover',     v: `${dailyTurnover.toFixed(2)}%`,                 c: dailyTurnover > 5 ? 'text-emerald-400' : dailyTurnover < 1 ? 'text-red-400' : 'text-amber-400' },
            { l: 'Free Float',   v: `${stockData.free_float?.toFixed(1)||'--'}%`,   c: 'text-blue-400' },
          ].map((m, i) => (
            <div key={i} className="py-1.5 px-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
              <p className="text-[8px] text-muted-foreground uppercase tracking-wider mb-0.5">{m.l}</p>
              <p className={`text-sm font-black ${m.c}`}>{m.v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ══ TABS ════════════════════════════════════════════════════════════ */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => handleTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs border transition-all whitespace-nowrap font-bold ${activeTab === t.id ? 'bg-gold-400/20 text-gold-400 border-gold-400/40' : 'glass border-white/[0.06] text-muted-foreground hover:text-foreground hover:border-white/[0.12]'}`}>
              <Icon size={13} />{t.label}
            </button>
          )
        })}
      </div>

      {/* ══ TAB: Overview ═══════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* ── Diagnostic Scorecard v2 ─────────────────────────────────────── */}
          {(scorecard || scVerdict) && (
            <div className="glass rounded-2xl p-4 border border-white/[0.06]">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Verdict (auto-generated) */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{scVerdict?.emoji}</span>
                    <h3 className="font-black text-sm">{scVerdict?.headline}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{scVerdict?.detail}</p>
                  {scorecard && (
                    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-[11px]">
                      <ScoreKPI label="Return 5D"   val={`${Number(scorecard.return_5d ?? 0).toFixed(1)}%`}        pos={Number(scorecard.return_5d) >= 0} />
                      <ScoreKPI label="Return 20D"  val={`${Number(scorecard.return_20d ?? 0).toFixed(1)}%`}       pos={Number(scorecard.return_20d) >= 0} />
                      <ScoreKPI label="AOV"         val={`${Number(scorecard.aov_ratio_ma20 ?? 0).toFixed(2)}x`} />
                      <ScoreKPI label="Foreign 20D" val={`${Number(scorecard.foreign_20d_miliar ?? 0).toFixed(1)} M`} pos={Number(scorecard.foreign_20d_miliar) >= 0} />
                      <ScoreKPI label="Rank v2"     val={`#${scorecard.rank_overall ?? '—'}`} />
                    </div>
                  )}
                </div>
                {/* Score + tier + breakdown */}
                {scorecard && (
                  <div className="lg:w-72 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-white/[0.06] lg:pl-4 pt-3 lg:pt-0">
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Composite v2</div>
                        <div className="text-2xl font-black leading-none">{scorecard.v2_score ?? 0}<span className="text-xs text-muted-foreground font-bold">/73</span></div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${tierCls(scorecard.tier_v2)}`}>{scorecard.tier_v2}</span>
                    </div>
                    <div className="space-y-1">
                      <ScoreBar label="AOV"     v={scorecard.aov_pts}     max={40} />
                      <ScoreBar label="VWMA"    v={scorecard.vwma_pts}    max={15} />
                      <ScoreBar label="Whale"   v={scorecard.whale_pts}   max={12} />
                      <ScoreBar label="Foreign" v={scorecard.foreign_pts} max={6} />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-2">
                      v1: {scorecard.v1_tier} ({scorecard.v1_score}) · flow: {scorecard.flow_context}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Chart */}
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
                <span className="text-[15vw] font-black text-foreground/[0.04] select-none uppercase tracking-tighter leading-none">{stockCode}</span>
              </div>
            )}
            <div ref={chartContainerRef} className={`w-full ${isFullscreen ? 'flex-1 min-h-0' : 'h-[600px]'}`} />
          </div>

          {/* 3 Signal Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Smart Money Index */}
            <div className="glass rounded-2xl p-4 border border-white/[0.06] card-hover">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-400" />
                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Smart Money Index</h3>
              </div>
              {smartMoneyIndex ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: 'Score',      v: Math.round(smiScore),                         c: smiScore >= 60 ? 'text-emerald-400' : smiScore >= 30 ? 'text-amber-400' : 'text-red-400' },
                      { l: 'Conviction', v: convictionScore,                               c: convictionScore >= 60 ? 'text-blue-400' : 'text-muted-foreground' },
                      { l: 'Broker Net', v: formatRupiah(smartMoneyIndex.broker_net || 0), c: (smartMoneyIndex.broker_net || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                      { l: 'Foreign 30D',v: formatRupiah(smartMoneyIndex.foreign_30d || 0),c: (smartMoneyIndex.foreign_30d || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                    ].map((m, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <p className="text-[8px] text-muted-foreground uppercase">{m.l}</p>
                        <p className={`text-xs font-black ${m.c}`}>{m.v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-muted-foreground font-mono leading-relaxed">{smartMoneyIndex.signal || '--'}</p>
                </div>
              ) : <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
            </div>

            {/* Broker Activity */}
            <div className="glass rounded-2xl p-4 border border-white/[0.06] card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Broker Activity</h3>
                </div>
                <Link href={`/broker-tracker?code=${stockCode}`} prefetch={false}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold hover:bg-blue-500/20 transition-all">
                  <ExternalLink className="w-3 h-3" /> Full
                </Link>
              </div>
              {brokerData.length > 0 ? (
                <div className="space-y-1.5">
                  {brokerData.map((b: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-foreground truncate">{b.kode_broker}</p>
                        <p className="text-[8px] text-muted-foreground truncate max-w-[120px]">{b.nama_broker}</p>
                      </div>
                      <span className={`text-[10px] font-black shrink-0 ml-2 ${Number(b.net_value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatRupiah(Number(b.net_value))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                  <Building2 className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-xs text-foreground font-medium">No Broker Data</p>
                </div>
              )}
            </div>

            {/* Foreign Flow — multi-period + mini chart */}
            <div className="glass rounded-2xl p-4 border border-white/[0.06] card-hover flex flex-col">
              {/* Header + toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-teal-400" />
                  <h3 className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Foreign Flow</h3>
                </div>
                <Link
                  href={`/foreign-flow?action=stock_chart&code=${stockCode}`}
                  prefetch={false}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/25 text-teal-400 text-[9px] font-bold hover:bg-teal-500/20 transition-all"
                >
                  <ExternalLink className="w-3 h-3" /> Intelligence
                </Link>
              </div>

              {foreignDivergence ? (
                <div className="space-y-2.5 flex-1">
                  {/* Divergence badge */}
                  <div className={`px-3 py-2 rounded-xl text-[11px] font-black text-center border ${
                    foreignDivergence.divergence_type?.includes('STEALTH') || foreignDivergence.divergence_type?.includes('BULLISH')
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : foreignDivergence.divergence_type?.includes('BEARISH') || foreignDivergence.divergence_type?.includes('DISTRIBUTION')
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-white/[0.03] text-muted-foreground border-white/[0.06]'
                  }`}>
                    {foreignDivergence.divergence_type || 'NEUTRAL'}
                  </div>

                  {/* Multi-period net foreign — 1D / 7D / 30D / 60D */}
                  <div className="grid grid-cols-4 gap-1">
                    {([
                      { l: '1D',  v: stockData.net_foreign_value },
                      { l: '7D',  v: flow7d  },
                      { l: '30D', v: flow30d },
                      { l: '60D', v: flow60d },
                    ] as { l: string; v: number }[]).map(({ l, v }) => (
                      <div key={l} className="text-center py-1.5 px-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                        <div className="text-[8px] text-muted-foreground uppercase mb-0.5">{l}</div>
                        <div className={`text-[10px] font-black leading-none ${v >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fmtFlow(v)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mini 30-day bar sparkline */}
                  {miniFlowData.length > 0 && (
                    <div className="h-[56px] -mx-0.5">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={miniFlowData} barCategoryGap="10%" margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                          <Bar dataKey="net" radius={[1, 1, 0, 0]}>
                            {miniFlowData.map((d, i) => (
                              <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#ef4444'} opacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Trend + signal row */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-muted-foreground block text-[8px] mb-0.5">TREND 60D</span>
                      <span className={`font-bold ${
                        latestTrend?.trend?.includes('ACCUMULATION') ? 'text-emerald-400' :
                        latestTrend?.trend?.includes('DISTRIBUTION') ? 'text-red-400' : 'text-muted-foreground'
                      }`}>{String(latestTrend?.trend || 'NEUTRAL').replace(/_/g, ' ')}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-muted-foreground block text-[8px] mb-0.5">SIGNAL</span>
                      <span className={`font-bold ${
                        foreignDivergence.signal_strength === 'STRONG' ? 'text-emerald-400' :
                        foreignDivergence.signal_strength === 'MODERATE' ? 'text-amber-400' : 'text-muted-foreground'
                      }`}>{foreignDivergence.signal_strength || 'WEAK'}</span>
                    </div>
                  </div>

                  {/* MA direction — accumulation vs distribution */}
                  {latestTrend && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[9px]">
                      <span className="text-muted-foreground">MA5 vs MA20</span>
                      <span className={`font-black ${Number(latestTrend.flow_ma5) >= Number(latestTrend.flow_ma20) ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Number(latestTrend.flow_ma5) >= Number(latestTrend.flow_ma20) ? '↑ Accumulation' : '↓ Distribution'}
                      </span>
                    </div>
                  )}

                  {/* Price vs Foreign divergence */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[9px]">
                    <span className="text-muted-foreground">Harga 1D</span>
                    <span className={`font-bold ${(foreignDivergence.price_chg_pct || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Number(foreignDivergence.price_chg_pct || 0) >= 0 ? '+' : ''}{Number(foreignDivergence.price_chg_pct || 0).toFixed(2)}%
                      <span className="text-muted-foreground font-normal ml-1">vs Foreign {stockData.net_foreign_value >= 0 ? '↑' : '↓'}</span>
                    </span>
                  </div>

                  {/* Interpretation */}
                  {foreignDivergence.interpretation && (
                    <div className="p-2.5 rounded-lg bg-teal-500/[0.05] border border-teal-500/[0.12]">
                      <p className="text-[10px] text-teal-200/80 leading-relaxed flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5">💡</span>
                        <span>{foreignDivergence.interpretation}</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 opacity-50 flex-1">
                  <Globe className="w-5 h-5 text-teal-400 mb-2" />
                  <p className="text-xs text-foreground font-medium">No Foreign Data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: Broker DNA ══════════════════════════════════════════════════ */}
      {activeTab === 'broker' && (
        <div className="space-y-4">
          {brokerRolling ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { label: 'Foreign Broker', net1d: brokerRolling.fg_1d,     net7d: brokerRolling.fg_7d,   net30d: brokerRolling.fg_30d   },
                  { label: 'Local Inst',     net1d: brokerRolling.inst_1d,   net7d: brokerRolling.inst_7d, net30d: brokerRolling.inst_30d },
                  { label: 'Retail',         net1d: brokerRolling.retail_1d, net7d: brokerRolling.retail_7d, net30d: null                 },
                ].map(c => (
                  <div key={c.label} className="glass rounded-xl p-3 border border-white/[0.06]">
                    <div className="text-xs text-muted-foreground mb-2 font-bold">{c.label}</div>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      {[{l:'1D',v:c.net1d},{l:'7D',v:c.net7d},{l:'30D',v:c.net30d}].map(p => (
                        <div key={p.l}>
                          <div className={`text-sm font-semibold ${p.v != null ? netColor(Number(p.v)) : 'text-muted-foreground'}`}>
                            {p.v != null ? `${Number(p.v) >= 0 ? '+' : ''}${Number(p.v).toFixed(1)} M` : '—'}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{p.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {brokerRolling.prime_7d != null && (
                <div className={`p-3 rounded-xl border text-sm ${Number(brokerRolling.prime_7d) > 0 ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'glass border-white/[0.06] text-muted-foreground'}`}>
                  ⭐ Prime Broker Net 7d (JP Morgan, UBS, CLSA, HSBC, Macquarie):
                  <span className={`ml-2 font-semibold ${netColor(Number(brokerRolling.prime_7d))}`}>
                    {Number(brokerRolling.prime_7d) >= 0 ? '+' : ''}{Number(brokerRolling.prime_7d).toFixed(2)} M
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="h-24 shimmer rounded-xl" />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-xs font-bold text-emerald-400">Top Buyers (7D)</div>
              <table className="w-full text-xs">
                <tbody>
                  {brokerBuyers.map((b) => (
                    <tr key={b.broker_code} className="border-b border-white/[0.03] tr-hover">
                      <td className="px-3 py-2">
                        <div className="font-mono font-semibold">{b.broker_code}</div>
                        <div className="text-muted-foreground">{b.broker_name?.slice(0,25)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${b.category==='FOREIGN'?'bg-sky-500/20 text-sky-300':b.category==='LOCAL_INST'?'bg-emerald-500/20 text-emerald-300':'bg-white/[0.05] text-muted-foreground'}`}>
                          {b.category?.split('_').pop()}
                        </span>
                        {b.is_prime && <span className="ml-1 text-amber-400">⭐</span>}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-400 font-semibold">+{Number(b.net_miliar).toFixed(2)} M</td>
                    </tr>
                  ))}
                  {brokerBuyers.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="glass rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-xs font-bold text-red-400">Top Sellers (7D)</div>
              <table className="w-full text-xs">
                <tbody>
                  {brokerSellers.map((b) => (
                    <tr key={b.broker_code} className="border-b border-white/[0.03] tr-hover">
                      <td className="px-3 py-2">
                        <div className="font-mono font-semibold">{b.broker_code}</div>
                        <div className="text-muted-foreground">{b.broker_name?.slice(0,25)}</div>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded ${b.category==='FOREIGN'?'bg-sky-500/20 text-sky-300':b.category==='LOCAL_INST'?'bg-emerald-500/20 text-emerald-300':'bg-white/[0.05] text-muted-foreground'}`}>
                          {b.category?.split('_').pop()}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-red-400 font-semibold">{Number(b.net_miliar).toFixed(2)} M</td>
                    </tr>
                  ))}
                  {brokerSellers.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">—</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: KSEI Intel ══════════════════════════════════════════════════ */}
      {activeTab === 'ksei' && (
        <div className="space-y-4">
          {kseiTrend.length === 0 ? (
            <div className="h-48 shimmer rounded-xl" />
          ) : (
            <>
              <div className="glass rounded-2xl border border-white/[0.06] p-4">
                <div className="text-sm font-bold mb-3">Net Smart Money Bulanan (CP+PF+IB) — 12 bulan</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={kseiTrend} margin={{top:4,bottom:4,left:0,right:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)"/>
                    <XAxis dataKey="month" tickFormatter={v=>v?.slice(2,7)} tick={{fontSize:9}}/>
                    <YAxis tick={{fontSize:9}}/>
                    <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:8,fontSize:11}}
                      formatter={(v: number)=>[`${Number(v).toFixed(2)} M`]}/>
                    <Bar dataKey="net_smart" name="Net Smart">
                      {kseiTrend.map((e,i)=><Cell key={i} fill={Number(e.net_smart)>=0?'#10b981':'#ef4444'}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass rounded-2xl border border-white/[0.06] p-4">
                  <div className="text-sm font-bold mb-3">Breakdown Institusi Bulan Terakhir</div>
                  {kseiTrend.slice(-1).map(d => (
                    <div key={d.month} className="space-y-2">
                      {[
                        {l:'Corporate (CP)',      v: d.cp_flow},
                        {l:'Pension Fund (PF)',   v: d.pf_flow},
                        {l:'Investment Bank (IB)',v: d.ib_flow},
                        {l:'Retail (ID)',         v: d.retail},
                        {l:'Foreign Smart',       v: d.foreign_smart},
                      ].map(item => (
                        <div key={item.l} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.04] last:border-0">
                          <span className="text-muted-foreground">{item.l}</span>
                          <span className={`font-bold ${Number(item.v)>=0?'text-emerald-400':'text-red-400'}`}>
                            {Number(item.v)>=0?'+':''}{Number(item.v||0).toFixed(2)} M
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="glass rounded-2xl border border-white/[0.06] p-4">
                  <div className="text-sm font-bold mb-3">Trend Retail vs Smart 3 Bulan</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={kseiTrend.slice(-6)} margin={{top:4,bottom:4,left:0,right:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)"/>
                      <XAxis dataKey="month" tickFormatter={v=>v?.slice(2,7)} tick={{fontSize:9}}/>
                      <YAxis tick={{fontSize:9}}/>
                      <Tooltip contentStyle={{backgroundColor:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:8,fontSize:11}}/>
                      <Line dataKey="net_smart" name="Smart Money" stroke="#10b981" strokeWidth={2} dot={false}/>
                      <Line dataKey="retail" name="Retail" stroke="#f59e0b" strokeWidth={1.5} dot={false}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ TAB: Insider ═════════════════════════════════════════════════════ */}
      {activeTab === 'insider' && (
        <div className="space-y-4">
          {insiderScore && (
            <div className="grid grid-cols-3 gap-3">
              {[
                {l:'Conviction Score', v: insiderScore.conviction_score, c: Number(insiderScore.conviction_score)>=15?'text-emerald-400':Number(insiderScore.conviction_score)<0?'text-red-400':'text-amber-400'},
                {l:'Internal Buy',     v: insiderScore.internal_buy,     c: 'text-emerald-400'},
                {l:'Internal Sell',    v: insiderScore.internal_sell,    c: 'text-red-400'},
              ].map(k => (
                <div key={k.l} className="glass rounded-xl p-3 border border-white/[0.06] text-center metric-card">
                  <div className={`text-2xl font-black ${k.c}`}>{k.v}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.l}</div>
                </div>
              ))}
            </div>
          )}
          <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="px-3 py-2.5 border-b border-white/[0.05] bg-white/[0.02] text-xs font-bold text-gold-400">Transaksi Insider (Komisaris/Direksi/Pengendali)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Tanggal</th>
                    <th className="text-left px-3 py-2">Nama</th>
                    <th className="text-left px-3 py-2">Role</th>
                    <th className="text-center px-3 py-2">Aksi</th>
                    <th className="text-right px-3 py-2">% Change</th>
                    <th className="text-right px-3 py-2 hidden md:table-cell">Nilai Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {insiderFeed.length === 0 ? (
                    <tr><td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">Belum ada data insider untuk saham ini</td></tr>
                  ) : insiderFeed.map((ins, i:number) => (
                    <tr key={i} className="border-b border-white/[0.03] tr-hover transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{ins.report_date?.slice(0,10)}</td>
                      <td className="px-3 py-2 truncate max-w-[140px] font-medium">{ins.investor_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{ins.investor_type}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${ins.action==='BUYING'?'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20':'bg-red-500/20 text-red-300 border border-red-500/20'}`}>{ins.action}</span>
                      </td>
                      <td className={`px-3 py-2 text-right font-bold ${Number(ins.pct_point_change||ins.pct_chg)>=0?'text-emerald-400':'text-red-400'}`}>
                        {Number(ins.pct_point_change||ins.pct_chg)>=0?'+':''}{Number(ins.pct_point_change||ins.pct_chg).toFixed(3)}%
                      </td>
                      <td className="px-3 py-2 text-right hidden md:table-cell text-muted-foreground">
                        {ins.est_value_miliar ? `${Number(ins.est_value_miliar).toFixed(2)} M` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB: Ownership ═══════════════════════════════════════════════════ */}
      {activeTab === 'ownership' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-black uppercase tracking-widest">Ownership Structure</h2>
              <span className="text-[9px] text-muted-foreground/40 hidden sm:inline">· KSEI Scripless</span>
            </div>
            {ownershipPieData.length > 0 ? (
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-2/5 flex flex-col items-center">
                  <div className="w-64 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={ownershipPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} stroke="none">
                          {ownershipPieData.map((entry, i) => <Cell key={i} fill={INVESTOR_TYPE_COLORS[entry.name] || '#6b7280'} />)}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            borderColor: 'rgba(255,255,255,0.08)',
                            borderRadius: 10,
                            fontSize: 11,
                            color: 'hsl(var(--foreground))',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                          formatter={(v: any, n: any) => [`${Number(v).toFixed(1)}%`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2 justify-center">
                    {ownershipPieData.map((entry, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[9px]">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: INVESTOR_TYPE_COLORS[entry.name] || '#6b7280' }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                        <span className="font-bold text-foreground">{entry.value.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="text-[9px] text-muted-foreground uppercase border-b border-white/[0.05]">
                      <th className="p-2 text-left">Investor</th><th className="p-2 text-left">Type</th>
                      <th className="p-2 text-center">L/F</th><th className="p-2 text-right">%</th><th className="p-2 text-right">Shares</th>
                    </tr></thead>
                    <tbody>
                      {ownershipDetails.map((d: any, i: number) => (
                        <tr key={i} className="border-b border-white/[0.03] tr-hover">
                          <td className="p-2 font-bold text-[10px] text-foreground truncate max-w-[120px]">{d.investor_name}</td>
                          <td className="p-2 text-[10px] text-muted-foreground">{d.investor_type}</td>
                          <td className="p-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${d.local_foreign==='FOREIGN'||d.local_foreign==='F'?'bg-blue-500/10 text-blue-400 border border-blue-500/20':'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                              {d.local_foreign==='FOREIGN'||d.local_foreign==='F'?'Foreign':'Local'}
                            </span>
                          </td>
                          <td className="p-2 text-right font-black">{d.percentage.toFixed(2)}%</td>
                          <td className="p-2 text-right text-muted-foreground">{formatShares(d.shares)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 opacity-60">
                <PieChartIcon className="w-8 h-8 text-purple-400 mb-4" />
                <p className="text-sm font-bold">No Ownership Data</p>
              </div>
            )}
          </div>

          {whaleMovement.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-widest">Whale Position Tracking</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="text-[9px] text-muted-foreground uppercase border-b border-white/[0.05]">
                    <th className="p-2 text-left">Investor</th><th className="p-2 text-center">Type</th>
                    <th className="p-2 text-right">%</th><th className="p-2 text-right">Shares</th>
                    <th className="p-2 text-center">Trend</th><th className="p-2 text-center">Verdict</th>
                  </tr></thead>
                  <tbody>
                    {whaleMovement.map((w: any, i: number) => (
                      <tr key={i} className="border-b border-white/[0.03] tr-hover">
                        <td className="p-2 font-bold text-[10px]">{w.investor_name}</td>
                        <td className="p-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${w.local_foreign==='F'?'bg-blue-500/10 text-blue-400':'bg-emerald-500/10 text-emerald-400'}`}>{w.local_foreign==='F'?'FOREIGN':'LOCAL'}</span></td>
                        <td className="p-2 text-right font-black">{Number(w.latest_percentage).toFixed(2)}%</td>
                        <td className="p-2 text-right text-muted-foreground">{formatShares(w.latest_shares)}</td>
                        <td className="p-2 text-center"><span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${w.position_trend==='INCREASING'?'bg-emerald-500/10 text-emerald-400':w.position_trend==='DECREASING'?'bg-red-500/10 text-red-400':'bg-blue-500/10 text-blue-400'}`}>{w.position_trend}</span></td>
                        <td className="p-2 text-center text-[9px] font-bold text-purple-400">{w.whale_verdict}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(concentrationIndex || institutionalChange.length > 0) && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-widest">Concentration & Institutional</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {concentrationIndex && (
                  <div>
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Concentration Index</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: 'HHI Score', v: Number(concentrationIndex.hhi_score)?.toFixed(0) || '--',          c: 'text-purple-400' },
                        { l: 'Top 5 %',   v: `${Number(concentrationIndex.top5_pct)?.toFixed(1) || '--'}%`,     c: 'text-purple-400' },
                        { l: 'Top 10 %',  v: `${Number(concentrationIndex.top10_pct)?.toFixed(1) || '--'}%`,    c: 'text-blue-400'   },
                        { l: 'Investors', v: concentrationIndex.total_investor_count || '--',                    c: 'text-cyan-400'   },
                      ].map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                          <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                          <p className={`text-sm font-black mt-1 ${m.c}`}>{m.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center">
                      <span className="text-[10px] font-bold">{concentrationIndex.concentration_label}</span>
                    </div>
                  </div>
                )}
                {institutionalChange.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">Institutional Changes</h4>
                    <div className="flex gap-3 mb-3 text-[9px]">
                      <span className="text-emerald-400 font-bold">{institutionalChange.filter((i: any) => i.action==='BUYING').length} buying</span>
                      <span className="text-red-400 font-bold">{institutionalChange.filter((i: any) => i.action==='SELLING').length} selling</span>
                    </div>
                    <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                      {institutionalChange.slice(0, 15).map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.04]">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold truncate">{item.investor_name}</p>
                            <p className="text-[8px] text-muted-foreground">{String(item.report_date).slice(0, 10)}</p>
                          </div>
                          <span className={`text-[9px] font-black ml-2 shrink-0 px-1.5 py-0.5 rounded ${item.action==='BUYING'?'bg-emerald-500/15 text-emerald-400':item.action==='SELLING'?'bg-red-500/15 text-red-400':'bg-slate-500/15 text-slate-400'}`}>
                            {Number(item.pct_point_change)>=0?'+':''}{Number(item.pct_point_change)?.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: Technicals ══════════════════════════════════════════════════ */}
      {activeTab === 'technicals' && (
        <div className="space-y-4">
          {(volumeSpikes.length > 0 || whaleActivity) && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-orange-400" />
                <h2 className="text-sm font-black uppercase tracking-widest">Volume & Whale Activity</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {whaleActivity && (
                  <div>
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">
                      Whale Footprint <span className="text-[8px] text-muted-foreground/50 ml-2">{whaleActivity.total_days} days</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { l: 'Whale Days',    v: `${whaleActivity.whale_days}/${whaleActivity.total_days}`, c: 'text-blue-400',   sub: `${(Number(whaleActivity.whale_pct)||0).toFixed(0)}%` },
                        { l: 'Anomaly Days',  v: `${whaleActivity.anomaly_days}`,                           c: 'text-pink-400',   sub: 'Big Player' },
                        { l: 'Total Foreign', v: formatRupiah(Number(whaleActivity.total_foreign)),         c: whaleActivity.total_foreign>=0?'text-emerald-400':'text-red-400', sub: '' },
                        { l: 'Avg Price',     v: formatRupiah(Number(whaleActivity.avg_price)),             c: 'text-purple-400', sub: `AOV: ${Number(whaleActivity.avg_aov_ratio).toFixed(2)}x` },
                      ].map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                          <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                          <p className={`text-sm font-black mt-1 ${m.c}`}>{m.v}</p>
                          {m.sub && <p className="text-[8px] text-muted-foreground mt-0.5">{m.sub}</p>}
                        </div>
                      ))}
                    </div>
                    {Number(whaleActivity.whale_pct) > 30 && (
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[10px] text-blue-300/80">
                        High whale presence ({Number(whaleActivity.whale_pct).toFixed(0)}% of days). Institutional footprints suggest active positioning.
                      </div>
                    )}
                  </div>
                )}
                {volumeSpikes.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Recent Volume Spikes</h4>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {volumeSpikes.map((s: any, i: number) => {
                        const isBull = Number(s.change_percent) >= 0
                        return (
                          <div key={i} className={`flex items-center justify-between p-2.5 rounded-lg border ${s.spike_type==='WHALE_VOLUME_SPIKE'?'bg-blue-500/[0.05] border-blue-500/[0.12]':s.spike_type==='BREAKOUT_VOLUME'?'bg-emerald-500/[0.05] border-emerald-500/[0.12]':'bg-white/[0.02] border-white/[0.06]'}`}>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground font-mono">{String(s.trading_date).slice(0,10)}</span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${s.spike_type==='WHALE_VOLUME_SPIKE'?'bg-blue-500/15 text-blue-400':s.spike_type==='BREAKOUT_VOLUME'?'bg-emerald-500/15 text-emerald-400':'bg-slate-500/15 text-slate-400'}`}>{s.spike_type?.replace(/_/g,' ')}</span>
                              </div>
                              <p className="text-[11px] font-medium mt-0.5">Vol {formatShares(s.volume)} · Ratio {Number(s.volume_ratio).toFixed(1)}x</p>
                            </div>
                            <div className="text-right shrink-0 ml-2">
                              <p className={`text-[10px] font-black ${isBull?'text-emerald-400':'text-red-400'}`}>{isBull?'+':''}{Number(s.change_percent).toFixed(2)}%</p>
                              <p className="text-[8px] text-muted-foreground">@{formatRupiah(s.close)}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {foreignFlowTrend.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <BarChartIcon className="w-4 h-4 text-teal-400" />
                <h2 className="text-sm font-black uppercase tracking-widest">Foreign Flow Trend</h2>
              </div>
              {(() => {
                const chartData = [...foreignFlowTrend].reverse().map((d: any) => ({
                  date: String(d.trading_date).slice(5),
                  net: Number(d.net_foreign_value),
                  cumulative: Number(d.cumulative_flow),
                  ma5: Number(d.flow_ma5),
                  ma20: Number(d.flow_ma20),
                  trend: d.trend,
                }))
                const latest  = foreignFlowTrend[foreignFlowTrend.length - 1]
                const totalNet = foreignFlowTrend.reduce((s: number, d: any) => s + Number(d.net_foreign_value), 0)
                return (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { l: 'Trend',      v: String(latest?.trend||'NEUTRAL').replace(/_/g,' '), c: latest?.trend?.includes('STRONG')?(latest?.trend?.includes('ACCUMULATION')?'#22c55e':'#ef4444'):latest?.trend?.includes('MILD')?(latest?.trend?.includes('ACCUMULATION')?'#86efac':'#fca5a5'):'#94a3b8' },
                        { l: 'Net 60D',    v: formatRupiah(totalNet),                              c: totalNet>=0?'#22c55e':'#ef4444' },
                        { l: 'Cumulative', v: formatRupiah(Number(latest?.cumulative_flow||0)),    c: '#e7b733' },
                        { l: 'MA5 vs MA20',v: Number(latest?.flow_ma5||0)>Number(latest?.flow_ma20||0)?'BULLISH':'BEARISH', c: Number(latest?.flow_ma5||0)>Number(latest?.flow_ma20||0)?'#22c55e':'#ef4444' },
                      ].map((m, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] text-center">
                          <p className="text-[9px] text-muted-foreground uppercase">{m.l}</p>
                          <p className="text-sm font-black mt-1" style={{color:m.c}}>{m.v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.06}/>
                          <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:9}} interval={Math.floor(chartData.length/8)}/>
                          <YAxis tick={{fill:'#64748b',fontSize:9}} tickFormatter={v=>formatRupiah(v)} width={75}/>
                          <Tooltip formatter={(v:any)=>formatRupiah(Number(v))} contentStyle={{background:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:10,fontSize:11}}/>
                          <Bar dataKey="net" radius={[2,2,0,0]}>
                            {chartData.map((d,i)=><Cell key={i} fill={d.net>=0?'#22c55e':'#ef4444'} opacity={0.75}/>)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.06}/>
                          <XAxis dataKey="date" tick={{fill:'#64748b',fontSize:9}} interval={Math.floor(chartData.length/8)}/>
                          <YAxis tick={{fill:'#64748b',fontSize:9}} tickFormatter={v=>formatRupiah(v)} width={75}/>
                          <Tooltip formatter={(v:any)=>formatRupiah(Number(v))} contentStyle={{background:'hsl(var(--card))',borderColor:'rgba(255,255,255,0.06)',borderRadius:10,fontSize:11}}/>
                          <Line dataKey="cumulative" stroke="#e7b733" strokeWidth={2} dot={false} name="Cumulative"/>
                          <Line dataKey="ma5"  stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="MA5"/>
                          <Line dataKey="ma20" stroke="#3b82f6" strokeWidth={1.5} dot={false} strokeDasharray="4 2" name="MA20"/>
                          <RechartLegend/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {brokerConsistency.length > 0 && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-black uppercase tracking-widest">Broker Consistency (30D)</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] text-emerald-400 font-bold uppercase mb-2 tracking-widest">Consistent Buyers</p>
                  <div className="space-y-1.5">
                    {brokerConsistency.filter((b: any) => b.verdict==='STRONG_BUY'||b.verdict==='CONSISTENT_BUY').map((b: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/[0.12]">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold">{b.kode_broker}</p>
                          <p className="text-[8px] text-muted-foreground truncate max-w-[140px]">{b.nama_broker}</p>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <p className="text-[9px] font-bold text-emerald-400">{Number(b.consistency_pct)?.toFixed(0)}% buy</p>
                          <p className="text-[8px] text-muted-foreground">{b.days_net_buy}/{b.total_days} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] text-red-400 font-bold uppercase mb-2 tracking-widest">Consistent Sellers</p>
                  <div className="space-y-1.5">
                    {brokerConsistency.filter((b: any) => b.verdict==='STRONG_SELL'||b.verdict==='CONSISTENT_SELL').map((b: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/[0.05] border border-red-500/[0.12]">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold">{b.kode_broker}</p>
                          <p className="text-[8px] text-muted-foreground truncate max-w-[140px]">{b.nama_broker}</p>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <p className="text-[9px] font-bold text-red-400">{Number(b.consistency_pct)?.toFixed(0)}% sell</p>
                          <p className="text-[8px] text-muted-foreground">{b.days_net_sell}/{b.total_days} days</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!volumeSpikes.length && !whaleActivity && !foreignFlowTrend.length && !brokerConsistency.length && (
            <div className="glass rounded-2xl p-10 text-center border border-white/[0.06]">
              <BarChartIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">Data teknikal tidak tersedia untuk saham ini.</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
