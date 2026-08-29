'use client'
export const dynamic = 'force-dynamic'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Target, Building2, Activity, Globe,
  TrendingUp, Users, Key, BarChart as BarChartIcon,
  Loader2, AlertTriangle, PieChart
} from 'lucide-react'
import nextDynamic from 'next/dynamic'

const WidgetSkeleton = () => <div className="h-48 shimmer rounded-xl w-full" />

const ScorecardWidget = nextDynamic(() => import('@/components/widgets/ScorecardWidget').then(m => m.ScorecardWidget), { loading: () => <WidgetSkeleton /> })
const ChartWidget = nextDynamic(() => import('@/components/widgets/ChartWidget').then(m => m.ChartWidget), { loading: () => <WidgetSkeleton /> })
const OverviewSignalsWidget = nextDynamic(() => import('@/components/widgets/OverviewSignalsWidget').then(m => m.OverviewSignalsWidget), { loading: () => <WidgetSkeleton /> })
const KeyStatsWidget = nextDynamic(() => import('@/components/widgets/KeyStatsWidget').then(m => m.KeyStatsWidget), { loading: () => <WidgetSkeleton /> })
const BrokerDNAWidget = nextDynamic(() => import('@/components/widgets/BrokerDNAWidget').then(m => m.BrokerDNAWidget), { loading: () => <WidgetSkeleton /> })
const BroksumWidget = nextDynamic(() => import('@/components/widgets/BroksumWidget').then(m => m.BroksumWidget), { loading: () => <WidgetSkeleton /> })
const ForeignFlowWidget = nextDynamic(() => import('@/components/widgets/ForeignFlowWidget').then(m => m.ForeignFlowWidget), { loading: () => <WidgetSkeleton /> })
const KSEIIntelWidget = nextDynamic(() => import('@/components/widgets/KSEIIntelWidget').then(m => m.KSEIIntelWidget), { loading: () => <WidgetSkeleton /> })
const InsiderWidget = nextDynamic(() => import('@/components/widgets/InsiderWidget').then(m => m.InsiderWidget), { loading: () => <WidgetSkeleton /> })
const OwnershipWidget = nextDynamic(() => import('@/components/widgets/OwnershipWidget').then(m => m.OwnershipWidget), { loading: () => <WidgetSkeleton /> })
const TechnicalsWidget = nextDynamic(() => import('@/components/widgets/TechnicalsWidget').then(m => m.TechnicalsWidget), { loading: () => <WidgetSkeleton /> })
import { useStockOverview } from '@/hooks/use-stock'
import { useTerminalStore } from '@/store/terminal-store'

// ─── Tab Definitions ──────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',   label: 'Overview',            icon: Target },
  { id: 'keystats',   label: 'Key Stats & Valuasi', icon: PieChart },
  { id: 'broker',     label: 'Broker DNA',          icon: Building2 },
  { id: 'broksum',    label: 'Broksum',             icon: Activity },
  { id: 'flow',       label: 'Foreign',             icon: Globe },
  { id: 'ksei',       label: 'KSEI Intel',          icon: TrendingUp },
  { id: 'insider',    label: 'Insider',             icon: Key },
  { id: 'ownership',  label: 'Ownership',           icon: Users },
  { id: 'technicals', label: 'Technicals',          icon: BarChartIcon },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function StockDetailPage() {
  const params = useParams()
  const stockCode = (params?.code as string)?.toUpperCase() || ''

  const { period, setActiveTicker } = useTerminalStore()

  useEffect(() => {
    if (stockCode) setActiveTicker(stockCode)
  }, [stockCode, setActiveTicker])

  const [activeTab, setActiveTab] = useState('overview')

  const { isLoading, error } = useStockOverview(stockCode, period)
  const errorMsg = error?.message || ''

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-10 h-10 text-gold-400 animate-spin" />
      <p className="ml-3 text-gold-400 font-bold tracking-tight">Loading {stockCode}…</p>
    </div>
  )
  if (errorMsg) return (
    <div className="glass rounded-2xl p-12 text-center border border-red-500/20">
      <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <p className="text-red-400 font-medium">{errorMsg}</p>
    </div>
  )

  return (
    <div className="w-full space-y-4 pb-12 animate-fade-in">

      {/* ══ HEADER: Scorecard ════════════════════════════════════════════════ */}
      <ScorecardWidget stockCode={stockCode} />

      {/* ══ TABS ════════════════════════════════════════════════════════════ */}
      <div className="relative w-full">
        {/* Left/Right subtle fade hints for mobile overflow */}
        <div className="md:hidden pointer-events-none absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scroll-smooth no-scrollbar touch-pan-x">
          {TABS.map(t => {
            const Icon = t.icon
            const active = activeTab === t.id
            return (
              <button 
                key={t.id} 
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs border transition-all whitespace-nowrap font-bold active:scale-95 shrink-0 ${
                  active 
                    ? 'bg-amber-400/15 text-amber-400 border-amber-400/40 shadow-sm' 
                    : 'bg-surface-2 border-line-3 text-muted-foreground hover:text-foreground hover:border-line-5'
                }`}
              >
                <Icon size={13} className={active ? 'text-amber-400' : 'text-muted-foreground/70'} />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══ TAB CONTENT ═════════════════════════════════════════════════════ */}
      {activeTab === 'overview'   && (
        <div className="space-y-4">
          <OverviewSignalsWidget stockCode={stockCode} />
          <ChartWidget stockCode={stockCode} />
        </div>
      )}
      {activeTab === 'keystats'   && <KeyStatsWidget stockCode={stockCode} />}
      {activeTab === 'broker'     && <BrokerDNAWidget stockCode={stockCode} />}
      {activeTab === 'broksum'    && <BroksumWidget stockCode={stockCode} />}
      {activeTab === 'flow'       && <ForeignFlowWidget stockCode={stockCode} />}
      {activeTab === 'ksei'       && <KSEIIntelWidget stockCode={stockCode} />}
      {activeTab === 'insider'    && <InsiderWidget stockCode={stockCode} />}
      {activeTab === 'ownership'  && <OwnershipWidget stockCode={stockCode} />}
      {activeTab === 'technicals' && <TechnicalsWidget stockCode={stockCode} />}

    </div>
  )
}
