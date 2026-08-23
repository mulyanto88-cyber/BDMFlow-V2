'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  FlaskConical, Play, Settings2, TrendingUp, TrendingDown,
  Target, Clock, AlertTriangle, X, BarChart3,
  Zap, Calendar, RefreshCw, Info, Share2, Copy, Check,
  ExternalLink, Shield, Award, Sparkles, Layers, Flame,
  Coins, ArrowUpRight, Activity, Globe, Users, PieChart,
  CheckCircle2, XCircle
} from 'lucide-react'
import { formatRupiah, formatNumber, formatShares } from '@/lib/utils'
import { mdQuery, UpgradeRequiredError } from '@/lib/api'
import { UpgradePrompt } from '@/components/upgrade-prompt'
import CompanyLogo from '@/components/company-logo'
import Link from 'next/link'

declare const window: any

// ─── Formatters & Fees ────────────────────────────────────────────────────────
function fmtRp(v: number): string {
  if (!v && v !== 0) return 'Rp 0'
  const abs = Math.abs(v)
  const sign = v < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}Rp ${(abs / 1e12).toFixed(2)} T`
  if (abs >= 1e9)  return `${sign}Rp ${(abs / 1e9).toFixed(2)} M`
  if (abs >= 1e6)  return `${sign}Rp ${(abs / 1e6).toFixed(0)} Jt`
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`
}

const BROKER_FEE_BUY  = 0.0015  // 0.15%
const BROKER_FEE_SELL = 0.0025  // 0.25% (includes PPh 0.1%)

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'signal' | 'strategy' | 'bnh'

interface SignalStockResult {
  stock_code: string
  company_name: string
  sector: string
  entry_date: string
  entry_price: number
  entry_value: number
  entry_foreign: number
  entry_aov: number
  entry_whale: boolean
  latest_date: string
  latest_price: number
  max_high: number
  min_low: number
  days_held: number
  current_return_pct: number
  max_gain_pct: number
  max_drawdown_pct: number
}

interface Trade {
  entryDate: string
  entryPrice: number
  exitDate: string
  exitPrice: number
  returnPct: number
  returnRp: number
  daysHeld: number
  reason: 'TP' | 'SL' | 'TIME' | 'END'
  lots: number
  modal: number
  fee: number
}

interface BnHResult {
  mode: 'bnh'
  buyDate: string
  sellDate: string
  buyPrice: number
  sellPrice: number
  lots: number
  shares: number
  modal: number
  grossReturn: number
  fee: number
  netReturn: number
  returnPct: number
  annualizedReturn: number
  days: number
  maxDrawdown: number
  whaleCount: number
  bpAnomalyCount: number
  totalForeign: number
  highestPrice: number
  lowestPrice: number
  rawData: any[]
  ihsgReturnPct: number | null
  ihsgBuyPrice: number | null
  ihsgSellPrice: number | null
}

interface StratResult {
  mode: 'strategy'
  trades: Trade[]
  winRate: number
  totalReturnPct: number
  totalReturnRp: number
  annualizedReturn: number
  maxDrawdown: number
  avgHolding: number
  profitFactor: number
  sharpeApprox: number
  totalFee: number
  equityCurve: { date: string; equity: number; drawdown: number }[]
}

// ─── Comprehensive Signal Groups across the Platform ──────────────────────────
const SIGNAL_CATEGORIES = [
  {
    category: 'Daily Tape & Flow Anomaly',
    presets: [
      {
        id: 'AOV_SURGE',
        label: 'AOV Volume Surge',
        badge: '1.5x+',
        icon: Flame,
        color: 'text-amber-500',
        bgIcon: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
        accentBorder: 'border-l-amber-500',
        desc: 'AOV Ratio ≥ 1.5x (Lonjakan rata-rata volume per transaksi)',
      },
      {
        id: 'AOV_EXTREME',
        label: 'AOV Extreme Spike',
        badge: '2.5x+',
        icon: Zap,
        color: 'text-orange-500',
        bgIcon: 'bg-orange-500/10 text-orange-500 border-orange-500/25',
        accentBorder: 'border-l-orange-500',
        desc: 'AOV Ratio ≥ 2.5x (Anomali lonjakan transaksi super masif)',
      },
      {
        id: 'WHALE_ALERT',
        label: 'Whale Flow Alert',
        badge: 'Whale',
        icon: Shield,
        color: 'text-purple-500',
        bgIcon: 'bg-purple-500/10 text-purple-500 border-purple-500/25',
        accentBorder: 'border-l-purple-500',
        desc: 'Akumulasi bandar & anomali big player di transaksi harian',
      },
      {
        id: 'BIG_PLAYER',
        label: 'Big Player Tape Anomaly',
        badge: 'Big Player',
        icon: Target,
        color: 'text-fuchsia-500',
        bgIcon: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/25',
        accentBorder: 'border-l-fuchsia-500',
        desc: 'Anomali transaksi volume investor institusi / smart money',
      },
      {
        id: 'FOREIGN_INFLOW',
        label: 'Foreign Net Inflow 1D',
        badge: 'Net Buy',
        icon: Globe,
        color: 'text-teal-500',
        bgIcon: 'bg-teal-500/10 text-teal-500 border-teal-500/25',
        accentBorder: 'border-l-teal-500',
        desc: 'Top akumulasi net foreign buy harian terbesar di bursa',
      },
    ]
  },
  {
    category: 'High-Conviction & Multi-Factor Combos',
    presets: [
      {
        id: 'COMBINED_WHALE_FOREIGN',
        label: 'Whale + Asing Net Buy',
        badge: 'Power Combo',
        icon: Sparkles,
        color: 'text-emerald-500',
        bgIcon: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
        accentBorder: 'border-l-emerald-500',
        desc: 'Kombinasi Whale/AOV Surge + Akumulasi Asing Positif',
      },
      {
        id: 'TRIPLE_POWER',
        label: 'Triple Combo (Whale+AOV+Asing)',
        badge: 'Max Conviction',
        icon: Award,
        color: 'text-yellow-500',
        bgIcon: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/25',
        accentBorder: 'border-l-yellow-500',
        desc: 'Whale Signal + AOV ≥ 1.5x + Asing Net Buy (Triple Filter)',
      },
      {
        id: 'RADAR_MOMENTUM',
        label: 'Radar Price Momentum',
        badge: 'Momentum',
        icon: TrendingUp,
        color: 'text-cyan-500',
        bgIcon: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/25',
        accentBorder: 'border-l-cyan-500',
        desc: 'AOV ≥ 1.2x + Price Naik ≥ +1.5% + Asing Akumulasi',
      },
      {
        id: 'ACCUM_BREAKOUT',
        label: 'Accumulation Breakout',
        badge: 'Breakout',
        icon: ArrowUpRight,
        color: 'text-blue-500',
        bgIcon: 'bg-blue-500/10 text-blue-500 border-blue-500/25',
        accentBorder: 'border-l-blue-500',
        desc: 'Candle hijau (Close ≥ Open) dengan konfirmasi Whale/AOV Surge',
      },
      {
        id: 'ALL',
        label: 'Top Active Liquidity',
        badge: 'Market Value',
        icon: Activity,
        color: 'text-slate-400',
        bgIcon: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
        accentBorder: 'border-l-slate-400',
        desc: 'Top 10 saham paling likuid di bursa pada tanggal tersebut',
      },
    ]
  }
]

const ALL_PRESETS_FLAT = SIGNAL_CATEGORIES.flatMap(c => c.presets)

// ─── Component ────────────────────────────────────────────────────────────────
export default function BacktestPage() {
  // ── Mode Switcher ──────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('signal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)

  // ── Tab 1: Signal Efficacy State ───────────────────────────────────────────
  const [signalPreset, setSignalPreset] = useState('AOV_SURGE')
  const [timeframe, setTimeframe] = useState<'1W' | '2W' | '1M' | '3M' | 'CUSTOM'>('2W')
  const [targetDate, setTargetDate] = useState<string>('')
  const [limitCount, setLimitCount] = useState<number>(10)
  const [tradingDates, setTradingDates] = useState<string[]>([])
  const [signalResults, setSignalResults] = useState<SignalStockResult[] | null>(null)
  const [copiedToast, setCopiedToast] = useState(false)

  // ── Tab 2: Strategy Sim State ──────────────────────────────────────────────
  const [stockCode, setStockCode] = useState('BBCA')
  const [signalType, setSignalType] = useState('WHALE_SIGNAL')
  const [holdingPeriod, setHoldingPeriod] = useState(10)
  const [takeProfit, setTakeProfit] = useState(5)
  const [stopLoss, setStopLoss] = useState(3)
  const [lotsStrat, setLotsStrat] = useState(10)
  const [stratResult, setStratResult] = useState<StratResult | null>(null)

  // ── Tab 3: Buy & Hold State ────────────────────────────────────────────────
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [lotsBnH, setLotsBnH] = useState(10)
  const [bnhResult, setBnHResult] = useState<BnHResult | null>(null)

  const chartRef = useRef<HTMLDivElement>(null)
  const [chartScriptLoaded, setChartScriptLoaded] = useState(false)
  const todayStr = new Date().toISOString().split('T')[0]

  // ── Load LightweightCharts Script ───────────────────────────────────────────
  useEffect(() => {
    if ((window as any).LightweightCharts) { setChartScriptLoaded(true); return }
    const s = document.createElement('script')
    s.src = 'https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js'
    s.crossOrigin = 'anonymous'
    s.async = true; s.onload = () => setChartScriptLoaded(true)
    document.body.appendChild(s)
  }, [])

  // ── Load Available Historical Trading Dates ─────────────────────────────────
  useEffect(() => {
    async function loadDates() {
      try {
        const rows = await mdQuery('backtest.tradingDates', [])
        if (rows && rows.length > 0) {
          const dates = rows.map((r: any) => String(r.trading_date).split('T')[0])
          setTradingDates(dates)
          
          if (dates.length > 10) {
            setTargetDate(dates[10])
          } else if (dates.length > 0) {
            setTargetDate(dates[dates.length - 1])
          }
        }
      } catch (err: any) {
        if (err instanceof UpgradeRequiredError) setBlocked(true)
      }
    }
    loadDates()

    const end = new Date()
    const start = new Date(); start.setDate(start.getDate() - 90)
    setEndDate(end.toISOString().split('T')[0])
    setStartDate(start.toISOString().split('T')[0])
  }, [])

  // ── Helper: Set Timeframe Preset ───────────────────────────────────────────
  const applyTimeframe = useCallback((tf: '1W' | '2W' | '1M' | '3M', dates = tradingDates) => {
    setTimeframe(tf)
    if (!dates || dates.length === 0) return
    let idx = 10
    if (tf === '1W') idx = Math.min(dates.length - 1, 5)
    if (tf === '2W') idx = Math.min(dates.length - 1, 10)
    if (tf === '1M') idx = Math.min(dates.length - 1, 21)
    if (tf === '3M') idx = Math.min(dates.length - 1, 63)
    setTargetDate(dates[idx])
  }, [tradingDates])

  // ── Execute Signal Accuracy Backtest ───────────────────────────────────────
  const runSignalBacktest = useCallback(async (customDate?: string, customPreset?: string, customLimit?: number) => {
    const d = customDate || targetDate
    const p = customPreset || signalPreset
    const l = customLimit || limitCount
    if (!d) { setError('Pilih tanggal awal sinyal'); return }

    setLoading(true); setError(null); setSignalResults(null)
    try {
      const data = await mdQuery('backtest.signalPerformance', [d, p, l])
      if (!data || data.length === 0) {
        setError(`Tidak ditemukan saham yang memicu sinyal ${p} pada tanggal ${d}. Coba pilih tanggal lain atau sinyal lain.`)
      } else {
        setSignalResults(data as unknown as SignalStockResult[])
      }
    } catch (e: any) {
      if (e instanceof UpgradeRequiredError) setBlocked(true)
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [targetDate, signalPreset, limitCount])

  // Auto-run when target date loads
  useEffect(() => {
    if (tradingDates.length > 0 && targetDate && !signalResults && mode === 'signal' && !loading) {
      runSignalBacktest(targetDate, signalPreset, limitCount)
    }
  }, [tradingDates, targetDate, mode])

  // ── Execute Strategy Backtest (Single Stock) ───────────────────────────────
  const runStrategy = useCallback(async () => {
    if (!stockCode || stockCode.length < 1) { setError('Isi kode saham'); return }
    setLoading(true); setError(null); setStratResult(null)

    try {
      const data = await mdQuery('backtest.pricesAll', [stockCode.toUpperCase()])
      if (!data.length) throw new Error(`Tidak ada data untuk ${stockCode.toUpperCase()}`)

      const lots = lotsStrat
      const shares = lots * 100
      const trades: Trade[] = []
      let equity = 100
      const equityHistory: { date: string; equity: number; peak: number }[] = []
      let position: { entry: number; date: string; idx: number } | null = null
      let peak = 100

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        const date = String(row.trading_date).split('T')[0]
        const close = Number(row.close)
        const high  = Number(row.high)  || close
        const low   = Number(row.low)   || close

        let curEq = equity
        if (position) {
          const ret = (close - position.entry) / position.entry
          curEq = equity * (1 + ret)
        }
        peak = Math.max(peak, curEq)
        equityHistory.push({ date, equity: curEq, peak })

        if (position) {
          const tpPrice = position.entry * (1 + takeProfit / 100)
          const slPrice = position.entry * (1 - stopLoss / 100)
          const daysHeld = i - position.idx
          let exitPrice = 0, reason: Trade['reason'] | null = null

          if (high >= tpPrice) { exitPrice = tpPrice; reason = 'TP' }
          else if (low <= slPrice) { exitPrice = slPrice; reason = 'SL' }
          else if (daysHeld >= holdingPeriod) { exitPrice = close; reason = 'TIME' }
          else if (i === data.length - 1) { exitPrice = close; reason = 'END' }

          if (reason) {
            const ret = (exitPrice - position.entry) / position.entry
            const grossRp = ret * position.entry * shares
            const fee = position.entry * shares * BROKER_FEE_BUY + exitPrice * shares * BROKER_FEE_SELL
            const netRet = ret - (BROKER_FEE_BUY + BROKER_FEE_SELL)
            equity = equity * (1 + netRet)
            peak   = Math.max(peak, equity)
            trades.push({
              entryDate: position.date, entryPrice: position.entry,
              exitDate: date, exitPrice,
              returnPct: ret * 100,
              returnRp: grossRp - fee,
              daysHeld, reason, lots,
              modal: position.entry * shares,
              fee: Math.round(fee),
            })
            position = null
          }
          continue
        }

        let signal = false
        if (signalType === 'WHALE_SIGNAL' && row.whale_signal) signal = true
        if (signalType === 'AOV_SPIKE' && Number(row.aov_ratio_ma20) >= 1.5) signal = true
        if (signalType === 'FOREIGN_BUY' && Number(row.net_foreign_value) > 0) signal = true
        if (signalType === 'BIG_PLAYER' && row.big_player_anomaly) signal = true
        if (signalType === 'COMBINED' && (row.whale_signal || Number(row.aov_ratio_ma20) >= 1.5) && Number(row.net_foreign_value) > 0) signal = true

        if (signal) position = { entry: close, date, idx: i }
      }

      const wins = trades.filter(t => t.returnPct > 0)
      const losses = trades.filter(t => t.returnPct <= 0)
      const winRate = trades.length ? (wins.length / trades.length) * 100 : 0
      const totalReturnPct = equity - 100
      const totalReturnRp = trades.reduce((s, t) => s + t.returnRp, 0)
      const totalFee = trades.reduce((s, t) => s + t.fee, 0)

      let maxDrawdown = 0
      let runPeak = 0
      for (const pt of equityHistory) {
        if (pt.equity > runPeak) runPeak = pt.equity
        const dd = runPeak > 0 ? ((runPeak - pt.equity) / runPeak) * 100 : 0
        if (dd > maxDrawdown) maxDrawdown = dd
      }

      const avgHolding = trades.length ? trades.reduce((s, t) => s + t.daysHeld, 0) / trades.length : 0
      const grossProfit = wins.reduce((s, t) => s + t.returnRp, 0)
      const grossLoss   = Math.abs(losses.reduce((s, t) => s + t.returnRp, 0))
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99 : 0
      const totalDays = equityHistory.length
      const annualizedReturn = totalDays > 0 ? ((Math.pow(equity / 100, 365 / totalDays) - 1) * 100) : 0

      const tradeReturns = trades.map(t => t.returnPct)
      const avgR = tradeReturns.length ? tradeReturns.reduce((s, r) => s + r, 0) / tradeReturns.length : 0
      const variance = tradeReturns.length > 1
        ? tradeReturns.reduce((s, r) => s + Math.pow(r - avgR, 2), 0) / (tradeReturns.length - 1)
        : 0
      const sharpeApprox = variance > 0 ? avgR / Math.sqrt(variance) : 0

      const equityCurve = equityHistory.map(pt => ({
        date: pt.date,
        equity: Number(pt.equity.toFixed(2)),
        drawdown: Number((pt.peak > 0 ? ((pt.peak - pt.equity) / pt.peak) * 100 : 0).toFixed(2)),
      }))

      setStratResult({
        mode: 'strategy', trades, winRate, totalReturnPct, totalReturnRp,
        annualizedReturn, maxDrawdown, avgHolding, profitFactor,
        sharpeApprox, totalFee, equityCurve,
      })
    } catch (e: any) {
      if (e instanceof UpgradeRequiredError) setBlocked(true)
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [stockCode, signalType, holdingPeriod, takeProfit, stopLoss, lotsStrat])

  // ── Execute Buy & Hold Backtest ─────────────────────────────────────────────
  const runBnH = useCallback(async () => {
    if (!stockCode || !startDate || !endDate) { setError('Isi semua field'); return }
    if (startDate >= endDate) { setError('Tanggal mulai harus sebelum tanggal akhir'); return }
    setLoading(true); setError(null); setBnHResult(null)

    try {
      const [data, ihsgData] = await Promise.all([
        mdQuery('backtest.pricesRange', [stockCode.toUpperCase(), startDate, endDate]),
        mdQuery('backtest.compositeRange', [startDate, endDate]),
      ])

      if (!data.length) throw new Error(`Tidak ada data untuk ${stockCode.toUpperCase()} dalam periode ini`)

      const first = data[0], last = data[data.length - 1]
      const buyPrice  = Number(first.open_price) || Number(first.close)
      const sellPrice = Number(last.close)
      const lots = lotsBnH
      const shares = lots * 100
      const modal = buyPrice * shares
      const grossReturn = (sellPrice - buyPrice) * shares
      const fee = modal * BROKER_FEE_BUY + sellPrice * shares * BROKER_FEE_SELL
      const netReturn = grossReturn - fee
      const returnPct = (netReturn / modal) * 100

      const days = Math.round(
        (new Date(String(last.trading_date).split('T')[0]).getTime() -
         new Date(String(first.trading_date).split('T')[0]).getTime()) / 86400000
      ) || data.length

      const annualizedReturn = days > 0
        ? ((Math.pow((sellPrice / buyPrice), 365 / days) - 1) * 100)
        : 0

      let runPeak = buyPrice
      let maxDrawdown = 0
      for (const r of data) {
        const h = Number(r.high) || Number(r.close)
        const l = Number(r.low)  || Number(r.close)
        if (h > runPeak) runPeak = h
        const dd = ((runPeak - l) / runPeak) * 100
        if (dd > maxDrawdown) maxDrawdown = dd
      }

      const whaleCount    = data.filter((r: any) => r.whale_signal === true || Number(r.aov_ratio_ma20) >= 1.5).length
      const bpAnomalyCount = data.filter((r: any) => r.big_player_anomaly === true).length
      const totalForeign  = data.reduce((s: number, r: any) => s + (Number(r.net_foreign_value) || 0), 0)
      const highestPrice  = Math.max(...data.map((r: any) => Number(r.high) || Number(r.close)))
      const lowestPrice   = Math.min(...data.map((r: any) => Number(r.low)  || Number(r.close)))

      let ihsgReturnPct: number | null = null
      let ihsgBuyPrice: number | null = null
      let ihsgSellPrice: number | null = null
      if (ihsgData.length >= 2) {
        ihsgBuyPrice  = Number(ihsgData[0].close)
        ihsgSellPrice = Number(ihsgData[ihsgData.length - 1].close)
        ihsgReturnPct = ((ihsgSellPrice - ihsgBuyPrice) / ihsgBuyPrice) * 100
      }

      const result: BnHResult = {
        mode: 'bnh', buyDate: String(first.trading_date).split('T')[0],
        sellDate: String(last.trading_date).split('T')[0],
        buyPrice, sellPrice, lots, shares, modal, grossReturn,
        fee: Math.round(fee), netReturn, returnPct, annualizedReturn,
        days, maxDrawdown, whaleCount, bpAnomalyCount, totalForeign,
        highestPrice, lowestPrice, rawData: data,
        ihsgReturnPct, ihsgBuyPrice, ihsgSellPrice,
      }
      setBnHResult(result)
      setTimeout(() => renderBnHChart(data), 200)

    } catch (e: any) {
      if (e instanceof UpgradeRequiredError) setBlocked(true)
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [stockCode, startDate, endDate, lotsBnH])

  function renderBnHChart(data: any[]) {
    if (!chartScriptLoaded || !chartRef.current || !data.length) return
    const lwc = (window as any).LightweightCharts
    if (!lwc) return

    chartRef.current.innerHTML = ''
    const chart = lwc.createChart(chartRef.current, {
      height: 320, autoSize: true,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: 'rgba(51,65,85,0.15)' }, horzLines: { color: 'rgba(51,65,85,0.15)' } },
      rightPriceScale: { borderColor: 'rgba(51,65,85,0.5)' },
      timeScale: { borderColor: 'rgba(51,65,85,0.5)' },
    })

    chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.2 } })
    const candle = chart.addCandlestickSeries({
      upColor: '#22c55e', downColor: '#ef4444', borderVisible: false,
      wickUpColor: '#22c55e', wickDownColor: '#ef4444',
    })
    candle.setData(data.map((r: any) => ({
      time: String(r.trading_date).split('T')[0],
      open: Number(r.open_price) || Number(r.close),
      high: Number(r.high) || Number(r.close),
      low:  Number(r.low)  || Number(r.close),
      close: Number(r.close),
    })))

    const buyPrice = Number(data[0].open_price) || Number(data[0].close)
    candle.createPriceLine({ price: buyPrice, color: '#3b82f6', lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: '📌 Entry' })

    const volSeries = chart.addHistogramSeries({ priceScaleId: 'vol', priceFormat: { type: 'volume' } })
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } })
    volSeries.setData(data.map((r: any) => ({
      time: String(r.trading_date).split('T')[0],
      value: Number(r.volume) || 0,
      color: Number(r.close) >= (Number(r.open_price) || Number(r.close)) ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
    })))

    const markers: any[] = []
    data.forEach((r: any) => {
      if (r.whale_signal || Number(r.aov_ratio_ma20) >= 1.5)
        markers.push({ time: String(r.trading_date).split('T')[0], position: 'aboveBar', color: '#e7b733', shape: 'arrowDown', text: '🐋' })
      if (r.big_player_anomaly)
        markers.push({ time: String(r.trading_date).split('T')[0], position: 'belowBar', color: '#ec4899', shape: 'circle', size: 1, text: '◆' })
    })
    markers.sort((a, b) => (a.time < b.time ? -1 : 1))
    candle.setMarkers(markers)
    chart.timeScale().fitContent()
    return () => chart.remove()
  }

  // ─── Computed Signal Accuracy Metrics ───────────────────────────────────────
  const signalKPIs = useMemo(() => {
    if (!signalResults || signalResults.length === 0) return null
    const total = signalResults.length
    const wins = signalResults.filter(s => s.current_return_pct > 0)
    const winRate = (wins.length / total) * 100
    const avgReturn = signalResults.reduce((acc, s) => acc + s.current_return_pct, 0) / total
    const avgMaxGain = signalResults.reduce((acc, s) => acc + s.max_gain_pct, 0) / total
    const avgMaxDD = signalResults.reduce((acc, s) => acc + s.max_drawdown_pct, 0) / total
    
    const topStock = [...signalResults].sort((a, b) => b.current_return_pct - a.current_return_pct)[0]
    const worstStock = [...signalResults].sort((a, b) => a.current_return_pct - b.current_return_pct)[0]

    return {
      total,
      winCount: wins.length,
      lossCount: total - wins.length,
      winRate,
      avgReturn,
      avgMaxGain,
      avgMaxDD,
      topStock,
      worstStock,
    }
  }, [signalResults])

  // ─── Copy Social Media Summary ──────────────────────────────────────────────
  const handleCopySocial = () => {
    if (!signalKPIs || !signalResults) return
    const activePresetObj = ALL_PRESETS_FLAT.find(p => p.id === signalPreset)
    const text = `📊 BDMFLOW SIGNAL EFFICACY REPORT 🚀
🔍 Sinyal: ${activePresetObj?.label || signalPreset}
📅 Trigger Snapshot: ${targetDate} (${signalResults[0]?.days_held || 0} Hari Bursa Lalu)

🎯 Win Rate: ${signalKPIs.winRate.toFixed(1)}% (${signalKPIs.winCount} Win / ${signalKPIs.lossCount} Loss)
📈 Rata-rata Return Saat Ini: ${signalKPIs.avgReturn >= 0 ? '+' : ''}${signalKPIs.avgReturn.toFixed(2)}%
🚀 Rata-rata Puncak Kenaikan (MFE): +${signalKPIs.avgMaxGain.toFixed(2)}%
🛡️ Rata-rata Max Drawdown (MAE): ${signalKPIs.avgMaxDD.toFixed(2)}%

Top 5 Performers:
${signalResults.slice(0, 5).map((s, i) => `${i + 1}. $${s.stock_code}: ${s.current_return_pct >= 0 ? '+' : ''}${s.current_return_pct.toFixed(1)}% (Peak +${s.max_gain_pct.toFixed(1)}%)`).join('\n')}

💡 Uji sinyal dan data smart money terlengkap di BDMFlow!`

    navigator.clipboard.writeText(text)
    setCopiedToast(true)
    setTimeout(() => setCopiedToast(false), 3000)
  }

  // ── Blocked check ──
  if (blocked) {
    return (
      <div className="w-full animate-fade-in pb-10 pt-6">
        <UpgradePrompt
          feature="Backtest Lab & Signal Efficacy"
          detail="Uji akurasi sinyal radar, screener, dan strategi trading Anda terhadap data historis bursa sebelum mempertaruhkan modal nyata."
        />
      </div>
    )
  }

  return (
    <div className="w-full py-6 space-y-6 pb-16 animate-fade-in max-w-[1720px] mx-auto px-3 sm:px-6">

      {/* ── Header & Main Navigation Tabs ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/75 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-line-3 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 text-amber-500 shadow-sm shrink-0">
            <FlaskConical className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">Backtest Lab</h1>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[9px] font-black uppercase tracking-wider">
                Accuracy & Efficacy
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Validasi akurasi sinyal harian di seluruh market & uji simulasi strategi trading
            </p>
          </div>
        </div>

        {/* 3 Modern Navigation Tabs */}
        <div className="flex bg-surface-2 p-1 rounded-xl border border-line-2 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'signal', label: '🎯 Signal Accuracy (Multi-Stock)' },
            { id: 'strategy', label: '📊 Single Stock Sim' },
            { id: 'bnh', label: '📈 Buy & Hold vs IHSG' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id as Mode); setError(null) }}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-1 md:flex-initial ${
                mode === t.id
                  ? 'bg-card text-foreground border border-line-3 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center gap-3 text-rose-500 text-xs sm:text-sm shadow-sm animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-500/20 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: SIGNAL ACCURACY & FORWARD RETURN TRACKER (MULTI-STOCK)
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode === 'signal' && (
        <div className="space-y-6">
          
          {/* Controls Bar: 10 Sinyal Presets + Periode Snapshot + Jumlah Saham */}
          <div className="rounded-2xl p-3.5 sm:p-4 border border-line-3 bg-card shadow-sm space-y-3.5">
            
            {/* Sinyal Presets Categorized (Compact & Sleek) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  Pilih Sinyal / Filter Entry ($T_0$)
                </span>
                <span className="text-[9.5px] text-muted-foreground/80 hidden sm:inline font-medium">
                  {ALL_PRESETS_FLAT.find(p => p.id === signalPreset)?.desc}
                </span>
              </div>

              {SIGNAL_CATEGORIES.map((cat, ci) => (
                <div key={ci} className="space-y-1.5">
                  <div className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {cat.category}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {cat.presets.map(p => {
                      const Icon = p.icon
                      const active = signalPreset === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSignalPreset(p.id)
                            runSignalBacktest(targetDate, p.id, limitCount)
                          }}
                          className={`p-2 sm:p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 border-l-[3px] ${p.accentBorder} ${
                            active
                              ? 'bg-surface-2 border-line-5 shadow-xs ring-1 ring-amber-500/30'
                              : 'bg-surface-1/90 border-line-2 hover:border-line-4 text-muted-foreground hover:bg-surface-2'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${p.bgIcon}`}>
                              <Icon className="w-3 h-3" />
                            </div>
                            <span className="text-[7px] font-black uppercase px-1 py-0.2 rounded bg-surface-3 text-muted-foreground border border-line-2">
                              {p.badge}
                            </span>
                          </div>
                          <div>
                            <span className={`text-[11px] font-black block leading-tight truncate ${active ? 'text-foreground' : 'text-foreground/80'}`}>
                              {p.label}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Pilih Periode Waktu ($T_0$) & Sample Count */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-line-2 items-center">
              
              {/* Quick Timeframe Buttons */}
              <div className="md:col-span-6 flex items-center gap-1.5 flex-wrap">
                <span className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                  Titik Awal ($T_0$):
                </span>
                {(['1W', '2W', '1M', '3M'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => applyTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      timeframe === tf
                        ? 'bg-amber-500 text-black border-amber-400 font-black shadow-xs'
                        : 'bg-surface-2 border-line-3 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tf === '1W' ? '1 Minggu Lalu' : tf === '2W' ? '2 Minggu Lalu' : tf === '1M' ? '1 Bulan Lalu' : '3 Bulan Lalu'}
                  </button>
                ))}
              </div>

              {/* Custom Date Picker & Limit Count */}
              <div className="md:col-span-6 flex items-center justify-start md:justify-end gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[9.5px] font-bold text-muted-foreground uppercase">Tanggal:</label>
                  <select
                    value={targetDate}
                    onChange={e => {
                      setTimeframe('CUSTOM')
                      setTargetDate(e.target.value)
                      runSignalBacktest(e.target.value, signalPreset, limitCount)
                    }}
                    className="bg-surface-2 border border-line-3 rounded-lg px-2 py-1 text-xs font-mono font-bold text-foreground outline-none focus:border-amber-500"
                  >
                    {tradingDates.map((d, i) => (
                      <option key={d} value={d}>
                        {d} {i === 0 ? '(Hari Ini)' : `(-${i}d)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[9.5px] font-bold text-muted-foreground uppercase">Top:</span>
                  {[5, 10, 20].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => {
                        setLimitCount(cnt)
                        runSignalBacktest(targetDate, signalPreset, cnt)
                      }}
                      className={`px-2 py-0.5 rounded-md text-xs font-bold border ${
                        limitCount === cnt
                          ? 'bg-foreground text-background border-foreground font-black'
                          : 'bg-surface-2 border-line-2 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => runSignalBacktest()}
                  disabled={loading}
                  className="px-3.5 py-1 rounded-lg bg-amber-500 text-black font-black text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Scan
                </button>
              </div>

            </div>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="rounded-2xl p-10 border border-line-3 bg-card shadow-sm flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-7 h-7 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm font-bold text-foreground">Menghitung forward returns & excursion data...</p>
              <p className="text-xs text-muted-foreground">Menganalisis pergerakan harga dari {targetDate} hingga hari ini</p>
            </div>
          )}

          {/* Results Section */}
          {signalKPIs && signalResults && !loading && (
            <div className="space-y-5 animate-fade-in">
              
              {/* 4 Themed & Distinct Executive KPI Cards (Compact & Sized Down) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 1. Win Rate (Emerald Theme) */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/[0.04] dark:bg-emerald-950/20 border border-emerald-500/30 dark:border-emerald-500/35 border-l-[3.5px] border-l-emerald-500 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8.5px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                      Win Rate Akurasi
                    </span>
                    <span className="text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      {signalKPIs.winCount}W · {signalKPIs.lossCount}L
                    </span>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
                      {signalKPIs.winRate.toFixed(1)}%
                    </div>
                    {/* Micro bar */}
                    <div className="w-full h-1 bg-emerald-500/20 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                        style={{ width: `${signalKPIs.winRate}%` }} 
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Avg Current Return (Cyan Theme) */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-cyan-500/[0.04] dark:bg-cyan-950/20 border border-cyan-500/30 dark:border-cyan-500/35 border-l-[3.5px] border-l-cyan-500 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8.5px] font-bold text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">
                      Avg Return Saat Ini
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
                  </div>
                  <div>
                    <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                      signalKPIs.avgReturn >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-500'
                    }`}>
                      {signalKPIs.avgReturn >= 0 ? '+' : ''}{signalKPIs.avgReturn.toFixed(2)}%
                    </div>
                    <span className="text-[9px] text-cyan-800/80 dark:text-cyan-200/70 font-medium block mt-1">
                      Hold ~{signalResults[0]?.days_held || 0} hari bursa
                    </span>
                  </div>
                </div>

                {/* 3. Avg Max Potential Gain / MFE (Purple Theme) */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-purple-500/[0.04] dark:bg-purple-950/20 border border-purple-500/30 dark:border-purple-500/35 border-l-[3.5px] border-l-purple-500 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8.5px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                      Avg Puncak (MFE)
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-purple-600 dark:text-purple-400">
                      +{signalKPIs.avgMaxGain.toFixed(2)}%
                    </div>
                    <span className="text-[9px] text-purple-800/80 dark:text-purple-200/70 font-medium block mt-1">
                      Potensi target swing
                    </span>
                  </div>
                </div>

                {/* 4. Avg Max Drawdown / MAE (Rose Theme) */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-rose-500/[0.04] dark:bg-rose-950/20 border border-rose-500/30 dark:border-rose-500/35 border-l-[3.5px] border-l-rose-500 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8.5px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                      Avg Max Drawdown
                    </span>
                    <Shield className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-rose-600 dark:text-rose-400">
                      {signalKPIs.avgMaxDD.toFixed(2)}%
                    </div>
                    <span className="text-[9px] text-rose-800/80 dark:text-rose-200/70 font-medium block mt-1">
                      Risiko floating loss
                    </span>
                  </div>
                </div>

              </div>

              {/* Action Banner: Copy/Share Result to Medsos */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-surface-2 border border-line-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Top performer: <strong className="text-foreground">${signalKPIs.topStock.stock_code}</strong> ({signalKPIs.topStock.current_return_pct >= 0 ? '+' : ''}{signalKPIs.topStock.current_return_pct.toFixed(1)}% · Peak +{signalKPIs.topStock.max_gain_pct.toFixed(1)}%)
                  </span>
                </div>
                <button
                  onClick={handleCopySocial}
                  className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-card border border-line-3 hover:border-line-5 text-foreground font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs shrink-0"
                >
                  {copiedToast ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin ke Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Salin Rekap untuk Threads / Medsos</span>
                    </>
                  )}
                </button>
              </div>

              {/* 10 Stocks Transparency Table with T0 Signal Indicators */}
              <div className="rounded-2xl border border-line-3 bg-card shadow-sm overflow-hidden">
                <div className="p-3.5 sm:p-4 border-b border-line-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-foreground">
                      Daftar {signalResults.length} Saham Terdeteksi pada {targetDate}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Perbandingan harga & kondisi sinyal saat muncul ($T_0$) vs pergerakan harga hingga saat ini
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground bg-surface-2 px-2.5 py-1 rounded-lg border border-line-2">
                    {signalResults.length} Stocks
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-line-2 bg-surface-1/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Saham</th>
                        <th className="py-2.5 px-3">Kondisi Sinyal $T_0$</th>
                        <th className="py-2.5 px-3 text-right">Entry ($T_0$)</th>
                        <th className="py-2.5 px-3 text-right">Saat Ini</th>
                        <th className="py-2.5 px-3 text-right">Current Return</th>
                        <th className="py-2.5 px-3 text-right">Max High (MFE)</th>
                        <th className="py-2.5 px-3 text-right">Max Low (MAE)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line-2 font-mono">
                      {signalResults.map((s, idx) => {
                        const isWin = s.current_return_pct > 0
                        return (
                          <tr key={s.stock_code} className="hover:bg-surface-1 transition-colors">
                            
                            {/* Number */}
                            <td className="py-2.5 px-3 text-muted-foreground font-bold">{idx + 1}</td>

                            {/* Stock info */}
                            <td className="py-2.5 px-3 font-sans">
                              <div className="flex items-center gap-2.5">
                                <CompanyLogo code={s.stock_code} sector={s.sector} size={30} />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-black font-mono text-xs sm:text-sm text-foreground">{s.stock_code}</span>
                                    {s.entry_whale && (
                                      <span className="text-[7.5px] px-1 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/30">
                                        WHALE
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-muted-foreground truncate block max-w-[120px] sm:max-w-[150px]">
                                    {s.company_name || s.sector}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* T0 Signal Conditions Badges */}
                            <td className="py-2.5 px-3 font-sans">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                                  ⚡ AOV {s.entry_aov.toFixed(2)}x
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  s.entry_foreign >= 0 
                                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25' 
                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
                                }`}>
                                  🌐 {s.entry_foreign >= 0 ? '+' : ''}{fmtRp(s.entry_foreign)}
                                </span>
                              </div>
                            </td>

                            {/* Entry Price */}
                            <td className="py-2.5 px-3 text-right font-bold text-foreground">
                              {formatNumber(s.entry_price)}
                              <span className="text-[9px] text-muted-foreground block font-normal font-sans">
                                {s.entry_date}
                              </span>
                            </td>

                            {/* Current Price */}
                            <td className="py-2.5 px-3 text-right font-bold text-foreground">
                              {formatNumber(s.latest_price)}
                              <span className="text-[9px] text-muted-foreground block font-normal font-sans">
                                {s.latest_date}
                              </span>
                            </td>

                            {/* Current Return */}
                            <td className="py-2.5 px-3 text-right font-black">
                              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-xs ${
                                isWin 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' 
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                              }`}>
                                {isWin ? '+' : ''}{s.current_return_pct.toFixed(2)}%
                              </span>
                            </td>

                            {/* Max High */}
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold text-purple-600 dark:text-purple-400">
                                +{s.max_gain_pct.toFixed(2)}%
                              </span>
                              <span className="text-[9px] text-muted-foreground block font-normal">
                                Rp {formatNumber(s.max_high)}
                              </span>
                            </td>

                            {/* Max Drawdown */}
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-bold text-rose-600 dark:text-rose-400">
                                {s.max_drawdown_pct.toFixed(2)}%
                              </span>
                              <span className="text-[9px] text-muted-foreground block font-normal">
                                Rp {formatNumber(s.min_low)}
                              </span>
                            </td>

                            {/* Win/Loss Status Pill */}
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                                isWin
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                                {isWin ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {isWin ? 'WIN' : 'LOSS'}
                              </span>
                            </td>

                            {/* Action Link */}
                            <td className="py-2.5 px-3 text-center">
                              <Link
                                href={`/stock/${s.stock_code}`}
                                className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground inline-flex items-center justify-center border border-line-2 transition-colors"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2 & 3: SINGLE STOCK STRATEGY & BUY-AND-HOLD SIMULATION
      ═══════════════════════════════════════════════════════════════════════ */}
      {mode !== 'signal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══ LEFT — Settings Panel ══ */}
          <div className="rounded-2xl p-5 border border-line-3 bg-card shadow-sm h-fit space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-foreground">Parameter Simulasi</h3>
            </div>

            {/* Stock code */}
            <div>
              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Kode Saham</label>
              <input
                type="text"
                value={stockCode}
                onChange={e => setStockCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && (mode === 'strategy' ? runStrategy() : runBnH())}
                placeholder="BBCA"
                className="w-full bg-surface-2 border border-line-3 rounded-xl px-4 py-2.5 text-sm font-mono font-bold uppercase focus:border-amber-500 outline-none text-foreground"
                maxLength={10}
              />
            </div>

            {/* Strategy mode params */}
            {mode === 'strategy' && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Signal Entry</label>
                  <select
                    value={signalType}
                    onChange={e => setSignalType(e.target.value)}
                    className="w-full bg-surface-2 border border-line-3 rounded-xl px-4 py-2.5 text-sm focus:border-amber-500 outline-none text-foreground"
                  >
                    <option value="WHALE_SIGNAL">🐋 Whale Signal (AOV Anomaly)</option>
                    <option value="AOV_SPIKE">📊 AOV Spike ≥ 1.5x</option>
                    <option value="FOREIGN_BUY">🌏 Foreign Net Buy</option>
                    <option value="BIG_PLAYER">⚡ Big Player Anomaly</option>
                    <option value="COMBINED">🔀 Combined (Whale + Foreign)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-500 uppercase block mb-1.5">Take Profit %</label>
                    <input
                      type="number"
                      value={takeProfit}
                      onChange={e => setTakeProfit(Number(e.target.value))}
                      min="0.5"
                      step="0.5"
                      className="w-full bg-surface-2 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 outline-none text-foreground font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-rose-500 uppercase block mb-1.5">Stop Loss %</label>
                    <input
                      type="number"
                      value={stopLoss}
                      onChange={e => setStopLoss(Number(e.target.value))}
                      min="0.5"
                      step="0.5"
                      className="w-full bg-surface-2 border border-rose-500/30 rounded-xl px-3 py-2.5 text-sm focus:border-rose-500 outline-none text-foreground font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Max Holding (Hari)</label>
                  <input
                    type="number"
                    value={holdingPeriod}
                    onChange={e => setHoldingPeriod(Number(e.target.value))}
                    min="1"
                    className="w-full bg-surface-2 border border-line-3 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none text-foreground font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Lot per Trade</label>
                  <input
                    type="number"
                    value={lotsStrat}
                    onChange={e => setLotsStrat(Number(e.target.value))}
                    min="1"
                    className="w-full bg-surface-2 border border-line-3 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none text-foreground font-mono font-bold"
                  />
                </div>
              </>
            )}

            {/* Buy & Hold params */}
            {mode === 'bnh' && (
              <>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Jumlah Lot</label>
                  <input
                    type="number"
                    value={lotsBnH}
                    onChange={e => setLotsBnH(Number(e.target.value))}
                    min="1"
                    className="w-full bg-surface-2 border border-line-3 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none text-foreground font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Tanggal Beli</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    max={endDate}
                    className="w-full bg-surface-2 border border-line-3 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none [color-scheme:dark] text-foreground font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1.5">Tanggal Jual</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate}
                    max={todayStr}
                    className="w-full bg-surface-2 border border-line-3 rounded-xl px-3 py-2.5 text-sm focus:border-amber-500 outline-none [color-scheme:dark] text-foreground font-mono"
                  />
                </div>
              </>
            )}

            <button
              onClick={() => (mode === 'strategy' ? runStrategy() : runBnH())}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-black font-black hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/10 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menghitung...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Jalankan Simulasi
                </>
              )}
            </button>
          </div>

          {/* ══ RIGHT — Strategy Results ══ */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Strategy Result Display */}
            {mode === 'strategy' && stratResult && (
              <div className="space-y-4 animate-fade-in">
                
                {/* 4 KPIs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/30 border-l-4 border-l-emerald-500 shadow-xs">
                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Win Rate</span>
                    <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{stratResult.winRate.toFixed(1)}%</div>
                    <span className="text-[10px] text-muted-foreground font-medium">{stratResult.trades.length} total trades</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-cyan-500/[0.05] border border-cyan-500/30 border-l-4 border-l-cyan-500 shadow-xs">
                    <span className="text-[9px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">Total Return</span>
                    <div className={`text-2xl font-black font-mono mt-1 ${stratResult.totalReturnPct >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-500'}`}>
                      {stratResult.totalReturnPct >= 0 ? '+' : ''}{stratResult.totalReturnPct.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{fmtRp(stratResult.totalReturnRp)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-500/[0.05] border border-rose-500/30 border-l-4 border-l-rose-500 shadow-xs">
                    <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 uppercase">Max Drawdown</span>
                    <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">-{stratResult.maxDrawdown.toFixed(1)}%</div>
                    <span className="text-[10px] text-muted-foreground font-medium">Peak to trough</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-500/[0.05] border border-purple-500/30 border-l-4 border-l-purple-500 shadow-xs">
                    <span className="text-[9px] font-bold text-purple-700 dark:text-purple-300 uppercase">Profit Factor</span>
                    <div className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400 mt-1">{stratResult.profitFactor.toFixed(2)}x</div>
                    <span className="text-[10px] text-muted-foreground font-medium">Avg hold: {stratResult.avgHolding.toFixed(0)}d</span>
                  </div>
                </div>

                {/* Trade Log Table */}
                <div className="rounded-2xl border border-line-3 bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-line-2">
                    <h4 className="font-black text-sm text-foreground">Log Eksekusi Trade ({stockCode})</h4>
                  </div>
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs border-collapse font-mono">
                      <thead className="sticky top-0 bg-surface-2 text-[10px] font-bold text-muted-foreground uppercase">
                        <tr className="border-b border-line-2">
                          <th className="py-2.5 px-3">Entry</th>
                          <th className="py-2.5 px-3">Exit</th>
                          <th className="py-2.5 px-3 text-right">Entry Price</th>
                          <th className="py-2.5 px-3 text-right">Exit Price</th>
                          <th className="py-2.5 px-3 text-right">Return %</th>
                          <th className="py-2.5 px-3 text-center">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-2">
                        {stratResult.trades.map((t, i) => (
                          <tr key={i} className="hover:bg-surface-1">
                            <td className="py-2 px-3">{t.entryDate}</td>
                            <td className="py-2 px-3">{t.exitDate}</td>
                            <td className="py-2 px-3 text-right">{formatNumber(t.entryPrice)}</td>
                            <td className="py-2 px-3 text-right">{formatNumber(t.exitPrice)}</td>
                            <td className={`py-2 px-3 text-right font-black ${t.returnPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {t.returnPct >= 0 ? '+' : ''}{t.returnPct.toFixed(2)}%
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8.5px] font-bold ${
                                t.reason === 'TP' ? 'bg-emerald-500/10 text-emerald-500' : t.reason === 'SL' ? 'bg-rose-500/10 text-rose-500' : 'bg-surface-3 text-muted-foreground'
                              }`}>
                                {t.reason}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* Buy & Hold Result Display */}
            {mode === 'bnh' && bnhResult && (
              <div className="space-y-4 animate-fade-in">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-cyan-500/[0.05] border border-cyan-500/30 border-l-4 border-l-cyan-500 shadow-xs">
                    <span className="text-[9px] font-bold text-cyan-700 dark:text-cyan-300 uppercase">Total Return</span>
                    <div className={`text-2xl font-black font-mono mt-1 ${bnhResult.returnPct >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-rose-500'}`}>
                      {bnhResult.returnPct >= 0 ? '+' : ''}{bnhResult.returnPct.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{fmtRp(bnhResult.netReturn)}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-card border border-line-3 shadow-xs">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">vs IHSG Benchmark</span>
                    <div className="text-2xl font-black font-mono text-foreground mt-1">
                      {bnhResult.ihsgReturnPct !== null ? `${bnhResult.ihsgReturnPct >= 0 ? '+' : ''}${bnhResult.ihsgReturnPct.toFixed(1)}%` : '—'}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">Periode {bnhResult.days} hari</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-500/[0.05] border border-rose-500/30 border-l-4 border-l-rose-500 shadow-xs">
                    <span className="text-[9px] font-bold text-rose-700 dark:text-rose-300 uppercase">Max Drawdown</span>
                    <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1">-{bnhResult.maxDrawdown.toFixed(1)}%</div>
                    <span className="text-[10px] text-muted-foreground font-medium">Penurunan terdalam</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/30 border-l-4 border-l-amber-500 shadow-xs">
                    <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 uppercase">Sinyal Whale</span>
                    <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{bnhResult.whaleCount}x</div>
                    <span className="text-[10px] text-muted-foreground font-medium">Muncul di periode</span>
                  </div>
                </div>

                {/* Candlestick Chart */}
                <div className="rounded-2xl border border-line-3 bg-card p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-sm text-foreground">Grafik Historis & Indikator Sinyal</h4>
                    <div className="flex items-center gap-3 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-amber-500">🐋 Whale / AOV</span>
                      <span className="flex items-center gap-1 text-pink-500">◆ Big Player</span>
                    </div>
                  </div>
                  <div ref={chartRef} className="w-full h-[320px]" />
                </div>
              </div>
            )}

            {/* Empty state for mode !== 'signal' */}
            {!stratResult && !bnhResult && !loading && (
              <div className="rounded-2xl border border-line-3 bg-card p-12 text-center flex flex-col items-center justify-center min-h-[380px]">
                <Target className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <h3 className="font-bold text-base text-foreground">Siap Diuji</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Atur kode saham dan parameter di panel sebelah kiri, lalu klik &quot;Jalankan Simulasi&quot;.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  )
}
