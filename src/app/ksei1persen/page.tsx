'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { formatShares, formatPercent, formatRupiah } from '@/lib/utils'
import {
  Eye, Search, TrendingUp, TrendingDown,
  PieChart as PieChartIcon, Activity, Shield, Users,
  X, RefreshCw, AlertTriangle, Target, Zap, Fish,
  EyeOff, Trophy, ArrowUpRight, ArrowDownRight, Clock,
  Filter, ChevronUp, ChevronDown, Minus, BarChart2,
  Flame, Star, Globe, Building2, ChevronRight, ExternalLink,
  GitMerge, Crosshair, ScatterChart as ScatterIcon
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter, ZAxis, ReferenceLine,
} from 'recharts'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
interface InsiderChange {
  investor_name: string
  investor_type: string
  local_foreign: string
  prev_pct: number
  curr_pct: number
  pct_change: number
  share_change: number
  action: string
  alert_level: string
}

interface TopStock {
  code: string
  corp_change: number
  foreign_change: number
  ind_change: number
  score: number
  signals: string
}

interface WhaleTiming {
  share_code: string
  investor_name: string
  investor_type: string
  local_foreign: string
  first_seen_date: string
  latest_date: string
  first_percentage: number
  latest_percentage: number
  latest_shares: number
  est_entry_price: number
  current_price: number
  return_since_entry: number
  holding_days: number
  position_trend: string
  whale_verdict: string
}

interface StealthEntry {
  Code: string
  Date: string
  Price: number
  Prev_Price: number
  Price_Chg_Pct: number
  CP_Flow_Miliar: number
  Foreign_CP_Miliar: number
  Signal: string
}

interface TopInvestor {
  investor_name: string
  investor_type: string
  local_foreign: string
  nationality: string
  total_saham: number
  total_shares: number
  avg_percentage: number
}

interface TopFlow {
  Code: string
  Date: string
  Price: number
  Total_Shares: number
  Top_Buyer: string
  Top_Buyer_Miliar: number
  Top_Seller: string
  Top_Seller_Miliar: number
  CP_Flow_Miliar: number
  Foreign_Flow_Miliar: number
}

type Tab = 'screener' | 'confluence' | 'activity' | 'whale' | 'stealth' | 'topplayer'
type SortKey = 'score' | 'corp_change' | 'foreign_change' | 'ind_change'

interface ActivityRow {
  report_date: string
  share_code: string
  investor_name: string
  investor_type: string
  nationality: string
  prev_percentage: number
  curr_percentage: number
  pct_point_change: number
  share_change: number
  action: string
  alert_level: string
}
type SortDir = 'asc' | 'desc'
type FilterAction = 'all' | 'buying' | 'selling' | 'high'

// ─── Constants ────────────────────────────────────────────────────────────────
const INVESTOR_TYPE_COLORS: Record<string, string> = {
  'Corporate': '#10b981', 'Individual': '#3b82f6', 'Fund Manager': '#f59e0b',
  'Financial Institutional': '#8b5cf6', 'Insurance': '#ec4899',
  'Pension Fund': '#06b6d4', 'Securities': '#f97316', 'Others': '#6b7280',
}

const VERDICT_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  'STRONG HOLD': { color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30', icon: '💎' },
  'ACCUMULATING': { color: 'text-blue-400', bg: 'bg-blue-500/15 border-blue-500/30', icon: '📈' },
  'EXITING': { color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30', icon: '🚪' },
  'WATCH': { color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30', icon: '👀' },
  'NEW ENTRY': { color: 'text-purple-400', bg: 'bg-purple-500/15 border-purple-500/30', icon: '🆕' },
}

// ─── API Helper ──────────────────────────────────────────────────────────────
async function mdQuery(query: string, params?: any[]): Promise<any[]> {
  const res = await fetch('/api/motherduck', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, params }),
  })
  const json = await res.json()
  if (json.error) throw new Error(json.error)
  return json.data || []
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className={`glass card-hover rounded-xl p-4 border ${color} flex items-center gap-3`}>
      <div className={`p-2 rounded-lg bg-white/[0.04]`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</div>
        <div className="text-xl font-black leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function ScorePill({ score }: { score: number }) {
  const abs = Math.abs(score)
  const max = 5
  const filled = Math.min(abs, max)
  const color = score > 0 ? 'bg-emerald-400' : score < 0 ? 'bg-red-400' : 'bg-slate-500'
  const textColor = score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-muted-foreground'
  return (
    <div className="flex items-center gap-1.5">
      <span className={`font-black text-xs ${textColor} w-6 text-right`}>
        {score > 0 ? '+' : ''}{score}
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} className={`w-1.5 h-3 rounded-sm ${i < filled ? color : 'bg-white/[0.08]'}`} />
        ))}
      </div>
    </div>
  )
}

function DeltaBadge({ value, prefix = '' }: { value: number; prefix?: string }) {
  if (value === 0) return <span className="text-muted-foreground text-xs">0.0%</span>
  const color = value > 0 ? 'text-emerald-400' : 'text-red-400'
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`flex items-center gap-0.5 font-bold text-xs ${color}`}>
      <Icon className="w-3 h-3" />
      {prefix}{Math.abs(value).toFixed(1)}%
    </span>
  )
}

function SignalBadge({ signal }: { signal: string }) {
  // vw_insider_screener emits emoji labels ('🟢 Corp Acc', '🔴 Foreign Out', …),
  // so key on substrings — the old exact-match map ('CORP_BUY') never matched → all grey.
  let cls = 'bg-white/[0.05] text-muted-foreground border-white/10'
  if      (signal.includes('Corp Acc'))    cls = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  else if (signal.includes('Foreign In'))  cls = 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  else if (signal.includes('Inst Dom'))    cls = 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  else if (signal.includes('Insider'))     cls = 'bg-violet-500/20 text-violet-400 border-violet-500/30'
  else if (signal.includes('Corp Dist'))   cls = 'bg-red-500/20 text-red-400 border-red-500/30'
  else if (signal.includes('Foreign Out')) cls = 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-bold ${cls}`}>{signal}</span>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function InsiderPage() {
  const [activeTab, setActiveTab] = useState<Tab>('screener')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStock, setSelectedStock] = useState<string | null>(null)
  const [searchStock, setSearchStock] = useState('')

  // Screener state
  const [topStocks, setTopStocks] = useState<TopStock[]>([])
  const [filterAction, setFilterAction] = useState<FilterAction>('all')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [screenerSearch, setScreenerSearch] = useState('')
  const [showChart, setShowChart]           = useState(false)

  // Refs
  const detailRef = useRef<HTMLDivElement>(null)

  // Activity feed state
  const [activityData, setActivityData] = useState<ActivityRow[]>([])
  const [activityFilter, setActivityFilter] = useState<'all' | 'BUYING' | 'SELLING' | 'HIGH'>('all')
  const [activitySearch, setActivitySearch] = useState('')

  // Stock detail state
  const [currentMonthData, setCurrentMonthData] = useState<any[]>([])
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([])
  const [changes, setChanges] = useState<InsiderChange[]>([])
  const [ownerHistory, setOwnerHistory] = useState<any[]>([])
  const [stockMeta, setStockMeta] = useState<{ sector?: string; free_float?: number } | null>(null)
  const [selectedInvestorTypeFilter, setSelectedInvestorTypeFilter] = useState<string | null>(null)

  // Institutional Whale Detail Portfolio state
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null)
  const [investorHoldings, setInvestorHoldings] = useState<any[]>([])
  const [investorHoldingsLoading, setInvestorHoldingsLoading] = useState(false)

  // Other tabs
  const [whaleData, setWhaleData] = useState<WhaleTiming[]>([])
  const [whaleSearch, setWhaleSearch] = useState('')
  const [whaleSortCol, setWhaleSortCol] = useState<string>('return_since_entry')
  const [whaleSortDir, setWhaleSortDir] = useState<'asc' | 'desc'>('desc')
  const [whaleFilterType, setWhaleFilterType] = useState<string>('all')

  const [stealthData, setStealthData] = useState<StealthEntry[]>([])
  const [stealthSearch, setStealthSearch] = useState('')
  const [stealthSortCol, setStealthSortCol] = useState<string>('CP_Flow_Miliar')
  const [stealthSortDir, setStealthSortDir] = useState<'asc' | 'desc'>('desc')

  const [topInvestors, setTopInvestors] = useState<TopInvestor[]>([])
  const [topFlow, setTopFlow] = useState<TopFlow[]>([])
  const [tabLoading, setTabLoading] = useState(false)

  // ─── Fetch Top Stocks ───────────────────────────────────────────────────────
  const fetchTopStocks = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await mdQuery(`SELECT * FROM ksei.vw_insider_screener ORDER BY score DESC`)
      setTopStocks(data.map((d: any) => ({
        code: d.code,
        corp_change: Number(d.corp_change || 0),
        foreign_change: Number(d.foreign_change || 0),
        ind_change: Number(d.ind_change || 0),
        score: Number(d.score || 0),
        signals: d.signals || '',
      })))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch screener')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTopStocks() }, [fetchTopStocks])

  // ─── Fetch Tab Data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'screener' || selectedStock) return
    setTabLoading(true)
    ;(async () => {
      try {
        if (activeTab === 'activity' && activityData.length === 0) {
          const data = await mdQuery(`
            SELECT report_date::VARCHAR, share_code, investor_name, investor_type,
                   nationality, prev_percentage, curr_percentage, pct_point_change,
                   share_change, action, alert_level
            FROM ksei.vw_ksei_individual_changes
            ORDER BY report_date DESC, ABS(pct_point_change) DESC
            LIMIT 500
          `)
          setActivityData(data.map((d: any) => ({
            report_date:     String(d.report_date || '').slice(0, 10),
            share_code:      d.share_code,
            investor_name:   d.investor_name,
            investor_type:   d.investor_type || '—',
            nationality:     d.nationality || '—',
            prev_percentage: Number(d.prev_percentage || 0),
            curr_percentage: Number(d.curr_percentage || 0),
            pct_point_change:Number(d.pct_point_change || 0),
            share_change:    Number(d.share_change || 0),
            action:          d.action || 'HOLDING',
            alert_level:     d.alert_level || 'LOW',
          })))
        }
        if (activeTab === 'whale' && whaleData.length === 0) {
          const data = await mdQuery(
            `SELECT * FROM ksei.vw_whale_timing ORDER BY ABS(return_since_entry) DESC LIMIT 100`
          )
          setWhaleData(data.map((d: any) => ({
            share_code: d.share_code, investor_name: d.investor_name,
            investor_type: d.investor_type || '—', local_foreign: d.local_foreign,
            first_seen_date: d.first_seen_date, latest_date: d.latest_date,
            first_percentage: Number(d.first_percentage || 0),
            latest_percentage: Number(d.latest_percentage || 0),
            latest_shares: Number(d.latest_shares || 0),
            est_entry_price: Number(d.est_entry_price || 0),
            current_price: Number(d.current_price || 0),
            return_since_entry: Number(d.return_since_entry || 0),
            holding_days: Number(d.holding_days || 0),
            position_trend: d.position_trend || '—',
            whale_verdict: d.whale_verdict || 'WATCH',
          })))
        }
        if (activeTab === 'stealth' && stealthData.length === 0) {
          const data = await mdQuery(
            `SELECT * FROM ksei.vw_stealth_accumulation ORDER BY ABS(CP_Flow_Miliar) DESC LIMIT 100`
          )
          setStealthData(data.map((d: any) => ({
            Code: d.Code, Date: d.Date,
            Price: Number(d.Price || 0), Prev_Price: Number(d.Prev_Price || 0),
            Price_Chg_Pct: Number(d.Price_Chg_Pct || 0),
            CP_Flow_Miliar: Number(d.CP_Flow_Miliar || 0),
            Foreign_CP_Miliar: Number(d.Foreign_CP_Miliar || 0),
            Signal: d.Signal || '—',
          })))
        }
        if (activeTab === 'topplayer' && topInvestors.length === 0) {
          const [inv, flow] = await Promise.all([
            mdQuery(`SELECT * FROM ksei.vw_top_investors ORDER BY total_saham DESC LIMIT 50`),
            mdQuery(`
            SELECT Code, Date::VARCHAR AS Date, Price::DOUBLE AS Price, Total_Shares::BIGINT AS Total_Shares,
                   Top_Buyer, ROUND((Top_Buyer_Val/1e9)::DOUBLE,3) AS Top_Buyer_Miliar,
                   Top_Seller, ROUND((Top_Seller_Val/1e9)::DOUBLE,3) AS Top_Seller_Miliar,
                   ROUND((Local_CP_Chg_Val/1e9)::DOUBLE,3) AS CP_Flow_Miliar,
                   ROUND(((Foreign_CP_Chg_Val+Foreign_IB_Chg_Val+Foreign_PF_Chg_Val)/1e9)::DOUBLE,3) AS Foreign_Flow_Miliar
            FROM ksei.monthly_snapshot
            WHERE Date = (SELECT MAX(Date) FROM ksei.monthly_snapshot)
              AND (ABS(Local_CP_Chg_Val) > 1e9 OR ABS(Foreign_CP_Chg_Val) > 1e9)
            ORDER BY ABS(Local_CP_Chg_Val) DESC LIMIT 50
          `),
          ])
          setTopInvestors(inv.map((d: any) => ({
            investor_name: d.investor_name, investor_type: d.investor_type || '—',
            local_foreign: d.local_foreign, nationality: d.nationality,
            total_saham: Number(d.total_saham || 0),
            total_shares: Number(d.total_shares || 0),
            avg_percentage: Number(d.avg_percentage || 0),
          })))
          setTopFlow(flow.map((d: any) => ({
            Code: d.Code, Date: d.Date, Price: Number(d.Price || 0),
            Total_Shares: Number(d.Total_Shares || 0),
            Top_Buyer: d.Top_Buyer || '—', Top_Buyer_Miliar: Number(d.Top_Buyer_Miliar || 0),
            Top_Seller: d.Top_Seller || '—', Top_Seller_Miliar: Number(d.Top_Seller_Miliar || 0),
            CP_Flow_Miliar: Number(d.CP_Flow_Miliar || 0),
            Foreign_Flow_Miliar: Number(d.Foreign_Flow_Miliar || 0),
          })))
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setTabLoading(false)
      }
    })()
  }, [activeTab, selectedStock])

  // ─── Fetch Stock Detail ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedStock) return
    ;(async () => {
      setLoading(true)
      try {
        const [currData, alertData, histData, metaData] = await Promise.all([
          mdQuery(`
            SELECT investor_name, investor_type, local_foreign, percentage, total_holding_shares
            FROM ksei.ownership_1pct
            WHERE share_code = $1 AND date = (SELECT MAX(date) FROM ksei.ownership_1pct)
            ORDER BY percentage DESC
          `, [selectedStock]),
          mdQuery(`
            SELECT * FROM ksei.vw_ksei_individual_changes WHERE share_code = $1 ORDER BY ABS(pct_point_change) DESC LIMIT 50
          `, [selectedStock]),
          mdQuery(`
            SELECT date,
              SUM(CASE WHEN local_foreign IN ('L','D') THEN percentage ELSE 0 END) AS local_pct,
              SUM(CASE WHEN local_foreign = 'F' THEN percentage ELSE 0 END) AS foreign_pct,
              COUNT(DISTINCT investor_name) AS investor_count
            FROM ksei.ownership_1pct
            WHERE share_code = $1
            GROUP BY date ORDER BY date ASC LIMIT 12
          `, [selectedStock]),
          mdQuery(`
            SELECT sector, free_float FROM ksei.vw_ownership_1pct_latest
            WHERE share_code = $1 LIMIT 1
          `, [selectedStock]),
        ])

        setCurrentMonthData(currData.map((d: any) => ({
          ...d,
          percentage: Number(d.percentage),
          shares: Number(d.total_holding_shares),
        })))

        const grouped: Record<string, number> = {}
        currData.forEach((d: any) => {
          const type = d.investor_type || 'Others'
          grouped[type] = (grouped[type] || 0) + Number(d.percentage)
        })
        setPieData(Object.entries(grouped).map(([name, value]) => ({ name, value })))

        setChanges(alertData.map((d: any) => ({
          investor_name: d.investor_name, investor_type: d.investor_type || '—',
          // vw_ksei_individual_changes tidak punya kolom local_foreign
          // derive dari nationality: INDONESIAN/WNI = Local, lainnya = Foreign
          local_foreign: (d.nationality === 'INDONESIAN' || d.nationality === 'WNI') ? 'L' : 'F',
          prev_pct: Number(d.prev_percentage || 0),
          curr_pct: Number(d.curr_percentage || 0),
          pct_change: Number(d.pct_point_change || 0),
          share_change: Number(d.share_change || 0),
          action: d.action || 'HOLDING',
          alert_level: d.alert_level || 'LOW',
        })))

        setOwnerHistory(histData.map((d: any) => ({
          date: String(d.date).slice(0, 7),
          local_pct: Number(d.local_pct || 0),
          foreign_pct: Number(d.foreign_pct || 0),
          investor_count: Number(d.investor_count || 0),
        })))

        if (metaData.length > 0) {
          setStockMeta({ sector: metaData[0].sector, free_float: Number(metaData[0].free_float || 0) })
        }

      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [selectedStock])

  const loadInvestorHoldings = useCallback(async (investorName: string) => {
    setSelectedInvestor(investorName)
    setInvestorHoldingsLoading(true)
    try {
      const data = await mdQuery(`
        SELECT share_code, percentage, total_holding_shares
        FROM ksei.ownership_1pct
        WHERE investor_name = $1
          AND date = (SELECT MAX(date) FROM ksei.ownership_1pct)
        ORDER BY percentage DESC
      `, [investorName])
      setInvestorHoldings(data.map((d: any) => ({
        share_code: d.share_code,
        percentage: Number(d.percentage || 0),
        shares: Number(d.total_holding_shares || 0)
      })))
    } catch (err: any) {
      console.error('Failed to load investor holdings', err.message)
    } finally {
      setInvestorHoldingsLoading(false)
    }
  }, [])

  // ─── Derived / Filtered Data ───────────────────────────────────────────────
  const displayedHolders = useMemo(() => {
    if (!selectedInvestorTypeFilter) return currentMonthData
    return currentMonthData.filter(d => (d.investor_type || 'Others') === selectedInvestorTypeFilter)
  }, [currentMonthData, selectedInvestorTypeFilter])

  const displayedChanges = useMemo(() => {
    if (!selectedInvestorTypeFilter) return changes
    return changes.filter(c => (c.investor_type || 'Others') === selectedInvestorTypeFilter)
  }, [changes, selectedInvestorTypeFilter])

  const filteredStocks = useMemo(() => {
    let filtered = [...topStocks]
    if (screenerSearch) {
      const q = screenerSearch.toUpperCase()
      filtered = filtered.filter(s => s.code.includes(q))
    }
    if (filterAction === 'buying') filtered = filtered.filter(s => s.corp_change > 0 || s.foreign_change > 0)
    else if (filterAction === 'selling') filtered = filtered.filter(s => s.corp_change < 0 || s.foreign_change < 0)
    else if (filterAction === 'high') filtered = filtered.filter(s => s.signals.includes('HIGH') || Math.abs(s.score) >= 3)
    filtered.sort((a, b) => {
      const va = a[sortKey], vb = b[sortKey]
      return sortDir === 'desc' ? vb - va : va - vb
    })
    return filtered
  }, [topStocks, filterAction, sortKey, sortDir, screenerSearch])

  const filteredActivity = useMemo(() => {
    let data = [...activityData]
    if (activitySearch) {
      const q = activitySearch.toUpperCase()
      data = data.filter(a => a.share_code.includes(q) || a.investor_name.toUpperCase().includes(q))
    }
    if (activityFilter === 'BUYING')  data = data.filter(a => a.action === 'BUYING')
    if (activityFilter === 'SELLING') data = data.filter(a => a.action === 'SELLING')
    if (activityFilter === 'HIGH')    data = data.filter(a => a.alert_level === 'HIGH')
    return data
  }, [activityData, activityFilter, activitySearch])

  const filteredWhaleData = useMemo(() => {
    let data = [...whaleData]
    if (whaleSearch) {
      const q = whaleSearch.toUpperCase()
      data = data.filter(w => w.share_code.includes(q) || w.investor_name.toUpperCase().includes(q))
    }
    if (whaleFilterType === 'accumulating') {
      data = data.filter(w => w.position_trend === 'INCREASING')
    } else if (whaleFilterType === 'distributing') {
      data = data.filter(w => w.position_trend === 'DECREASING')
    } else if (whaleFilterType === 'stable') {
      data = data.filter(w => w.position_trend === 'STABLE' || w.position_trend === '—' || w.position_trend === 'HOLDING')
    }
    data.sort((a, b) => {
      const av = (a[whaleSortCol as keyof WhaleTiming] as number) ?? 0
      const bv = (b[whaleSortCol as keyof WhaleTiming] as number) ?? 0
      return whaleSortDir === 'desc' ? bv - av : av - bv
    })
    return data
  }, [whaleData, whaleSearch, whaleSortCol, whaleSortDir, whaleFilterType])

  const filteredStealthData = useMemo(() => {
    let data = [...stealthData]
    if (stealthSearch) {
      const q = stealthSearch.toUpperCase()
      data = data.filter(s => s.Code.includes(q))
    }
    data.sort((a, b) => {
      const av = (a[stealthSortCol as keyof StealthEntry] as number) ?? 0
      const bv = (b[stealthSortCol as keyof StealthEntry] as number) ?? 0
      return stealthSortDir === 'desc' ? bv - av : av - bv
    })
    return data
  }, [stealthData, stealthSearch, stealthSortCol, stealthSortDir])

  const kpiData = useMemo(() => {
    // Exclude corporate action outliers (|change| > 30%) untuk KPI yang bermakna
    const normalCorp    = topStocks.filter(s => Math.abs(s.corp_change    || 0) <= 30)
    const normalForeign = topStocks.filter(s => Math.abs(s.foreign_change || 0) <= 30)
    const corpBuying    = topStocks.filter(s => (s.corp_change    || 0) > 0.5).length
    const foreignBuying = topStocks.filter(s => (s.foreign_change || 0) > 0.5).length
    const ncn = normalCorp.length    || 1
    const nfn = normalForeign.length || 1
    return {
      total:        topStocks.length,
      highAlert:    topStocks.filter(s => Math.abs(s.score) >= 3).length,
      buying:       topStocks.filter(s => s.score > 0).length,
      selling:      topStocks.filter(s => s.score < 0).length,
      corpNet:      normalCorp.reduce((sum, s)    => sum + (s.corp_change    || 0), 0) / ncn,
      foreignNet:   normalForeign.reduce((sum, s) => sum + (s.foreign_change || 0), 0) / nfn,
      corpBuying, foreignBuying,
    }
  }, [topStocks])

  // Auto-scroll ke detail saat selectedStock berubah
  useEffect(() => {
    if (selectedStock && detailRef.current) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [selectedStock])

  // Confluence: Corp + Foreign keduanya akumulasi (highest conviction)
  const confluenceData = useMemo(() => {
    return topStocks
      .filter(s => s.corp_change > 0.5 && s.foreign_change > 0.5)
      .sort((a, b) => b.score - a.score)
  }, [topStocks])

  // Bubble chart data (filter outlier corporate action)
  const bubbleData = useMemo(() => {
    return filteredStocks
      .filter(s => Math.abs(s.corp_change) <= 30 && Math.abs(s.foreign_change) <= 30)
      .map(s => ({
        x: Number(s.corp_change.toFixed(2)),
        y: Number(s.foreign_change.toFixed(2)),
        z: Math.max(50, Math.abs(s.score) * 80 + 60),
        code: s.code,
        score: s.score,
        signals: s.signals,
      }))
  }, [filteredStocks])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ChevronDown className="w-3 h-3 opacity-30" />
    return sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-red-400" /> : <ChevronUp className="w-3 h-3 text-red-400" />
  }

  // ─── Tab Definitions ───────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number; hot?: boolean }[] = [
    { id: 'screener',   label: 'Screener',      icon: <Activity className="w-3.5 h-3.5" />,   count: topStocks.length },
    { id: 'confluence', label: 'Confluence',    icon: <GitMerge className="w-3.5 h-3.5" />,   count: confluenceData.length, hot: true },
    { id: 'activity',   label: 'Activity Feed', icon: <Zap className="w-3.5 h-3.5" />,        count: activityData.length || undefined },
    { id: 'whale',      label: 'Whale Tracker', icon: <Fish className="w-3.5 h-3.5" />,       count: whaleData.length || undefined },
    { id: 'stealth',    label: 'Stealth',       icon: <EyeOff className="w-3.5 h-3.5" />,     count: stealthData.length || undefined },
    { id: 'topplayer',  label: 'Top Players',   icon: <Trophy className="w-3.5 h-3.5" />,     count: topInvestors.length || undefined },
  ]

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="sidebar-offset space-y-4 animate-fade-in pb-12">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-2">
            <Eye className="w-8 h-8 text-red-400 flex-shrink-0" />
            <span className="bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">
              KSEI &gt;1% Ownership Intelligence
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Insider &amp; institutional ownership · whale tracking · stealth accumulation · monthly KSEI data
          </p>
        </div>
        <button onClick={fetchTopStocks} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-muted-foreground hover:text-white hover:border-red-400/30 transition-all">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── KPI Cards (screener only) ── */}
      {!selectedStock && !loading && topStocks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 stagger">
          <KpiCard
            icon={<Shield className="w-4 h-4 text-slate-400" />}
            label="Total Stocks" value={kpiData.total} sub="monitored"
            color="border-white/[0.06]"
          />
          <KpiCard
            icon={<Flame className="w-4 h-4 text-red-400" />}
            label="High Signal" value={kpiData.highAlert} sub="score ≥ 3"
            color="border-red-500/20"
          />
          <KpiCard
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            label="Buying" value={kpiData.buying} sub="score positive"
            color="border-emerald-500/20"
          />
          <KpiCard
            icon={<TrendingDown className="w-4 h-4 text-red-400" />}
            label="Selling" value={kpiData.selling} sub="score negative"
            color="border-red-500/20"
          />
          <KpiCard
            icon={<Building2 className="w-4 h-4 text-amber-400" />}
            label="Corp Avg Δ%"
            value={`${kpiData.corpNet >= 0 ? '+' : ''}${kpiData.corpNet.toFixed(2)}%`}
            sub={`${kpiData.corpBuying} saham naik`}
            color="border-amber-500/20"
          />
          <KpiCard
            icon={<Globe className="w-4 h-4 text-blue-400" />}
            label="Foreign Avg Δ%"
            value={`${kpiData.foreignNet >= 0 ? '+' : ''}${kpiData.foreignNet.toFixed(2)}%`}
            sub={`${kpiData.foreignBuying} saham naik`}
            color="border-blue-500/20"
          />
        </div>
      )}

      {/* ── Search Bar ── */}
      <div className="glass rounded-xl px-3 py-2 border border-border/30 flex items-center gap-3">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          placeholder="Cari kode saham untuk detail (tekan Enter)..."
          value={searchStock}
          onChange={(e) => setSearchStock(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchStock.length >= 2) setSelectedStock(searchStock)
          }}
          className="flex-1 bg-transparent text-sm focus:outline-none uppercase font-mono"
          maxLength={4}
        />
        {selectedStock && (
          <button
            onClick={() => { setSelectedStock(null); setSearchStock('') }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-muted-foreground hover:text-white transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* ═══════════════ STOCK DETAIL VIEW ═══════════════ */}
      {selectedStock && (
        <div className="space-y-4" ref={detailRef}>
          {/* Stock Header */}
          <div className="glass rounded-xl p-4 border border-red-500/20 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono text-red-400">{selectedStock}</span>
              {stockMeta?.sector && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground border border-white/[0.08]">
                  {stockMeta.sector}
                </span>
              )}
              {stockMeta?.free_float != null && (
                <span className="text-xs text-muted-foreground">
                  Free Float: <span className="font-bold text-amber-400">{stockMeta.free_float.toFixed(1)}%</span>
                </span>
              )}
            </div>
            <Link href={`/stock/${selectedStock}`} prefetch={false}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-red-500/20 to-amber-500/20 border border-red-500/30 text-white font-bold text-xs hover:from-red-500/30 hover:to-amber-500/30 transition-all">
              <Target className="w-4 h-4 text-red-400" />
              Full Analysis
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw className="w-6 h-6 text-red-400 animate-spin" />
            </div>
          ) : (
            <>
              {/* Alert Banner for HIGH alerts */}
              {changes.filter(c => c.alert_level === 'HIGH').length > 0 && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2 text-sm">
                  <Flame className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-red-300 font-bold">
                    {changes.filter(c => c.alert_level === 'HIGH').length} HIGH ALERT movement detected pada {selectedStock}
                  </span>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {changes.filter(c => c.alert_level === 'HIGH' && c.action === 'BUYING').length} buying · {changes.filter(c => c.alert_level === 'HIGH' && c.action === 'SELLING').length} selling
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pie Chart */}
                <div className="glass rounded-2xl p-5 border border-border/30">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-red-400" />
                    Ownership by Type — {selectedStock}
                  </h3>
                  {pieData.length > 0 ? (
                    <div className="flex flex-col items-center">
                      <div className="w-56 h-56">
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name"
                              cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none"
                              onClick={(data) => {
                                if (data && data.name) {
                                  setSelectedInvestorTypeFilter(data.name === selectedInvestorTypeFilter ? null : data.name);
                                }
                              }}
                            >
                              {pieData.map((entry, i) => (
                                <Cell key={i} fill={INVESTOR_TYPE_COLORS[entry.name] || '#6b7280'} className="cursor-pointer focus:outline-none" />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}
                              formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 justify-center">
                        {pieData.map((entry, i) => {
                          const isActive = !selectedInvestorTypeFilter || selectedInvestorTypeFilter === entry.name;
                          return (
                            <div key={i}
                              onClick={() => setSelectedInvestorTypeFilter(entry.name === selectedInvestorTypeFilter ? null : entry.name)}
                              className={`flex items-center gap-1.5 text-[9px] cursor-pointer hover:opacity-100 transition-opacity ${
                                isActive ? 'opacity-100 font-bold' : 'opacity-30'
                              }`}
                            >
                              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: INVESTOR_TYPE_COLORS[entry.name] || '#6b7280' }} />
                              <span className="text-muted-foreground">{entry.name}</span>
                              <span className="font-black">{entry.value.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : <p className="text-center py-8 text-muted-foreground text-sm">No data</p>}
                </div>

                {/* Historical Trend Chart */}
                <div className="glass rounded-2xl p-5 border border-border/30">
                  <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-red-400" />
                    Ownership Trend — Local vs Foreign
                  </h3>
                  {ownerHistory.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer>
                        <AreaChart data={ownerHistory} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                          <defs>
                            <linearGradient id="localGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="foreignGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} />
                          <YAxis tick={{ fontSize: 8, fill: '#64748b' }} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '10px' }}
                            formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']}
                          />
                          <Area type="monotone" dataKey="local_pct" name="Local" stroke="#10b981" strokeWidth={2} fill="url(#localGrad)" />
                          <Area type="monotone" dataKey="foreign_pct" name="Foreign" stroke="#3b82f6" strokeWidth={2} fill="url(#foreignGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="text-center py-8 text-muted-foreground text-sm">No historical data</p>}
                </div>
              </div>

              {/* Current Positions Table */}
              <div className="glass rounded-2xl p-5 border border-border/30 overflow-x-auto">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-sm font-black flex items-center gap-2">
                    <Users className="w-4 h-4 text-red-400" />
                    Current Positions ({displayedHolders.length} holders &gt;1%)
                  </h3>
                  {selectedInvestorTypeFilter && (
                    <button
                      onClick={() => setSelectedInvestorTypeFilter(null)}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1 hover:bg-red-500/30 transition-colors"
                    >
                      Filter: {selectedInvestorTypeFilter} <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[9px] text-muted-foreground uppercase border-b border-white/[0.05]">
                      <th className="p-2 text-left">#</th>
                      <th className="p-2 text-left">Investor</th>
                      <th className="p-2 text-left hidden md:table-cell">Type</th>
                      <th className="p-2 text-center">L/F</th>
                      <th className="p-2 text-right">%</th>
                      <th className="p-2 text-right">Shares</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHolders.map((d, i) => (
                      <tr key={i} className="tr-hover border-b border-white/[0.02]">
                        <td className="p-2 text-muted-foreground text-[9px]">{i + 1}</td>
                        <td className="p-2 font-bold text-[10px] truncate max-w-[140px]">{d.investor_name}</td>
                        <td className="p-2 text-[10px] text-muted-foreground hidden md:table-cell">{d.investor_type}</td>
                        <td className="p-2 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${d.local_foreign === 'F' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {d.local_foreign === 'F' ? 'F' : 'L'}
                          </span>
                        </td>
                        <td className="p-2 text-right font-black">{d.percentage.toFixed(2)}%</td>
                        <td className="p-2 text-right text-muted-foreground">{formatShares(d.shares)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Changes Table */}
              {displayedChanges.length > 0 && (
                <div className="glass rounded-2xl border border-border/30 overflow-hidden">
                  <div className="p-4 border-b border-white/[0.05] flex items-center gap-2 flex-wrap justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-red-400" />
                      <h3 className="text-sm font-black">Ownership Changes ({displayedChanges.length})</h3>
                      {selectedInvestorTypeFilter && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          {selectedInvestorTypeFilter} Only
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {['HIGH', 'MEDIUM', 'LOW'].map(level => {
                        const count = displayedChanges.filter(c => c.alert_level === level).length
                        if (!count) return null
                        const cls = level === 'HIGH' ? 'bg-red-500/20 text-red-400' : level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                        return <span key={level} className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${cls}`}>{level} {count}</span>
                      })}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[9px] text-muted-foreground uppercase border-b border-white/[0.05] bg-white/[0.01]">
                          <th className="p-2 text-left">Investor</th>
                          <th className="p-2 text-left hidden md:table-cell">Type</th>
                          <th className="p-2 text-right">Prev%</th>
                          <th className="p-2 text-right">Now%</th>
                          <th className="p-2 text-right">Δ%</th>
                          <th className="p-2 text-right hidden md:table-cell">ΔShares</th>
                          <th className="p-2 text-center">Action</th>
                          <th className="p-2 text-center">Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedChanges.map((c, i) => (
                          <tr key={i}
                            className={`tr-hover border-b border-white/[0.02] ${c.alert_level === 'HIGH' ? 'bg-red-500/[0.03]' : ''}`}>
                            <td className="p-2 font-bold text-[10px] truncate max-w-[130px]">{c.investor_name}</td>
                            <td className="p-2 text-[10px] text-muted-foreground hidden md:table-cell">{c.investor_type}</td>
                            <td className="p-2 text-right text-muted-foreground">{c.prev_pct.toFixed(2)}%</td>
                            <td className="p-2 text-right font-bold">{c.curr_pct.toFixed(2)}%</td>
                            <td className="p-2 text-right">
                              <DeltaBadge value={c.pct_change} />
                            </td>
                            <td className="p-2 text-right text-muted-foreground hidden md:table-cell">{formatShares(c.share_change)}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.action === 'BUYING' ? 'bg-emerald-500/20 text-emerald-400' : c.action === 'SELLING' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                {c.action}
                              </span>
                            </td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.alert_level === 'HIGH' ? 'bg-red-500/20 text-red-400' : c.alert_level === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {c.alert_level}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ═══════════════ MAIN TAB INTERFACE ═══════════════ */}
      {!selectedStock && (
        <>
          {/* Tab Bar */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                  activeTab === tab.id
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'text-muted-foreground hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.hot && tab.count && tab.count > 0
                  ? <span className="text-[8px] px-1.5 rounded-full font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{tab.count} 🔥</span>
                  : tab.count != null && tab.count > 0
                    ? <span className={`text-[9px] px-1 rounded-sm font-black ${activeTab === tab.id ? 'bg-red-500/30' : 'bg-white/[0.08]'}`}>{tab.count}</span>
                    : null
                }
              </button>
            ))}
          </div>

          {/* ── Loading ── */}
          {(loading || tabLoading) && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-7 h-7 text-red-400 animate-spin" />
            </div>
          )}

          {/* ══ TAB: SCREENER ══ */}
          {activeTab === 'screener' && !loading && (
            <div className="glass rounded-2xl overflow-hidden border border-border/30">
              {/* Filter bar */}
              <div className="p-3 border-b border-white/[0.05] flex flex-wrap items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                {(['all', 'buying', 'selling', 'high'] as FilterAction[]).map(f => (
                  <button key={f}
                    onClick={() => setFilterAction(f)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      filterAction === f
                        ? f === 'buying' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : f === 'selling' ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                          : f === 'high' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          : 'bg-white/[0.08] text-white border border-white/[0.12]'
                        : 'text-muted-foreground hover:text-white border border-transparent hover:border-white/10'
                    }`}>
                    {f === 'all' ? `All (${topStocks.length})` : f === 'buying' ? `↑ Buying (${topStocks.filter(s => s.score > 0).length})`
                      : f === 'selling' ? `↓ Selling (${topStocks.filter(s => s.score < 0).length})`
                      : `🔥 High Signal (${topStocks.filter(s => Math.abs(s.score) >= 3).length})`}
                  </button>
                ))}
                {/* Chart toggle + search */}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => setShowChart(v => !v)}
                    title={showChart ? 'Tampil Tabel' : 'Tampil Bubble Chart'}
                    className={`p-1.5 rounded-lg border transition-all ${showChart ? 'bg-gold-400/20 border-gold-400/40 text-gold-400' : 'border-border/50 text-muted-foreground hover:text-foreground'}`}>
                    <ScatterIcon className="w-3.5 h-3.5" />
                  </button>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                    <input value={screenerSearch} onChange={e => setScreenerSearch(e.target.value.toUpperCase())}
                      placeholder="Cari kode..."
                      className="pl-8 pr-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50 w-32 font-mono" />
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{filteredStocks.length} results</span>
              </div>

              {/* ── Bubble Chart — Corp Δ% vs Foreign Δ% ── */}
              {showChart && filteredStocks.length > 0 && (
                <div className="p-4 border-b border-border/30">
                  <div className="flex items-center gap-2 mb-3">
                    <ScatterIcon className="w-3.5 h-3.5 text-gold-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Corp Δ% vs Foreign Δ% · ukuran = score · klik titik untuk detail
                    </p>
                    <div className="ml-auto flex items-center gap-3 text-[9px] text-muted-foreground/50">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"/>Corp+Foreign beli</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>Corp+Foreign jual</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"/>Corp saja</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"/>Foreign saja</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="x" name="Corp Δ%" type="number" domain={['auto','auto']}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                        label={{ value: 'Corp Δ%', position: 'insideBottom', offset: -10, fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                      <YAxis dataKey="y" name="Foreign Δ%" type="number" domain={['auto','auto']}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                        label={{ value: 'Foreign Δ%', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                      <ZAxis dataKey="z" range={[40, 300]} />
                      <ReferenceLine x={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" strokeWidth={1.5} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 10, fontSize: 11, color: 'hsl(var(--foreground))' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0]?.payload
                          return (
                            <div className="bg-card border border-border/50 rounded-xl p-3 text-xs shadow-xl">
                              <p className="font-black text-foreground text-sm mb-1">{d?.code}</p>
                              <p className="text-muted-foreground">Corp Δ: <span className={d?.x > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{d?.x > 0 ? '+' : ''}{d?.x}%</span></p>
                              <p className="text-muted-foreground">Foreign Δ: <span className={d?.y > 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{d?.y > 0 ? '+' : ''}{d?.y}%</span></p>
                              <p className="text-muted-foreground">Score: <span className="font-bold text-foreground">{d?.score}</span></p>
                            </div>
                          )
                        }} />
                      {/* Q1: Corp+ Foreign+ → emerald */}
                      <Scatter name="Corp+Foreign" onClick={(d: any) => { setSelectedStock(d.code); setSearchStock(d.code) }}
                        data={bubbleData.filter(d => d.x > 0 && d.y > 0)} fill="#22c55e" fillOpacity={0.75} style={{ cursor: 'pointer' }} />
                      {/* Q2: Corp- Foreign- → red */}
                      <Scatter name="Both Sell" onClick={(d: any) => { setSelectedStock(d.code); setSearchStock(d.code) }}
                        data={bubbleData.filter(d => d.x < 0 && d.y < 0)} fill="#ef4444" fillOpacity={0.75} style={{ cursor: 'pointer' }} />
                      {/* Q3: Corp+ Foreign- → blue */}
                      <Scatter name="Corp Only" onClick={(d: any) => { setSelectedStock(d.code); setSearchStock(d.code) }}
                        data={bubbleData.filter(d => d.x > 0 && d.y <= 0)} fill="#3b82f6" fillOpacity={0.75} style={{ cursor: 'pointer' }} />
                      {/* Q4: Corp- Foreign+ → amber */}
                      <Scatter name="Foreign Only" onClick={(d: any) => { setSelectedStock(d.code); setSearchStock(d.code) }}
                        data={bubbleData.filter(d => d.x <= 0 && d.y > 0)} fill="#f59e0b" fillOpacity={0.75} style={{ cursor: 'pointer' }} />
                    </ScatterChart>
                  </ResponsiveContainer>
                  <p className="text-[9px] text-muted-foreground/35 text-center mt-1">
                    Outlier corporate action (&gt;30%) difilter. Klik titik untuk detail saham.
                  </p>
                </div>
              )}

              {filteredStocks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white/[0.02] border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                        <th className="p-2 text-left w-6">#</th>
                        <th className="p-2 text-left">Stock</th>
                        <th className="p-2 text-right cursor-pointer hover:text-white select-none" onClick={() => toggleSort('corp_change')}>
                          <span className="flex items-center justify-end gap-1">Corp Δ% <SortIcon k="corp_change" /></span>
                        </th>
                        <th className="p-2 text-right cursor-pointer hover:text-white select-none hidden sm:table-cell" onClick={() => toggleSort('foreign_change')}>
                          <span className="flex items-center justify-end gap-1">Foreign Δ% <SortIcon k="foreign_change" /></span>
                        </th>
                        <th className="p-2 text-right cursor-pointer hover:text-white select-none hidden sm:table-cell" onClick={() => toggleSort('ind_change')}>
                          <span className="flex items-center justify-end gap-1">Ind Δ% <SortIcon k="ind_change" /></span>
                        </th>
                        <th className="p-2 text-right cursor-pointer hover:text-white select-none" onClick={() => toggleSort('score')}>
                          <span className="flex items-center justify-end gap-1">Score <SortIcon k="score" /></span>
                        </th>
                        <th className="p-2 text-left">Signals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStocks.map((s, i) => (
                        <tr key={s.code}
                          onClick={() => { setSelectedStock(s.code); setSearchStock(s.code) }}
                          className={`tr-hover border-b border-white/[0.02] cursor-pointer group ${selectedStock === s.code ? 'bg-gold-400/[0.07] border-l-2 border-l-gold-400' : ''}`}>
                          <td className="p-2 text-muted-foreground text-[9px]">{i + 1}</td>
                          <td className="p-2">
                            <span className={`font-mono font-black transition-colors ${selectedStock === s.code ? 'text-gold-400' : 'group-hover:text-red-400'}`}>{s.code}</span>
                          </td>
                          <td className="p-2 text-right"><DeltaBadge value={s.corp_change} /></td>
                          <td className="p-2 text-right hidden sm:table-cell"><DeltaBadge value={s.foreign_change} /></td>
                          <td className="p-2 text-right hidden sm:table-cell"><DeltaBadge value={s.ind_change} /></td>
                          <td className="p-2 text-right">
                            <ScorePill score={s.score} />
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {s.signals.split(', ').filter(Boolean).map((sig: string, j: number) => (
                                <SignalBadge key={j} signal={sig} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No stocks match the current filter.
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: CONFLUENCE ══ */}
          {activeTab === 'confluence' && (
            <div className="space-y-4">
              {/* KPI strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Corp+Foreign Beli',     value: confluenceData.length,                                    color: 'text-emerald-400', sub: 'saham konvergen' },
                  { label: 'Score Tinggi (≥4)',      value: confluenceData.filter(s => s.score >= 4).length,          color: 'text-gold-400',    sub: 'conviction tertinggi' },
                  { label: 'Corp+Foreign+Insider',   value: confluenceData.filter(s => s.signals.includes('Insider')).length, color: 'text-purple-400', sub: 'triple confluence' },
                  { label: 'Avg Corp Δ%',            value: `+${confluenceData.length ? (confluenceData.reduce((s,r)=>s+r.corp_change,0)/confluenceData.length).toFixed(1) : 0}%`, color: 'text-blue-400', sub: 'rata-rata' },
                ].map((k, i) => (
                  <div key={i} className="glass rounded-2xl p-4 text-center card-hover">
                    <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/70 mt-1">{k.label}</p>
                    <p className="text-[9px] text-muted-foreground/40">{k.sub}</p>
                  </div>
                ))}
              </div>

              {confluenceData.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center">
                  <GitMerge size={32} className="mx-auto mb-4 text-muted-foreground/25" />
                  <p className="text-sm font-bold text-muted-foreground/50">Tidak ada saham dengan Corp+Foreign convergence</p>
                  <p className="text-[11px] text-muted-foreground/30 mt-1">Butuh corp_change &gt; 0.5% DAN foreign_change &gt; 0.5% bersamaan</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {confluenceData.map((s, i) => {
                    const isTriple = s.signals.includes('Insider') || s.signals.includes('Inst Dom')
                    return (
                      <div key={s.code}
                        onClick={() => { setSelectedStock(s.code); setSearchStock(s.code) }}
                        className={`glass rounded-2xl p-4 cursor-pointer card-hover border transition-all ${
                          isTriple ? 'border-purple-500/30' :
                          s.score >= 4 ? 'border-gold-400/30' :
                          'border-emerald-500/20'
                        } ${selectedStock === s.code ? 'ring-1 ring-gold-400' : ''}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="font-mono font-black text-lg text-foreground">{s.code}</span>
                            {isTriple && (
                              <span className="ml-2 text-[8px] font-black px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                TRIPLE ✦
                              </span>
                            )}
                          </div>
                          <ScorePill score={s.score} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="text-center p-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                            <p className="text-[8px] text-muted-foreground/50 uppercase">Corp Δ</p>
                            <p className="text-sm font-black text-emerald-400">+{s.corp_change.toFixed(1)}%</p>
                          </div>
                          <div className="text-center p-2 rounded-xl bg-blue-500/[0.06] border border-blue-500/15">
                            <p className="text-[8px] text-muted-foreground/50 uppercase">Foreign Δ</p>
                            <p className="text-sm font-black text-blue-400">+{s.foreign_change.toFixed(1)}%</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {s.signals.split(', ').filter(Boolean).slice(0, 3).map((sig: string, j: number) => (
                            <SignalBadge key={j} signal={sig} />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="text-[10px] text-muted-foreground/35 text-center">
                Klik kartu untuk detail saham. Confluence = Corp Δ &gt; 0.5% DAN Foreign Δ &gt; 0.5%.
              </p>
            </div>
          )}

          {/* ══ TAB: ACTIVITY FEED ══ */}
          {activeTab === 'activity' && !tabLoading && (
            <div className="space-y-3">
              {/* Filter bar */}
              <div className="glass rounded-xl p-3 border border-border/30 flex flex-wrap items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-gold-400" />
                {(['all','BUYING','SELLING','HIGH'] as const).map(f => (
                  <button key={f} onClick={() => setActivityFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      activityFilter === f
                        ? f === 'BUYING'  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                          : f === 'SELLING' ? 'bg-red-500/25 text-red-300 border border-red-500/40'
                          : f === 'HIGH'    ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                          : 'bg-white/[0.08] text-white border border-white/[0.12]'
                        : 'text-muted-foreground hover:text-white border border-transparent hover:border-white/10'
                    }`}>
                    {f === 'all' ? `Semua (${activityData.length})`
                      : f === 'BUYING'  ? `↑ Buying (${activityData.filter(a=>a.action==='BUYING').length})`
                      : f === 'SELLING' ? `↓ Selling (${activityData.filter(a=>a.action==='SELLING').length})`
                      : `🔥 High Alert (${activityData.filter(a=>a.alert_level==='HIGH').length})`}
                  </button>
                ))}
                <div className="relative ml-auto">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  <input value={activitySearch} onChange={e => setActivitySearch(e.target.value.toUpperCase())}
                    placeholder="Kode / nama investor..."
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs focus:outline-none focus:border-gold-400/50 w-44" />
                </div>
                <span className="text-[10px] text-muted-foreground">{filteredActivity.length} records</span>
              </div>

              <div className="glass rounded-2xl overflow-hidden border border-border/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-card/70 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wide">
                        <th className="px-4 py-3 text-left font-bold">Tanggal</th>
                        <th className="px-4 py-3 text-left font-bold">Kode</th>
                        <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Investor</th>
                        <th className="px-4 py-3 text-left font-bold hidden lg:table-cell">Tipe</th>
                        <th className="px-4 py-3 text-right font-bold">Prev%</th>
                        <th className="px-4 py-3 text-right font-bold">Curr%</th>
                        <th className="px-4 py-3 text-right font-bold">Δ%</th>
                        <th className="px-4 py-3 text-center font-bold">Aksi</th>
                        <th className="px-4 py-3 text-center font-bold">Level</th>
                        <th className="px-2 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActivity.length === 0 ? (
                        <tr><td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                          <Zap size={28} className="mx-auto mb-3 opacity-20" />
                          <p className="text-sm font-bold">Belum ada data activity</p>
                        </td></tr>
                      ) : filteredActivity.map((a, i) => (
                        <tr key={i} className="tr-hover border-b border-border/20 group">
                          <td className="px-4 py-2.5 font-mono text-[10px] text-muted-foreground/70 whitespace-nowrap">{a.report_date}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => { setSelectedStock(a.share_code); setSearchStock(a.share_code) }}
                              className="font-mono font-black text-foreground hover:text-gold-400 transition-colors">
                              {a.share_code}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell">
                            <span className="truncate block max-w-[200px] text-foreground/80 font-semibold">{a.investor_name}</span>
                            <span className="text-[9px] text-muted-foreground/45">{a.nationality}</span>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground/60 hidden lg:table-cell">{a.investor_type}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-muted-foreground/60">{a.prev_percentage.toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold">{a.curr_percentage.toFixed(2)}%</td>
                          <td className={`px-4 py-2.5 text-right font-black font-mono ${a.pct_point_change > 0 ? 'text-emerald-400' : a.pct_point_change < 0 ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {a.pct_point_change > 0 ? '+' : ''}{a.pct_point_change.toFixed(2)}%
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              a.action === 'BUYING'  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : a.action === 'SELLING' ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>{a.action}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              a.alert_level === 'HIGH'   ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30'
                              : a.alert_level === 'MEDIUM' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>{a.alert_level}</span>
                          </td>
                          <td className="px-2 py-2.5">
                            <Link href={`/stock/${a.share_code}`} prefetch={false}
                              className="text-muted-foreground/30 hover:text-gold-400 transition-colors">
                              <ExternalLink size={11} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredActivity.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-border/30 text-[10px] text-muted-foreground/40 flex justify-between">
                    <span>{filteredActivity.length} transaksi · klik kode untuk detail saham</span>
                    <span>Sumber: ksei.vw_ksei_individual_changes</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: WHALE TRACKER ══ */}
          {activeTab === 'whale' && !tabLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 glass rounded-xl border border-border/30">
                <Fish className="w-4 h-4 text-blue-400" />
                <p className="text-xs text-muted-foreground">
                  Melacak investor dengan kepemilikan &gt;1% — menampilkan estimated entry price, return sejak masuk, dan verdict posisi saat ini.
                </p>
              </div>
              {/* Whale Filter Toolbar */}
              <div className="panel flex flex-wrap items-center gap-2 p-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={whaleSearch}
                    onChange={e => setWhaleSearch(e.target.value)}
                    placeholder="Cari saham / investor..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-xs focus:outline-none focus:border-red-500/30 uppercase"
                  />
                </div>

                {/* Trend Filter */}
                <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                  {([
                    { key: 'all', label: 'All' },
                    { key: 'accumulating', label: '↑ Accum' },
                    { key: 'distributing', label: '↓ Distrib' }
                  ]).map(f => (
                    <button
                      key={f.key}
                      onClick={() => setWhaleFilterType(f.key)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                        whaleFilterType === f.key
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'text-muted-foreground hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort Column */}
                <select
                  value={whaleSortCol}
                  onChange={e => setWhaleSortCol(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-red-500/30"
                >
                  <option value="return_since_entry">Sort by Return</option>
                  <option value="latest_percentage">Sort by Size %</option>
                  <option value="holding_days">Sort by Hold Days</option>
                  <option value="latest_shares">Sort by Shares</option>
                </select>

                {/* Sort Direction Toggle */}
                <button
                  onClick={() => setWhaleSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  className="px-2 py-1 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors text-[10px] font-bold"
                >
                  {whaleSortDir === 'desc' ? '↓ Desc' : '↑ Asc'}
                </button>

                <span className="ml-auto text-[10px] text-muted-foreground">{filteredWhaleData.length} whales</span>
              </div>

              {filteredWhaleData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 stagger">
                  {filteredWhaleData.map((w, i) => {
                    const verdictCfg = VERDICT_CONFIG[w.whale_verdict] || VERDICT_CONFIG['WATCH']
                    const isPositive = w.return_since_entry >= 0
                    return (
                      <div key={i}
                        onClick={() => { setSelectedStock(w.share_code); setSearchStock(w.share_code) }}
                        className={`glass card-hover rounded-xl p-4 border cursor-pointer ${verdictCfg.bg}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-lg text-red-400">{w.share_code}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${verdictCfg.bg} ${verdictCfg.color}`}>
                                {verdictCfg.icon} {w.whale_verdict}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{w.investor_name}</div>
                          </div>
                          <div className={`text-right`}>
                            <div className={`text-lg font-black ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{w.return_since_entry.toFixed(1)}%
                            </div>
                            <div className="text-[9px] text-muted-foreground">since entry</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/[0.03] rounded-lg p-2">
                            <div className="text-[9px] text-muted-foreground">Entry Price</div>
                            <div className="text-xs font-black">{w.est_entry_price > 0 ? `Rp${w.est_entry_price.toLocaleString('id-ID')}` : '—'}</div>
                          </div>
                          <div className="bg-white/[0.03] rounded-lg p-2">
                            <div className="text-[9px] text-muted-foreground">Current</div>
                            <div className="text-xs font-black">{w.current_price > 0 ? `Rp${w.current_price.toLocaleString('id-ID')}` : '—'}</div>
                          </div>
                          <div className="bg-white/[0.03] rounded-lg p-2">
                            <div className="text-[9px] text-muted-foreground">Hold Days</div>
                            <div className="text-xs font-black">{w.holding_days}d</div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                          <span>{w.first_percentage.toFixed(1)}% → <span className="font-bold text-white">{w.latest_percentage.toFixed(1)}%</span></span>
                          <span className={`font-bold ${w.local_foreign === 'F' ? 'text-blue-400' : 'text-emerald-400'}`}>
                            {w.local_foreign === 'F' ? '🌐 Foreign' : '🏠 Local'} · {w.investor_type}
                          </span>
                        </div>
                        <div className="mt-1.5 text-[9px]">
                          <span className={`font-bold ${w.position_trend === 'INCREASING' ? 'text-emerald-400' : w.position_trend === 'DECREASING' ? 'text-red-400' : 'text-muted-foreground'}`}>
                            {w.position_trend === 'INCREASING' ? '↑ Accumulating' : w.position_trend === 'DECREASING' ? '↓ Distributing' : '→ Stable'}
                          </span>
                          <span className="text-muted-foreground ml-1">· First seen: {String(w.first_seen_date).slice(0, 7)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground">No matching whale data available.</div>
              )}
            </div>
          )}

          {/* ══ TAB: STEALTH ACCUMULATION ══ */}
          {activeTab === 'stealth' && !tabLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 glass rounded-xl border border-border/30">
                <EyeOff className="w-4 h-4 text-violet-400" />
                <p className="text-xs text-muted-foreground">
                  Deteksi akumulasi diam-diam: corporate &amp; foreign institutional flow masuk namun harga belum bergerak signifikan — potensi breakout.
                </p>
              </div>

              {/* Stealth Filter Toolbar */}
              <div className="panel flex flex-wrap items-center gap-2 p-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[150px] max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={stealthSearch}
                    onChange={e => setStealthSearch(e.target.value)}
                    placeholder="Cari saham..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white/[0.03] border border-white/10 rounded-lg text-xs focus:outline-none focus:border-red-500/30 uppercase"
                  />
                </div>

                {/* Sort Column */}
                <select
                  value={stealthSortCol}
                  onChange={e => setStealthSortCol(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-red-500/30"
                >
                  <option value="CP_Flow_Miliar">Sort by Corp Flow</option>
                  <option value="Foreign_CP_Miliar">Sort by Foreign Flow</option>
                  <option value="Price_Chg_Pct">Sort by Price Chg</option>
                  <option value="Price">Sort by Price</option>
                </select>

                {/* Sort Direction Toggle */}
                <button
                  onClick={() => setStealthSortDir(d => d === 'desc' ? 'asc' : 'desc')}
                  className="px-2 py-1 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors text-[10px] font-bold"
                >
                  {stealthSortDir === 'desc' ? '↓ Desc' : '↑ Asc'}
                </button>

                <span className="ml-auto text-[10px] text-muted-foreground">{filteredStealthData.length} records</span>
              </div>

              {filteredStealthData.length > 0 ? (
                <div className="glass rounded-2xl overflow-hidden border border-border/30">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                          <th className="p-3 text-left">Code</th>
                          <th className="p-3 text-right">Price</th>
                          <th className="p-3 text-right">Price Chg%</th>
                          <th className="p-3 text-right">Corp Flow (M)</th>
                          <th className="p-3 text-right hidden md:table-cell">Foreign Flow (M)</th>
                          <th className="p-3 text-center">Signal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStealthData.map((s, i) => (
                          <tr key={i}
                            onClick={() => { setSelectedStock(s.Code); setSearchStock(s.Code) }}
                            className="tr-hover border-b border-white/[0.02] cursor-pointer group">
                            <td className="p-3 font-mono font-black group-hover:text-violet-400 transition-colors">{s.Code}</td>
                            <td className="p-3 text-right text-muted-foreground">
                              Rp{s.Price.toLocaleString('id-ID')}
                            </td>
                            <td className="p-3 text-right">
                              <DeltaBadge value={s.Price_Chg_Pct} />
                            </td>
                            <td className={`p-3 text-right font-bold ${s.CP_Flow_Miliar > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {s.CP_Flow_Miliar > 0 ? '+' : ''}{s.CP_Flow_Miliar.toFixed(2)} M
                            </td>
                            <td className={`p-3 text-right font-bold hidden md:table-cell ${s.Foreign_CP_Miliar > 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                              {s.Foreign_CP_Miliar > 0 ? '+' : ''}{s.Foreign_CP_Miliar.toFixed(2)} M
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[9px] px-2 py-1 rounded-full font-bold border ${
                                s.Signal.includes('STRONG') ? 'bg-violet-500/20 text-violet-400 border-violet-500/30'
                                  : s.Signal.includes('BUY') || s.Signal.includes('ACCUM') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  : 'bg-white/[0.05] text-muted-foreground border-white/10'
                              }`}>
                                {s.Signal}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground">No stealth accumulation data matches the search.</div>
              )}
            </div>
          )}

          {/* ══ TAB: TOP PLAYERS ══ */}
          {activeTab === 'topplayer' && !tabLoading && (
            <div className="space-y-4">
              {/* Top Investors */}
              <div className="glass rounded-2xl overflow-hidden border border-border/30">
                <div className="p-3 border-b border-white/[0.05] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Top Institutional Investors</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto">{topInvestors.length} players</span>
                </div>
                {topInvestors.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                          <th className="p-2 text-left w-6">#</th>
                          <th className="p-2 text-left">Investor</th>
                          <th className="p-2 text-left hidden md:table-cell">Type</th>
                          <th className="p-2 text-center">L/F</th>
                          <th className="p-2 text-right"># Stocks</th>
                          <th className="p-2 text-right hidden sm:table-cell">Total Shares</th>
                          <th className="p-2 text-right">Avg %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topInvestors.map((inv, i) => (
                          <tr key={i}
                            onClick={() => loadInvestorHoldings(inv.investor_name)}
                            className={`tr-hover border-b border-white/[0.02] cursor-pointer ${i < 3 ? 'bg-amber-500/[0.02]' : ''}`}>
                            <td className="p-2 text-muted-foreground">
                              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                            </td>
                            <td className="p-2 font-bold text-[10px] truncate max-w-[160px]">{inv.investor_name}</td>
                            <td className="p-2 text-[10px] text-muted-foreground hidden md:table-cell">{inv.investor_type}</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${inv.local_foreign === 'F' ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {inv.local_foreign === 'F' ? '🌐 F' : '🏠 L'}
                              </span>
                            </td>
                            <td className="p-2 text-right font-black">{inv.total_saham}</td>
                            <td className="p-2 text-right text-muted-foreground hidden sm:table-cell">{formatShares(inv.total_shares)}</td>
                            <td className="p-2 text-right font-black text-amber-400">{inv.avg_percentage.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="p-8 text-center text-muted-foreground text-sm">No data.</div>}
              </div>

              {/* Top Flow */}
              <div className="glass rounded-2xl overflow-hidden border border-border/30">
                <div className="p-3 border-b border-white/[0.05] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black uppercase tracking-widest">Stock Flow — Top Buyer & Seller</h3>
                  <span className="text-[10px] text-muted-foreground ml-auto">{topFlow.length} stocks</span>
                </div>
                {topFlow.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/[0.02] border-b border-white/[0.05] text-[9px] text-muted-foreground uppercase tracking-wider">
                          <th className="p-2 text-left">Code</th>
                          <th className="p-2 text-right">Price</th>
                          <th className="p-2 text-left">Top Buyer</th>
                          <th className="p-2 text-right">Buy (M)</th>
                          <th className="p-2 text-left hidden md:table-cell">Top Seller</th>
                          <th className="p-2 text-right hidden md:table-cell">Sell (M)</th>
                          <th className="p-2 text-right">CP Flow</th>
                          <th className="p-2 text-right hidden sm:table-cell">Foreign Flow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topFlow.map((f, i) => (
                          <tr key={i}
                            onClick={() => { setSelectedStock(f.Code); setSearchStock(f.Code) }}
                            className="tr-hover border-b border-white/[0.02] cursor-pointer group">
                            <td className="p-2 font-mono font-black group-hover:text-emerald-400 transition-colors">{f.Code}</td>
                            <td className="p-2 text-right text-muted-foreground">
                              {f.Price > 0 ? `Rp${f.Price.toLocaleString('id-ID')}` : '—'}
                            </td>
                            <td className="p-2 text-emerald-400 text-[10px] truncate max-w-[100px]">{f.Top_Buyer}</td>
                            <td className="p-2 text-right text-emerald-400 font-bold">+{f.Top_Buyer_Miliar.toFixed(1)} M</td>
                            <td className="p-2 text-red-400 text-[10px] truncate max-w-[100px] hidden md:table-cell">{f.Top_Seller}</td>
                            <td className="p-2 text-right text-red-400 font-bold hidden md:table-cell">-{f.Top_Seller_Miliar.toFixed(1)} M</td>
                            <td className="p-2 text-right">
                              <DeltaBadge value={f.CP_Flow_Miliar} />
                            </td>
                            <td className="p-2 text-right hidden sm:table-cell">
                              <DeltaBadge value={f.Foreign_Flow_Miliar} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <div className="p-8 text-center text-muted-foreground text-sm">No data.</div>}
              </div>
            </div>
          )}
        </>
      )}
      {/* Side Panel/Drawer for Selected Investor Portfolio */}
      {selectedInvestor && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#0F172A] border-l border-white/[0.08] h-full flex flex-col shadow-2xl relative animate-slide-in">
            {/* Drawer Header */}
            <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] text-red-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Trophy className="w-3.5 h-3.5" /> Institutional Portfolio
                </span>
                <h2 className="text-sm font-black text-white truncate" title={selectedInvestor}>
                  {selectedInvestor}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInvestor(null)}
                className="p-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {investorHoldingsLoading ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <RefreshCw className="w-6 h-6 text-red-400 animate-spin mb-2" />
                  <p className="text-xs text-muted-foreground">Loading portfolio data...</p>
                </div>
              ) : investorHoldings.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Memegang {investorHoldings.length} saham (&gt;1%):
                  </p>
                  <div className="space-y-1.5">
                    {investorHoldings.map((h, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setSelectedStock(h.share_code);
                          setSearchStock(h.share_code);
                          setSelectedInvestor(null); // close drawer
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-red-500/5 hover:border-red-500/20 cursor-pointer group transition-all"
                      >
                        <div>
                          <span className="font-mono font-black text-white group-hover:text-red-400 transition-colors">
                            {h.share_code}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-amber-400">{h.percentage.toFixed(2)}%</p>
                          <p className="text-[9px] text-muted-foreground">{formatShares(h.shares)} shares</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Tidak ada data kepemilikan saham.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
