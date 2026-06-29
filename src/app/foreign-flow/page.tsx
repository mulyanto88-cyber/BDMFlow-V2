'use client';
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ComposedChart, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, Area, Legend,
} from 'recharts';
import {
  Globe, TrendingUp, TrendingDown, Activity, Loader2, Search,
  AlertCircle, RefreshCw, BarChart2, ExternalLink, Star,
  ArrowUpRight, ArrowDownRight, Zap, ChevronUp, ChevronDown,
  Eye, Brain, X, ChevronRight,
} from 'lucide-react';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface MarketDayRow {
  date: string;
  total_foreign_buy: number;
  total_foreign_sell: number;
  net_foreign: number;
  total_market_value: number;
  stock_count: number;
  stocks_bought: number;
  stocks_sold: number;
}

interface ScreenerRow {
  stock_code: string;
  company_name: string | null;
  sector: string | null;
  close: number | null;
  change_percent: number | null;
  f1d: number;  f7d: number;  f14d: number;  f30d: number;
  f60d: number; f90d: number; f120d: number;
  buy_days_1d: number;  sell_days_1d: number;
  buy_days_7d: number;  sell_days_7d: number;
  buy_days_14d: number; sell_days_14d: number;
  buy_days_30d: number; sell_days_30d: number;
  buy_days_60d: number; sell_days_60d: number;
  buy_days_90d: number; sell_days_90d: number;
  buy_days_120d: number; sell_days_120d: number;
  buy120d: number; sell120d: number;
  smart_money_score: number | null;
  whale_signal: boolean | null;
  broker_net: number | null;
  signal: string | null;
  tact_foreign_1d: number | null;
  tact_foreign_5d: number | null;
  broker_net_5d: number | null;
  tactical_signal: string | null;
}

interface ChartDayRow {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  previous: number;
  change_percent: number;
  net_foreign: number;
  foreign_buy: number;
  foreign_sell: number;
  volume: number;
  market_value: number;
  cum_foreign?: number;
  candle?: [number, number];
}

interface ChartMetrics {
  stock_code: string;
  company_name: string | null;
  sector: string | null;
  f1d: number; f7d: number; f14d: number; f30d: number;
  f60d: number; f90d: number; f120d: number;
  smart_money_score: number | null;
  whale_signal: boolean | null;
  broker_net: number | null;
  signal: string | null;
  tact_foreign_5d: number | null;
  broker_net_5d: number | null;
  tactical_signal: string | null;
}

interface SectorRow {
  sector: string;
  stock_count: number;
  total_foreign_flow: number;
  avg_change_pct: number;
  total_value: number;
  whale_count: number;
}

interface GroupRow {
  group_name: string;
  total_foreign_30d: number;
  total_value_30d: number;
  active_days: number;
  avg_daily_foreign: number;
  inflow: number;
  outflow: number;
}

interface DivergenceRow {
  stock_code: string;
  company_name: string | null;
  sector: string | null;
  close: number;
  change_percent: number;
  foreign_30d: number;
  broker_net: number;
  whale_signal: boolean;
  big_player_anomaly: boolean;
  smart_money_score: number | null;
  signal: string | null;
  net_foreign_1d: number | null;
  net_foreign_5d: number | null;
  broker_net_5d: number | null;
  tactical_signal: string | null;
  divergence_pattern: string;
}

type ActiveTab = 'overview' | 'screener' | 'chart' | 'divergence';
type Period = '1d' | '7d' | '14d' | '30d' | '60d' | '90d' | '120d';
type Direction = 'all' | 'buy' | 'sell';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmt = (v: number | null | undefined) => {
  if (v == null || isNaN(Number(v))) return '\u2014';
  const n = Number(v), a = Math.abs(n);
  const s = n < 0 ? '-' : '';
  if (a >= 1e12) return `${s}${(a / 1e12).toFixed(2)} T`;
  if (a >= 1e9)  return `${s}${(a / 1e9).toFixed(2)} M`;
  if (a >= 1e6)  return `${s}${(a / 1e6).toFixed(1)}Jt`;
  return `${s}${a.toFixed(0)}`;
};

const fmtSign = (v: number | null | undefined) => {
  if (v == null || isNaN(Number(v))) return '—';
  return `${Number(v) >= 0 ? '+' : ''}${fmt(v)}`;
};

const fmtPrice = (v: number | null | undefined) =>
  v != null ? Math.round(Number(v)).toLocaleString('id-ID') : '—';

const flowCls = (v: number | null | undefined) =>
  (Number(v) ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400';

const flowBg = (v: number | null | undefined) =>
  (Number(v) ?? 0) >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10';

const PERIODS: { key: Period; label: string }[] = [
  { key: '1d',   label: '1D'   },
  { key: '7d',   label: '7D'   },
  { key: '14d',  label: '14D'  },
  { key: '30d',  label: '30D'  },
  { key: '60d',  label: '60D'  },
  { key: '90d',  label: '90D'  },
  { key: '120d', label: '120D' },
];

const DIV_CONFIG: Record<string, { label: string; icon: string; bg: string; border: string; textCol: string; desc: string }> = {
  TRIPLE_BUY:           { label: 'Triple Confirmation ★ ', icon: '★ ', bg: 'bg-yellow-400/10',  border: 'border-yellow-500/40', textCol: 'text-yellow-300', desc: 'Asing + Lokal + Whale Signal semua BUY — conviction tertinggi.' },
  BOTH_BUY:             { label: 'Konfirmasi Dupleks 🟢',  icon: '🟢', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',textCol: 'text-emerald-400', desc: 'Asing dan broker lokal sama-sama akumulasi net buy.' },
  FOREIGN_BUY_LOCAL_SELL:{ label: 'Asing Akumulasi 🔵',   icon: '🔵', bg: 'bg-blue-500/10',    border: 'border-blue-500/30',   textCol: 'text-blue-400',    desc: 'Foreign masuk saat lokal distribusi — potensi re-rating oleh asing.' },
  LOCAL_BUY_FOREIGN_SELL:{ label: 'Bandar Lokal 🟢',       icon: '🟢', bg: 'bg-emerald-500/8',  border: 'border-emerald-400/20',textCol: 'text-emerald-300', desc: 'Broker lokal beli saat asing keluar — akumulasi domestik diam-diam.' },
  BOTH_SELL:            { label: 'Distribusi Masif 🔴',    icon: '🔴', bg: 'bg-red-500/10',     border: 'border-red-500/30',    textCol: 'text-red-400',     desc: 'Asing dan lokal sama-sama jual — hindari / waspadai.' },
  NEUTRAL:              { label: 'Netral ⚪',               icon: '⚪', bg: 'bg-white/5',        border: 'border-white/10',      textCol: 'text-gray-400',    desc: 'Tidak ada divergence signifikan.' },
};

// ——————————————————————————————————————————————————————————————————————————————

const ForeignTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass p-3 text-[11px] shadow-2xl min-w-[180px]">
      <p className="text-foreground font-black mb-2">{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
            <span className="text-muted-foreground">{e.name}</span>
          </div>
          <span className="font-mono font-bold" style={{ color: e.color }}>{fmt(e.value)}</span>
        </div>
      ))}
    </div>
  );
};

const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  
  if (open == null || close == null || high == null || low == null) return null;

  const isUp = close >= open;
  const color = isUp ? '#ffffff' : '#ef4444'; 

  const hDiff = high - low;
  const pixelsPerValue = hDiff > 0 ? height / hDiff : 0;

  const openY = y + (high - open) * pixelsPerValue;
  const closeY = y + (high - close) * pixelsPerValue;
  const bodyTop = Math.min(openY, closeY);
  const bodyHeight = Math.max(Math.abs(openY - closeY), 1);

  const cx = x + width / 2;

  return (
    <g stroke={color} fill={color}>
      <line x1={cx} y1={y} x2={cx} y2={y + height} />
      <rect x={x} y={bodyTop} width={width} height={bodyHeight} />
    </g>
  );
};

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const candle = payload.find((p: any) => p.dataKey === 'candle' || p.dataKey === 'close');
  const cum   = payload.find((p: any) => p.dataKey === 'cum_foreign');
  const daily = payload.find((p: any) => p.dataKey === 'net_foreign');
  
  const d = candle?.payload;

  return (
    <div className="glass p-3 text-[11px] shadow-2xl min-w-[200px]">
      <p className="text-foreground font-black mb-2">{label}</p>
      {d && d.open != null && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 py-1 border-b border-white/10 mb-2">
          <div className="flex justify-between"><span className="text-muted-foreground">O</span><span className="font-mono">{fmtPrice(d.open)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">H</span><span className="font-mono">{fmtPrice(d.high)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">L</span><span className="font-mono">{fmtPrice(d.low)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">C</span><span className="font-mono font-bold text-foreground">{fmtPrice(d.close)}</span></div>
          <div className="flex justify-between col-span-2 mt-1">
            <span className="text-muted-foreground">Change</span>
            <span className={`font-mono font-bold ${d.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {d.change_percent >= 0 ? '+' : ''}{d.change_percent?.toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      {(!d || d.open == null) && candle && <div className="flex justify-between gap-4 py-0.5"><span className="text-muted-foreground">Harga</span><span className="font-mono font-bold text-foreground">Rp {fmtPrice(d?.close ?? candle.value)}</span></div>}
      {cum   && <div className="flex justify-between gap-4 py-0.5"><span className="text-muted-foreground">Kum. Asing</span><span className={`font-mono font-bold ${flowCls(cum.value)}`}>{fmtSign(cum.value)}</span></div>}
      {daily && <div className="flex justify-between gap-4 py-0.5"><span className="text-muted-foreground">Asing Hari Ini</span><span className={`font-mono font-bold ${flowCls(daily.value)}`}>{fmtSign(daily.value)}</span></div>}
    </div>
  );
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`shimmer rounded-xl ${className}`} />
);

const SkeletonCard = () => (
  <div className="glass rounded-2xl p-4">
    <Skeleton className="h-3 w-24 mb-3" />
    <Skeleton className="h-8 w-32 mb-2" />
    <Skeleton className="h-2 w-20" />
  </div>
);

// â”€â”€â”€ Period Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PeriodBadge = ({ label, value }: { label: string; value: number | null | undefined }) => {
  const v = Number(value ?? 0);
  const positive = v >= 0;
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl border ${positive ? 'border-blue-500/25 bg-blue-500/8' : 'border-red-500/25 bg-red-500/8'}`}>
      <span className="text-[8px] uppercase tracking-widest text-gray-500 mb-0.5">{label}</span>
      <span className={`text-[11px] font-black font-mono ${positive ? 'text-blue-400' : 'text-red-400'}`}>
        {v === 0 ? '—' : fmtSign(v)}
      </span>
    </div>
  );
};

// â”€â”€â”€ Smart Money Score Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SMScoreBadge = ({ score }: { score: number | null }) => {
  if (score == null) return <span className="text-gray-600 text-[10px]">—</span>;
  const color = score >= 4 ? 'text-amber-700 dark:text-yellow-300 bg-yellow-400/20 border-yellow-500/40'
              : score >= 3 ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/25'
              : score >= 2 ? 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/20'
              : 'text-muted-foreground bg-muted/50 border-border/50';
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${color}`}>
      {score}/5
    </span>
  );
};

// â”€â”€â”€ Screener Flow Cell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const FlowCell = ({ value, highlight }: { value: number; highlight?: boolean }) => {
  const v = Number(value ?? 0);
  if (v === 0) return <span className="text-gray-700 font-mono text-[10px]">—</span>;
  const positive = v >= 0;
  return (
    <span className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
      highlight
        ? positive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
        : positive ? 'text-blue-400' : 'text-red-400'
    }`}>
      {fmt(v)}
    </span>
  );
};

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ForeignFlowPage() {
  const searchParams = useSearchParams();
  const [activeTab,    setActiveTab]    = useState<ActiveTab>('overview');

  // Data
  const [marketData,   setMarketData]   = useState<MarketDayRow[]>([]);
  const [sectorData,   setSectorData]   = useState<SectorRow[]>([]);
  const [groupData,    setGroupData]    = useState<GroupRow[]>([]);
  const [screenerData, setScreenerData] = useState<ScreenerRow[]>([]);
  const [chartData,    setChartData]    = useState<ChartDayRow[]>([]);
  const [chartMetrics, setChartMetrics] = useState<ChartMetrics | null>(null);
  const [divData,      setDivData]      = useState<DivergenceRow[]>([]);

  // ─── Filters & Drill-down State ──────────────────────────────────────────────
  const [sectorPeriod, setSectorPeriod] = useState<string>('30d');
  const [groupPeriod,  setGroupPeriod]  = useState<string>('30d');
  const [selectedSectorDetails, setSelectedSectorDetails] = useState<string | null>(null);
  const [sectorDetailsData, setSectorDetailsData] = useState<ScreenerRow[]>([]);
  const [sectorDetailsLoading, setSectorDetailsLoading] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<string | null>(null);
  const [groupDetailsData, setGroupDetailsData] = useState<ScreenerRow[]>([]);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);

  // UI filters / sort
  const [selectedPeriod,   setSelectedPeriod]   = useState<Period>('30d');
  const [filterDirection,  setFilterDirection]  = useState<Direction>('all');
  const [filterSector,     setFilterSector]     = useState('');
  const [filterWhaleOnly,  setFilterWhaleOnly]  = useState(false);
  const [sortCol,          setSortCol]          = useState<string>('f30d');
  const [sortDir,          setSortDir]          = useState<'asc' | 'desc'>('desc');
  const [divFilter,        setDivFilter]        = useState<string>('ALL');

  // Stock chart
  const [selectedStock, setSelectedStock] = useState('');
  const [chartInput,    setChartInput]    = useState('');
  const [chartPeriod,    setChartPeriod]    = useState<number>(120);

  // Loading
  const [overviewLoading,  setOverviewLoading]  = useState(true);
  const [screenerLoading,  setScreenerLoading]  = useState(false);
  const [chartLoading,     setChartLoading]     = useState(false);
  const [divLoading,       setDivLoading]       = useState(false);

  // Errors
  const [overviewError,  setOverviewError]  = useState<string | null>(null);
  const [screenerError,  setScreenerError]  = useState<string | null>(null);
  const [chartError,     setChartError]     = useState<string | null>(null);
  const [divError,       setDivError]       = useState<string | null>(null);

  // Lazy load flags
  const screenerLoaded = useRef(false);
  const divLoaded      = useRef(false);

  // â”€â”€ Data loaders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadMarketSummary = useCallback(async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const res = await fetch('/api/foreign-flow?action=market_summary');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setMarketData(json.data || []);
    } catch (e: any) {
      setOverviewError(e.message);
    }
    setOverviewLoading(false);
  }, []);

  const loadSectorData = useCallback(async (period: string) => {
    try {
      const res = await fetch(`/api/foreign-flow?action=sector_flow&period=${period}`);
      const json = await res.json();
      if (!json.error) setSectorData(json.data || []);
    } catch (e) {}
  }, []);

  const loadGroupData = useCallback(async (period: string) => {
    try {
      const res = await fetch(`/api/foreign-flow?action=group_flow&period=${period}`);
      const json = await res.json();
      if (!json.error) setGroupData(json.data || []);
    } catch (e) {}
  }, []);

  const loadSectorDetails = useCallback(async (sector: string, period: string) => {
    setSectorDetailsLoading(true);
    try {
      const res = await fetch(`/api/foreign-flow?action=screener&sector=${encodeURIComponent(sector)}`);
      const json = await res.json();
      if (!json.error) {
        const col = `f${period}` as keyof ScreenerRow;
        const sorted = (json.data || []).sort((a: any, b: any) => ((b[col] as number) || 0) - ((a[col] as number) || 0));
        setSectorDetailsData(sorted);
      }
    } catch (e) {}
    setSectorDetailsLoading(false);
  }, []);

  const loadGroupDetails = useCallback(async (group: string, period: string) => {
    setGroupDetailsLoading(true);
    try {
      const res = await fetch(`/api/foreign-flow?action=screener&group_name=${encodeURIComponent(group)}`);
      const json = await res.json();
      if (!json.error) {
        const col = `f${period}` as keyof ScreenerRow;
        const sorted = (json.data || []).sort((a: any, b: any) => ((b[col] as number) || 0) - ((a[col] as number) || 0));
        setGroupDetailsData(sorted);
      }
    } catch (e) {}
    setGroupDetailsLoading(false);
  }, []);

  const loadScreener = useCallback(async () => {
    if (screenerLoaded.current) return;
    setScreenerLoading(true);
    setScreenerError(null);
    try {
      const whaleQ = filterWhaleOnly ? '&whale_only=true' : '';
      const res  = await fetch(`/api/foreign-flow?action=screener${whaleQ}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setScreenerData(json.data || []);
      screenerLoaded.current = true;
    } catch (e: any) {
      setScreenerError(e.message);
    }
    setScreenerLoading(false);
  }, [filterWhaleOnly]);

  const loadChart = useCallback(async (code: string, daysVal?: number) => {
    if (!code) return;
    const targetDays = daysVal ?? chartPeriod;
    setChartLoading(true);
    setChartError(null);
    setChartData([]);
    setChartMetrics(null);
    try {
      const res  = await fetch(`/api/foreign-flow?action=stock_chart&code=${code}&days=${targetDays}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setChartData(json.chart || []);
      setChartMetrics(json.metrics || null);
    } catch (e: any) {
      setChartError(e.message);
    }
    setChartLoading(false);
  }, [chartPeriod]);

  const loadDivergence = useCallback(async () => {
    if (divLoaded.current) return;
    setDivLoading(true);
    setDivError(null);
    try {
      const res  = await fetch('/api/foreign-flow?action=divergence');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setDivData(json.data || []);
      divLoaded.current = true;
    } catch (e: any) {
      setDivError(e.message);
    }
    setDivLoading(false);
  }, []);

  const loadOverview = useCallback(async () => {
    await Promise.all([
      loadMarketSummary(),
      loadSectorData(sectorPeriod),
      loadGroupData(groupPeriod),
    ]);
  }, [loadMarketSummary, loadSectorData, loadGroupData, sectorPeriod, groupPeriod]);

  useEffect(() => { loadMarketSummary(); }, [loadMarketSummary]);

  useEffect(() => {
    if (activeTab === 'overview') loadSectorData(sectorPeriod);
  }, [sectorPeriod, loadSectorData, activeTab]);

  useEffect(() => {
    if (activeTab === 'overview') loadGroupData(groupPeriod);
  }, [groupPeriod, loadGroupData, activeTab]);

  useEffect(() => {
    if (selectedSectorDetails) loadSectorDetails(selectedSectorDetails, sectorPeriod);
  }, [selectedSectorDetails, sectorPeriod, loadSectorDetails]);

  useEffect(() => {
    if (selectedGroupDetails) loadGroupDetails(selectedGroupDetails, groupPeriod);
  }, [selectedGroupDetails, groupPeriod, loadGroupDetails]);

  useEffect(() => {
    if (activeTab === 'screener' && !screenerLoaded.current) loadScreener();
    if (activeTab === 'divergence' && !divLoaded.current)    loadDivergence();
  }, [activeTab]);

  // ─── Drill-down from screener → chart ────────────────────────────────────────
  const drillDown = useCallback((code: string) => {
    setSelectedStock(code);
    setChartInput(code);
    setActiveTab('chart');
    loadChart(code);
  }, [loadChart]);

  // ─── Deep-link: /foreign-flow?action=stock_chart&code=BBCA ───────────────────
  // Dipanggil dari stock detail page → langsung buka tab Stock Chart + load data
  useEffect(() => {
    const action = searchParams.get('action');
    const code   = searchParams.get('code');
    if (action === 'stock_chart' && code) {
      drillDown(code.toUpperCase());
    }
    // Hanya jalankan sekali saat mount (searchParams tidak berubah setelah navigasi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Chart with cumulative foreign ──────────────────────────────────────────
  const chartWithCum = useMemo(() => {
    let cum = 0;
    return chartData.map(d => {
      cum += d.net_foreign;
      
      const open = d.open > 0 ? d.open : d.previous;
      const high = d.high > 0 ? d.high : Math.max(open, d.close);
      const low = d.low > 0 ? d.low : Math.min(open, d.close);
      
      const change_percent = d.previous > 0 ? ((d.close - d.previous) / d.previous) * 100 : (d.change_percent || 0);

      const corrected = { ...d, open, high, low, change_percent, cum_foreign: cum, candle: [low, high] as [number, number] };
      return corrected;
    });
  }, [chartData]);

  // ─── Market KPI (latest day) ─────────────────────────────────────────────────
  const latestDay = marketData[marketData.length - 1];
  const prevDay   = marketData[marketData.length - 2];
  const netTrend  = latestDay && prevDay ? latestDay.net_foreign - prevDay.net_foreign : 0;

  // ─── Cumulative market series for overview chart ─────────────────────────────
  const marketCumData = useMemo(() => {
    let cum = 0;
    return marketData.map(d => {
      cum += d.net_foreign;
      return { ...d, cum_net: cum };
    });
  }, [marketData]);

  // ─── Screener filtered & sorted ──────────────────────────────────────────────
  const filteredScreener = useMemo(() => {
    const periodKey = `f${selectedPeriod}` as keyof ScreenerRow;
    let data = [...screenerData];
    if (filterDirection === 'buy')  data = data.filter(r => (r[periodKey] as number) > 0);
    if (filterDirection === 'sell') data = data.filter(r => (r[periodKey] as number) < 0);
    if (filterSector) data = data.filter(r => r.sector === filterSector);
    if (filterWhaleOnly) data = data.filter(r => r.whale_signal === true);
    data.sort((a, b) => {
      if (sortCol === 'consistency') {
        const aBuy = (a[`buy_days_${selectedPeriod}` as keyof ScreenerRow] as number) ?? 0;
        const aSell = (a[`sell_days_${selectedPeriod}` as keyof ScreenerRow] as number) ?? 0;
        const bBuy = (b[`buy_days_${selectedPeriod}` as keyof ScreenerRow] as number) ?? 0;
        const bSell = (b[`sell_days_${selectedPeriod}` as keyof ScreenerRow] as number) ?? 0;
        const aTotal = aBuy + aSell;
        const bTotal = bBuy + bSell;
        const aPct = aTotal > 0 ? (aBuy / aTotal) : 0;
        const bPct = bTotal > 0 ? (bBuy / bTotal) : 0;
        if (aPct !== bPct) {
          return sortDir === 'desc' ? bPct - aPct : aPct - bPct;
        }
        return sortDir === 'desc' ? bBuy - aBuy : aBuy - bBuy;
      }
      const av = (a[sortCol as keyof ScreenerRow] as number) ?? 0;
      const bv = (b[sortCol as keyof ScreenerRow] as number) ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
    return data;
  }, [screenerData, selectedPeriod, filterDirection, filterSector, filterWhaleOnly, sortCol, sortDir]);

  // ─── Unique sectors for filter ───────────────────────────────────────────────
  const sectorList = useMemo(() =>
    [...new Set(screenerData.map(r => r.sector).filter(Boolean) as string[])].sort(),
  [screenerData]);

  // ─── Divergence filtered ─────────────────────────────────────────────────────
  const filteredDiv = useMemo(() => {
    if (divFilter === 'ALL') return divData;
    return divData.filter(r => r.divergence_pattern === divFilter);
  }, [divData, divFilter]);

  // ─── Sort helper ─────────────────────────────────────────────────────────────
  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: string }) =>
    sortCol !== col ? <ChevronDown className="w-3 h-3 opacity-30 inline ml-0.5" /> :
    sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-gold-400 inline ml-0.5" /> :
                         <ChevronUp   className="w-3 h-3 text-gold-400 inline ml-0.5" />;

  // ─── Sector max for heatmap normalization ────────────────────────────────────
  const maxAbsSectorFlow = useMemo(() =>
    Math.max(...sectorData.map(s => Math.abs(s.total_foreign_flow)), 1),
  [sectorData]);

  // RENDER

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview',   label: 'Market Overview',    icon: <Globe className="w-3.5 h-3.5" />       },
    { key: 'screener',   label: 'Foreign Screener',   icon: <Search className="w-3.5 h-3.5" />      },
    { key: 'chart',      label: 'Stock Chart',        icon: <Activity className="w-3.5 h-3.5" />    },
    { key: 'divergence', label: 'Divergence Radar',   icon: <Brain className="w-3.5 h-3.5" />       },
  ];

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="relative border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-yellow-900/5 to-transparent pointer-events-none" />
        <div className="relative px-6 pt-6 pb-5 w-full">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
              <Globe className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight gradient-gold">Foreign Flow Intelligence</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analisa aliran dana asing real-time · IDX Market
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
              <button onClick={() => { loadOverview(); screenerLoaded.current = false; divLoaded.current = false; }}
                className="glass card-hover p-2 rounded-xl text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-1 mt-4 border-b border-white/5 pb-0">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold rounded-t-xl border-b-2 transition-all ${
                  activeTab === t.key
                    ? 'text-gold-400 border-gold-400 bg-gold-400/10'
                    : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/3'
                }`}>
                {t.icon} {t.label}
                {t.key === 'screener' && screenerData.length > 0 && (
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-gold-400/20 text-gold-400">{filteredScreener.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 w-full space-y-5">
        {activeTab === 'overview' && (
          <>
            {overviewError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {overviewError}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
              {overviewLoading ? (
                [0,1,2,3].map(i => <SkeletonCard key={i} />)
              ) : latestDay ? ([
                { label: 'Foreign Buy Today', value: latestDay.total_foreign_buy,  color: 'blue',    icon: <TrendingUp className="w-4 h-4" /> },
                { label: 'Foreign Sell Today',value: latestDay.total_foreign_sell, color: 'red',     icon: <TrendingDown className="w-4 h-4" /> },
                { label: 'Net Foreign Flow',  value: latestDay.net_foreign,        color: latestDay.net_foreign >= 0 ? 'blue' : 'red', icon: <Activity className="w-4 h-4" /> },
                { label: 'Stocks with F.Buy', value: null, stockCount: latestDay.stocks_bought, color: 'gold', icon: <Eye className="w-4 h-4" /> },
              ] as any[]).map((kpi, i) => (
                <div key={i} className={`glass rounded-2xl border p-4 shadow-xl card-hover ${
                  kpi.color === 'blue'   ? 'border-blue-500/20' :
                  kpi.color === 'red'   ? 'border-red-500/20'  :
                  kpi.color === 'gold'? 'border-gold-400/20': 'border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-widest text-gray-500">{kpi.label}</span>
                    <span className={`${kpi.color === 'blue' ? 'text-blue-400' : kpi.color === 'red' ? 'text-red-400' : 'text-gold-400'}`}>{kpi.icon}</span>
                  </div>
                  {kpi.stockCount != null ? (
                    <p className="text-2xl font-black text-gold-400 font-mono">{kpi.stockCount}</p>
                  ) : (
                    <p className={`text-2xl font-black font-mono ${flowCls(kpi.value)}`}>{fmt(kpi.value)}</p>
                  )}
                  {kpi.value != null && (
                    <div className="flex items-center gap-1 mt-1">
                      {netTrend >= 0
                        ? <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        : <ArrowDownRight className="w-3 h-3 text-red-400" />}
                      <span className="text-[9px] text-gray-500">vs. hari sebelumnya</span>
                    </div>
                  )}
                </div>
              )) : null}
            </div>

            {!overviewLoading && marketCumData.length > 0 && (
              <div className="glass rounded-2xl border border-border/50 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-gold-400" />
                  <h2 className="text-sm font-black text-foreground">Net Foreign Flow — 60 Hari Terakhir</h2>
                  <span className="ml-auto text-[9px] text-gray-500">Kumulatif (area) + Daily (bar)</span>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={marketCumData} margin={{ left: 0, right: 0, top: 4, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                      <XAxis dataKey="date" stroke="#374151" fontSize={9} tickFormatter={d => d.slice(5)} tick={{ fill: '#6b7280' }} />
                      <YAxis yAxisId="cum" stroke="#374151" fontSize={9} tickFormatter={v => fmt(v)} width={64} tick={{ fill: '#6b7280' }} />
                      <YAxis yAxisId="daily" orientation="right" stroke="#374151" fontSize={9} tickFormatter={v => fmt(v)} width={56} tick={{ fill: '#6b7280' }} />
                      <Tooltip content={<ForeignTooltip />} cursor={{ fill: '#ffffff04' }} />
                      <ReferenceLine yAxisId="cum" y={0} stroke="#ffffff20" />
                      <ReferenceLine yAxisId="daily" y={0} stroke="#ffffff10" />
                      <Area yAxisId="cum" type="monotone" dataKey="cum_net" name="Kum. Net Foreign"
                        stroke="#3b82f6" fill="#3b82f680" strokeWidth={2} dot={false} />
                      <Bar yAxisId="daily" dataKey="net_foreign" name="Daily Net" maxBarSize={14} radius={[2, 2, 0, 0]}>
                        {marketCumData.map((d, i) => (
                          <Cell key={i} fill={d.net_foreign >= 0 ? '#3b82f6' : '#ef4444'} opacity={0.7} />
                        ))}
                      </Bar>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="glass rounded-2xl border border-border/50 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-gold-400" />
                  <h2 className="text-sm font-black text-foreground">Sector Rotation — Foreign Flow</h2>
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mb-4 w-max">
                  {PERIODS.map(p => (
                    <button key={p.key} onClick={() => setSectorPeriod(p.key)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                        sectorPeriod === p.key ? 'bg-gold-400/20 text-gold-400' : 'text-gray-500 hover:text-gray-300'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {overviewLoading ? (
                  <div className="grid grid-cols-2 gap-2">{[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {sectorData.map(s => {
                      const ratio = Math.abs(s.total_foreign_flow) / maxAbsSectorFlow;
                      const pos   = s.total_foreign_flow >= 0;
                      const intensity = Math.round(ratio * 100);
                      return (
                        <div key={s.sector} onClick={() => setSelectedSectorDetails(s.sector)} className={`cursor-pointer card-hover heatmap-cell rounded-xl p-3 border relative overflow-hidden ${
                          pos ? 'border-blue-500/20' : 'border-red-500/20'
                        }`} style={{ background: pos ? `rgba(59,130,246,${ratio * 0.18})` : `rgba(239,68,68,${ratio * 0.18})` }}>
                          <p className="text-[9px] font-black uppercase tracking-wide text-gray-300 truncate">{s.sector}</p>
                          <p className={`text-sm font-black font-mono mt-0.5 ${pos ? 'text-blue-400' : 'text-red-400'}`}>
                            {fmt(s.total_foreign_flow)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[8px] text-gray-500">{s.stock_count} saham</span>
                            {s.whale_count > 0 && <span className="text-[8px] text-yellow-400">🐋 {s.whale_count}</span>}
                            {s.avg_change_pct != null && (
                              <span className={`text-[8px] font-bold ml-auto ${s.avg_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {s.avg_change_pct >= 0 ? '+' : ''}{s.avg_change_pct?.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="absolute bottom-0 left-0 h-0.5 rounded-full opacity-60"
                            style={{ width: `${intensity}%`, background: pos ? '#3b82f6' : '#ef4444' }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl border border-border/50 p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-gold-400" />
                  <h2 className="text-sm font-black text-foreground">Konglomerat — Foreign Flow</h2>
                </div>
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 mb-4 w-max">
                  {PERIODS.map(p => (
                    <button key={p.key} onClick={() => setGroupPeriod(p.key)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all ${
                        groupPeriod === p.key ? 'bg-gold-400/20 text-gold-400' : 'text-gray-500 hover:text-gray-300'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                {overviewLoading ? (
                  <div className="space-y-2">{[0,1,2,3,4].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}</div>
                ) : (
                  <div className="space-y-1.5 overflow-y-auto max-h-[360px]">
                    {groupData.slice(0, 15).map(g => {
                      const pos = g.total_foreign_30d >= 0;
                      const maxG = groupData[0] ? Math.abs(groupData[0].total_foreign_30d) : 1;
                      const w = (Math.abs(g.total_foreign_30d) / maxG) * 100;
                      return (
                        <div key={g.group_name} onClick={() => setSelectedGroupDetails(g.group_name)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/3 hover:bg-white/5 transition-colors cursor-pointer">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white truncate">{g.group_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="h-1 rounded-full bg-white/5 flex-1 overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: pos ? '#3b82f6' : '#ef4444' }} />
                              </div>
                            </div>
                          </div>
                          <span className={`text-[11px] font-black font-mono shrink-0 ${pos ? 'text-blue-400' : 'text-red-400'}`}>
                            {fmt(g.total_foreign_30d)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'screener' && (
          <>
            <div className="glass rounded-2xl border border-border/50 p-4 shadow-xl">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                  {PERIODS.map(p => (
                    <button key={p.key} onClick={() => { setSelectedPeriod(p.key); setSortCol(`f${p.key}`); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        selectedPeriod === p.key
                          ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                  {([['all','Semua'],['buy','Net Buy'],['sell','Net Sell']] as [Direction,string][]).map(([v, l]) => (
                    <button key={v} onClick={() => setFilterDirection(v)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        filterDirection === v
                          ? v === 'buy'  ? 'bg-blue-500/25 text-blue-300 border border-blue-500/30'
                          : v === 'sell' ? 'bg-red-500/25 text-red-300 border border-red-500/30'
                          :                'bg-white/10 text-white'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>

                <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-gray-300 focus:outline-none focus:border-gold-400/40">
                  <option value="">Semua Sektor</option>
                  {sectorList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <button onClick={() => setFilterWhaleOnly(w => !w)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                    filterWhaleOnly
                      ? 'bg-yellow-400/15 border-yellow-500/30 text-yellow-300'
                      : 'border-white/10 text-gray-500 hover:text-gray-300'
                  }`}>
                  🐋 Whale Only
                </button>

                <span className="ml-auto text-[10px] text-gray-500">{filteredScreener.length} saham</span>
                {screenerLoading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
              </div>
            </div>

            {screenerError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {screenerError}
              </div>
            )}

            {screenerLoading && (
              <div className="glass rounded-2xl border border-white/5 p-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading 120-day foreign flow data...</p>
                <p className="text-gray-600 text-[10px] mt-1">Mungkin butuh 2-4 detik</p>
              </div>
            )}

            {!screenerLoading && filteredScreener.length > 0 && (
              <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] min-w-[900px]">
                    <thead className="bg-white/[0.02] border-b border-border/50 text-muted-foreground uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-3 text-left w-8">#</th>
                        <th className="px-3 py-3 text-left">Saham</th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f1d')}>F.1D <SortIcon col="f1d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f7d')}>F.7D <SortIcon col="f7d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f14d')}>F.14D <SortIcon col="f14d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f30d')}>F.30D <SortIcon col="f30d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f60d')}>F.60D <SortIcon col="f60d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f90d')}>F.90D <SortIcon col="f90d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('f120d')}>F.120D <SortIcon col="f120d" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('smart_money_score')}>SM <SortIcon col="smart_money_score" /></th>
                        <th className="px-3 py-3 text-right cursor-pointer hover:text-white" onClick={() => handleSort('consistency')}>Konsistensi (B/S) <SortIcon col="consistency" /></th>
                        <th className="px-3 py-3 text-center">Signal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredScreener.map((r, i) => {
                        const activePeriodKey = `f${selectedPeriod}` as keyof ScreenerRow;
                        const activePeriodVal = r[activePeriodKey] as number;
                        return (
                          <tr key={r.stock_code}
                            className="tr-hover cursor-pointer group"
                            onClick={() => drillDown(r.stock_code)}>
                            <td className="px-3 py-2.5 text-gray-600 font-mono">{i + 1}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="font-black text-white">{r.stock_code}</p>
                                  <p className="text-[8px] text-gray-500 truncate max-w-[120px]">{r.company_name ?? '—'}</p>
                                  {r.sector && <p className="text-[8px] text-gray-600">{r.sector}</p>}
                                </div>
                                {r.whale_signal && <span className="text-[9px]" title="Whale Signal">🐋</span>}
                                <ChevronRight className="w-3 h-3 text-gray-700 group-hover:text-gold-400 ml-auto transition-colors" />
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f1d}   highlight={selectedPeriod==='1d'} /></td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f7d}   highlight={selectedPeriod==='7d'} /></td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f14d}  highlight={selectedPeriod==='14d'} /></td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f30d}  highlight={selectedPeriod==='30d'} /></td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f60d}  highlight={selectedPeriod==='60d'} /></td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f90d}  highlight={selectedPeriod==='90d'} /></td>
                            <td className="px-3 py-2.5 text-right"><FlowCell value={r.f120d} highlight={selectedPeriod==='120d'} /></td>
                            <td className="px-3 py-2.5 text-right"><SMScoreBadge score={r.smart_money_score} /></td>
                            <td className="px-3 py-2.5 text-right font-mono">
                              {(() => {
                                const buyDays = (r[`buy_days_${selectedPeriod}` as keyof ScreenerRow] as number) ?? 0;
                                const sellDays = (r[`sell_days_${selectedPeriod}` as keyof ScreenerRow] as number) ?? 0;
                                const totalDays = buyDays + sellDays;
                                const consistencyPct = totalDays > 0 ? (buyDays / totalDays) * 100 : 0;
                                const pctColor = consistencyPct >= 75 ? 'text-emerald-400 font-extrabold'
                                               : consistencyPct >= 60 ? 'text-blue-400 font-bold'
                                               : consistencyPct <= 30 ? 'text-red-400 font-bold'
                                               : 'text-gray-500';
                                if (totalDays === 0) return <span className="text-gray-600">—</span>;
                                return (
                                  <span className="inline-flex items-center gap-1 justify-end w-full">
                                    <span className="text-blue-400">{buyDays}D</span>
                                    <span className="text-gray-700">/</span>
                                    <span className="text-red-400">{sellDays}D</span>
                                    <span className={`text-[9px] font-sans ${pctColor} ml-0.5`}>
                                      ({consistencyPct.toFixed(0)}%)
                                    </span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {r.signal && (
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                                  r.signal?.includes('BUY') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                  r.signal?.includes('SELL')? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                  'bg-white/5 border-white/10 text-gray-400'
                                }`}>{r.signal}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!screenerLoading && screenerData.length > 0 && filteredScreener.length === 0 && (
              <div className="text-center py-16 text-gray-600">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Tidak ada data dengan filter saat ini</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'chart' && (
          <>
            <div className="glass rounded-2xl border border-border/50 p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={chartInput}
                    onChange={e => setChartInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && chartInput && (setSelectedStock(chartInput), loadChart(chartInput))}
                    placeholder="Kode saham (e.g. BBCA)"
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold-400/40"
                  />
                </div>
                <button
                  onClick={() => { if (chartInput) { setSelectedStock(chartInput); loadChart(chartInput); } }}
                  disabled={!chartInput || chartLoading}
                  className="px-5 py-2.5 bg-gold-400/15 border border-gold-400/30 rounded-xl text-gold-400 font-bold text-sm hover:bg-gold-400/25 transition-colors disabled:opacity-40">
                  {chartLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Chart'}
                </button>

                {selectedStock && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Link href={`/stock/${selectedStock}`} prefetch={false}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[11px] font-bold hover:bg-emerald-500/20 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Stock Detail
                    </Link>
                    <Link href={`/broker-tracker?code=${selectedStock}`} prefetch={false}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-yellow-500/30 bg-yellow-400/10 text-yellow-300 text-[11px] font-bold hover:bg-yellow-400/20 transition-colors">
                      <BarChart2 className="w-3.5 h-3.5" /> Broker Tracker
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {!selectedStock && !chartLoading && (
              <div className="text-center py-20 text-gray-600">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold">Pilih saham dari Screener atau masukkan kode saham</p>
                <p className="text-[11px] mt-1 opacity-60">Chart harga vs kumulatif foreign flow akan tampil di sini</p>
                <button onClick={() => setActiveTab('screener')}
                  className="mt-4 px-4 py-2 rounded-xl border border-gold-400/30 text-gold-400 text-[11px] font-bold hover:bg-gold-400/10 transition-colors">
                  Buka Foreign Screener →
                </button>
              </div>
            )}

            {chartLoading && (
              <div className="glass rounded-2xl border border-white/5 p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading chart {selectedStock}...</p>
              </div>
            )}

            {chartError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {chartError}
              </div>
            )}

            {!chartLoading && chartWithCum.length > 0 && (
              <>
                {chartMetrics && (
                  <div className="glass rounded-2xl border border-border/50 p-5 shadow-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-black text-white">{chartMetrics.stock_code}</h2>
                        <p className="text-[11px] text-gray-400">{chartMetrics.company_name ?? ''}</p>
                        {chartMetrics.sector && <p className="text-[9px] text-gray-600 mt-0.5">{chartMetrics.sector}</p>}
                      </div>
                      {chartMetrics.whale_signal && (
                        <span className="text-sm px-2.5 py-1 rounded-lg bg-yellow-400/10 border border-yellow-500/20 text-yellow-300 font-bold">🐋 Whale Signal</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {PERIODS.map(p => (
                        <PeriodBadge key={p.key} label={`F.${p.label}`} value={(chartMetrics as any)[`f${p.key}`]} />
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3 text-[10px]">
                      {chartMetrics.smart_money_score != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Smart Money</span>
                          <SMScoreBadge score={chartMetrics.smart_money_score} />
                        </div>
                      )}
                      {chartMetrics.broker_net != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Broker Net</span>
                          <span className={`font-mono font-bold ${flowCls(chartMetrics.broker_net)}`}>{fmt(chartMetrics.broker_net)}</span>
                        </div>
                      )}
                      {chartMetrics.broker_net_5d != null && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Broker 5D</span>
                          <span className={`font-mono font-bold ${flowCls(chartMetrics.broker_net_5d)}`}>{fmt(chartMetrics.broker_net_5d)}</span>
                        </div>
                      )}
                      {chartMetrics.tactical_signal && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500">Taktis</span>
                          <span className={`font-bold px-1.5 py-0.5 rounded border text-[9px] ${
                            chartMetrics.tactical_signal?.includes('BUY')  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            chartMetrics.tactical_signal?.includes('SELL') ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                            'bg-white/5 border-white/10 text-gray-400'
                          }`}>{chartMetrics.tactical_signal}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="glass rounded-2xl border border-border/50 p-5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-gold-400" />
                        <h3 className="text-sm font-black text-white">
                          Harga vs Kumulatif Foreign Flow — {chartPeriod === 365 ? '1Y' : chartPeriod === 730 ? '2Y' : `${chartPeriod}D`}
                        </h3>
                      </div>
                      <p className="text-[9px] text-gray-600">
                        Candlestick = harga (kiri) · Area biru = kumulatif net foreign (kanan)
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                      {([
                        { days: 120, label: '120D' },
                        { days: 180, label: '180D' },
                        { days: 365, label: '1Y' },
                        { days: 730, label: '2Y' }
                      ]).map(opt => (
                        <button
                          key={opt.days}
                          onClick={() => {
                            setChartPeriod(opt.days);
                            if (selectedStock) loadChart(selectedStock, opt.days);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            chartPeriod === opt.days
                              ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartWithCum} margin={{ left: 0, right: 0, top: 4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--glass-border)" fontSize={9} tickFormatter={d => d.slice(5)} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                        <YAxis
                          yAxisId="price"
                          stroke="var(--glass-border)"
                          fontSize={9}
                          tickFormatter={v => v.toLocaleString('id-ID')}
                          width={60}
                          tick={{ fill: 'currentColor', opacity: 0.5 }}
                          domain={[
                            (dataMin: number) => Math.max(0, Math.floor(dataMin * 0.98)),
                            (dataMax: number) => Math.ceil(dataMax * 1.02)
                          ]}
                        />
                        <YAxis yAxisId="flow" orientation="right" stroke="var(--glass-border)" fontSize={9}
                          tickFormatter={v => fmt(v)} width={60} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff04' }} />
                        <ReferenceLine yAxisId="flow" y={0} stroke="var(--glass-border)" />
                        <Area yAxisId="flow" type="monotone" dataKey="cum_foreign" name="Kum. Foreign"
                          stroke="#3b82f6" fill="#3b82f660" strokeWidth={2} dot={false} />
                        <Bar yAxisId="price" dataKey="candle" name="Harga" shape={<Candlestick />} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Daily Foreign Bar */}
                <div className="glass rounded-2xl p-5 shadow-xl">
                  <h3 className="text-xs font-black text-foreground mb-4">Daily Net Foreign Flow</h3>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartWithCum} margin={{ left: 0, right: 0, top: 4, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                        <XAxis dataKey="date" stroke="var(--glass-border)" fontSize={9} tickFormatter={d => d.slice(5)} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                        <YAxis stroke="var(--glass-border)" fontSize={9} tickFormatter={v => fmt(v)} width={60} tick={{ fill: 'currentColor', opacity: 0.5 }} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ffffff04' }} />
                        <ReferenceLine y={0} stroke="var(--glass-border)" />
                        <Bar dataKey="net_foreign" name="Daily Net" maxBarSize={16} radius={[2, 2, 0, 0]}>
                          {chartWithCum.map((d, i) => (
                            <Cell key={i} fill={d.net_foreign >= 0 ? '#3b82f6' : '#ef4444'} opacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 4 — DIVERGENCE RADAR
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'divergence' && (
          <>
            {/* Pattern filter */}
            <div className="flex flex-wrap gap-2">
              {(['ALL', 'TRIPLE_BUY', 'BOTH_BUY', 'FOREIGN_BUY_LOCAL_SELL', 'LOCAL_BUY_FOREIGN_SELL', 'BOTH_SELL'] as const).map(p => {
                const cfg = p === 'ALL' ? null : DIV_CONFIG[p];
                const count = p === 'ALL' ? divData.length : divData.filter(r => r.divergence_pattern === p).length;
                return (
                  <button key={p} onClick={() => setDivFilter(p)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                      divFilter === p
                        ? cfg ? `${cfg.bg} ${cfg.border} ${cfg.textCol}` : 'bg-gold-400/15 border-gold-400/30 text-gold-400'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    }`}>
                    {cfg?.icon} {p === 'ALL' ? 'Semua' : cfg?.label} {count > 0 && <span className="opacity-60">({count})</span>}
                  </button>
                );
              })}
              {divLoading && <Loader2 className="w-4 h-4 text-blue-400 animate-spin self-center ml-2" />}
            </div>

            {divError && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" /> {divError}
              </div>
            )}

            {divLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[0,1,2,3,4,5].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />)}
              </div>
            )}

            {!divLoading && filteredDiv.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredDiv.map(r => {
                  const cfg = DIV_CONFIG[r.divergence_pattern] ?? DIV_CONFIG.NEUTRAL;
                  return (
                    <div key={r.stock_code} className={`${cfg.bg} rounded-2xl border ${cfg.border} p-4 shadow-xl relative overflow-hidden group`}>
                      {/* Pattern badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${cfg.textCol}`}>{cfg.label}</span>
                        {r.whale_signal && <span className="text-[10px]">🐋</span>}
                      </div>

                      {/* Stock info */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-base font-black text-white">{r.stock_code}</p>
                          <p className="text-[9px] text-gray-500 truncate max-w-[160px]">{r.company_name ?? '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">Rp {fmtPrice(r.close)}</p>
                          <p className={`text-[10px] font-bold ${(r.change_percent ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {(r.change_percent ?? 0) >= 0 ? '+' : ''}{(r.change_percent ?? 0).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Flow metrics */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-[9px]">
                        <div>
                          <p className="text-gray-600 mb-0.5">Foreign 30D</p>
                          <p className={`font-black font-mono ${flowCls(r.foreign_30d)}`}>{fmtSign(r.foreign_30d)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-0.5">Broker Net</p>
                          <p className={`font-black font-mono ${(r.broker_net ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.broker_net)}</p>
                        </div>
                        {r.smart_money_score != null && (
                          <div>
                            <p className="text-gray-600 mb-0.5">SM Score</p>
                            <SMScoreBadge score={r.smart_money_score} />
                          </div>
                        )}
                        {r.net_foreign_5d != null && (
                          <div>
                            <p className="text-gray-600 mb-0.5">Foreign 5D</p>
                            <p className={`font-black font-mono text-[9px] ${flowCls(r.net_foreign_5d)}`}>{fmtSign(r.net_foreign_5d)}</p>
                          </div>
                        )}
                      </div>

                      {/* Desc */}
                      <p className="text-[8px] text-gray-600 leading-relaxed border-t border-white/5 pt-2">{cfg.desc}</p>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => drillDown(r.stock_code)}
                          className="flex-1 text-center py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[9px] font-bold hover:bg-blue-500/25 transition-colors">
                          📈 Chart
                        </button>
                        <Link href={`/broker-tracker?code=${r.stock_code}`} prefetch={false}
                          className="flex-1 text-center py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-500/20 text-yellow-300 text-[9px] font-bold hover:bg-yellow-400/20 transition-colors">
                          📊 Broker
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!divLoading && divData.length > 0 && filteredDiv.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <Brain className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Tidak ada saham dengan pattern ini</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Sector Drilldown Dialog ────────────────────────────────────────────── */}
      {selectedSectorDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-lg font-black text-white">{selectedSectorDetails}</h3>
                <p className="text-[10px] text-gray-400">Detail Foreign Flow — {PERIODS.find(p => p.key === sectorPeriod)?.label}</p>
              </div>
              <button onClick={() => setSelectedSectorDetails(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {sectorDetailsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : sectorDetailsData.length === 0 ? (
                <p className="text-center text-gray-500 py-10 text-sm">Tidak ada data saham untuk sektor ini.</p>
              ) : (
                <div className="space-y-2">
                  {sectorDetailsData.map(r => {
                    const col = `f${sectorPeriod}` as keyof ScreenerRow;
                    const val = (r[col] as number) || 0;
                    return (
                      <div key={r.stock_code} onClick={() => drillDown(r.stock_code)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">{r.stock_code}</span>
                            {r.whale_signal && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-300 border border-yellow-500/20">Whale</span>}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{r.company_name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-mono font-black ${val >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {fmtSign(val)}
                          </p>
                          <p className="text-[9px] text-gray-500">
                            Harga: Rp {fmtPrice(r.close)} <span className={`ml-1 ${(r.change_percent ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(r.change_percent ?? 0) >= 0 ? '+' : ''}{(r.change_percent ?? 0).toFixed(1)}%</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Group Drilldown Dialog ────────────────────────────────────────────── */}
      {selectedGroupDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div>
                <h3 className="text-lg font-black text-white">{selectedGroupDetails}</h3>
                <p className="text-[10px] text-gray-400">Detail Foreign Flow — {PERIODS.find(p => p.key === groupPeriod)?.label}</p>
              </div>
              <button onClick={() => setSelectedGroupDetails(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {groupDetailsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : groupDetailsData.length === 0 ? (
                <p className="text-center text-gray-500 py-10 text-sm">Tidak ada data saham untuk konglomerat ini.</p>
              ) : (
                <div className="space-y-2">
                  {groupDetailsData.map(r => {
                    const col = `f${groupPeriod}` as keyof ScreenerRow;
                    const val = (r[col] as number) || 0;
                    return (
                      <div key={r.stock_code} onClick={() => drillDown(r.stock_code)} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-white">{r.stock_code}</span>
                            {r.whale_signal && <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-300 border border-yellow-500/20">Whale</span>}
                          </div>
                          <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{r.company_name}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-mono font-black ${val >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {fmtSign(val)}
                          </p>
                          <p className="text-[9px] text-gray-500">
                            Harga: Rp {fmtPrice(r.close)} <span className={`ml-1 ${(r.change_percent ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{(r.change_percent ?? 0) >= 0 ? '+' : ''}{(r.change_percent ?? 0).toFixed(1)}%</span>
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
