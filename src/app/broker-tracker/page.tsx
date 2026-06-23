'use client';
export const dynamic = 'force-dynamic'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  LineChart, Line, ComposedChart, Area, Legend,
} from 'recharts';
import {
  BarChart3, Loader2, Search, Activity, TrendingUp, TrendingDown,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp, Users, Calendar,
  BarChart2, LineChart as LineChartIcon, Layers, X, Zap,
  AlertTriangle, Shield, ArrowUpRight, ArrowDownRight, Star,
  ExternalLink, Brain, Download, Globe, UserPlus, Minus,
  Eye, Radio, Target
} from 'lucide-react';
import Link from 'next/link';
import { formatRupiah, formatNumber } from '@/lib/utils';
import { InventoryChart, type InvCandle, type InvBrokerRow } from '../../../components/inventory-chart';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TrackerRow {
  broker_code: string;
  broker_name: string;
  broker_lf?: 'L' | 'F' | null;   // ★ Local or Foreign broker
  is_prime?: boolean | null;        // ★ Prime broker flag
  buy_val: number;
  sell_val: number;
  buy_lot: number;
  sell_lot: number;
  buy_freq: number;
  sell_freq: number;
  net_val: number;
  net_lot: number;
  total_freq: number;
  buy_avg_price: number;
  sell_avg_price: number;
  buy_consistency_pct?: number | null;
  net_buy_days?: number | null;
  total_days?: number | null;
  floating_pnl?: number | null;
}

interface ScreenerRow {
  stock_code: string;
  sector: string | null;
  company_name: string | null;
  latest_price: number | null;
  price_change_pct: number | null;
  total_buy: number;
  total_sell: number;
  net_accumulation: number;
  net_miliar: number | null;
  total_value: number;
  broker_count: number;
  buy_broker_count: number;
  sell_broker_count: number;
  // ★ New columns
  sell_pressure_pct: number | null;    // % sell vs buy — lower = cleaner
  local_net_miliar: number | null;     // local broker net
  foreign_net_miliar: number | null;   // foreign broker net
  foreign_buy_pct: number | null;      // % buy yang dari foreign broker
  top_buyer_pct: number | null;
  top_buyer_code: string | null;
  whale_signal: boolean | null;
  big_player_anomaly: boolean | null;
  smart_money_score: number | null;
  smart_signal: string | null;
  // Keep legacy optional
  power_score?: number | null;
  composite_score?: number | null;
  tactical_signal?: string | null;
  insider_score?: number | null;
  insider_signals?: string | null;
  insider_corp_change?: number | null;
  volume_spike_type?: string | null;
}

interface HistoryRow {
  date: string;
  daily_net_val: number;
  daily_buy_val: number;
  daily_sell_val: number;
  daily_net_lot: number;
  daily_buy_freq: number;
  daily_sell_freq: number;
  daily_avg_price: number;
}

interface PriceRow {
  date: string;
  close: number;
  change_percent: number;
  volume: number;
  net_foreign_value: number;
  whale_signal: boolean;
  big_player_anomaly: boolean;
}

interface StockContext {
  stock_code: string;
  sector: string | null;
  close: number;
  change_percent: number;
  foreign_30d: number;
  broker_net: number;
  whale_signal: boolean;
  big_player_anomaly: boolean;
  aov_ratio_ma20: number;
  smart_money_score: number;
  signal: string | null;
  broker_net_miliar: number | null;
  local_smart_miliar_saham: number | null;
  foreign_smart_miliar_saham: number | null;
  ksei_confirmation: string | null;
}

interface DivergenceData {
  broker_net_val: number;
  broker_buy: number;
  broker_sell: number;
  foreign_broker_net_val: number;
  foreign_broker_buy: number;
  foreign_broker_sell: number;
  foreign_net_val: number;
  foreign_buy: number;
  foreign_sell: number;
  inst_broker_net_val?: number;
  retail_broker_net_val?: number;
  smart_broker_net_val?: number;
  divergence_type: 'LOCAL_BUY_FOREIGN_SELL' | 'LOCAL_SELL_FOREIGN_BUY' | 'BOTH_BUY' | 'BOTH_SELL' | 'NEUTRAL';
}

interface BrokerProfile {
  summary: {
    broker_code: string;
    broker_name: string;
    active_days: number;
    total_stocks: number;
    total_buy_value: number;
    total_sell_value: number;
    net_value: number;
    buy_ratio_pct: number;
  }[];
  favorites: {
    stock_code: string;
    buy_value: number;
    sell_value: number;
    net_value: number;
    total_transactions: number;
    avg_buy_price: number;
  }[];
}

interface MultiBrokerRow {
  date: string;
  broker_code: string;
  net_val: number;
  net_lot: number;
}

interface StanceRow {
  broker_code: string;
  broker_name: string;
  current_net: number;
  prev_net: number;
  stance_type: 'REVERSAL_BUY' | 'REVERSAL_SELL' | 'NEW_ENTRANT' | 'CONTINUATION_BUY' | 'CONTINUATION_SELL' | 'NEUTRAL';
}

interface WhaleTimingRow {
  share_code: string;
  investor_name: string;
  investor_type: string;
  local_foreign: string;
  first_seen_date: string;
  latest_date: string;
  first_percentage: number;
  latest_percentage: number;
  latest_shares: number;
  est_entry_price: number;
  current_price: number;
  return_since_entry: number;
  holding_days: number;
  position_trend: string;
  whale_verdict: string;
}

interface TacticalSignalData {
  tactical: {
    stock_code: string;
    trading_date: string;
    close: number;
    change_percent: number;
    net_foreign_1d: number;
    net_foreign_5d: number;
    broker_net_5d: number;
    tactical_signal: string;
  } | null;
  stealth: {
    stock_code: string;
    date: string;
    price: number;
    cp_flow_miliar: number;
    foreign_cp_miliar: number;
    stealth_signal: string;
  } | null;
  positioning: {
    stock_code: string;
    total_inst_pct: number;
    prev_inst_pct: number;
    mom_change_pct: number;
    strategic_signal: string;
  } | null;
}

interface InsiderSignalData {
  alerts: {
    report_date: string;
    share_code: string;
    investor_name: string;
    investor_type: string;
    nationality: string;
    prev_percentage: number;
    curr_percentage: number;
    pct_point_change: number;
    share_change: number;
    action: string;
    alert_level: string;
  }[];
  score: {
    code: string;
    corp_change: number;
    foreign_change: number;
    ind_change: number;
    insider_score: number;
    signals: string;
  } | null;
}


interface BrokerIntelRow {
  broker_code: string;
  broker_name: string;
  buy_value: number;
  sell_value: number;
  net_value: number;
  stock_count: number;
  transaction_count: number;
  buy_consistency_pct: number;
  net_buy_days: number;
  total_days: number;
  all_time_buy: number;
  all_time_net: number;
}

interface MarketBreadthRow {
  date: string;
  broker_count: number;
  stock_count: number;
  total_buy: number;
  total_sell: number;
  net_flow: number;
  buy_transactions: number;
  sell_transactions: number;
}

interface BrokerAlphaRow {
  broker_code: string;
  broker_name: string | null;
  stocks_accumulated: number;
  alpha_score: number;
  total_accumulation: number;
  total_net: number;
}

type ActiveTab = 'tracker' | 'screener' | 'intel' | 'inventory';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#6366f1', '#a855f7', '#d946ef', '#ef4444', '#84cc16', '#0ea5e9',
];

const COLOR_MAP = {
  emerald: { border: 'border-emerald-500/20', bg: 'bg-emerald-500/10', text: 'text-emerald-400', fill: '#10b981' },
  red:     { border: 'border-red-500/20',     bg: 'bg-red-500/10',     text: 'text-red-400',     fill: '#ef4444' },
  yellow:  { border: 'border-yellow-500/20',  bg: 'bg-yellow-400/10',  text: 'text-yellow-400',  fill: '#eab308' },
  blue:    { border: 'border-blue-500/20',    bg: 'bg-blue-500/10',    text: 'text-blue-400',    fill: '#3b82f6' },
  purple:  { border: 'border-purple-500/20',  bg: 'bg-purple-500/10',  text: 'text-purple-400',  fill: '#8b5cf6' },
  cyan:    { border: 'border-cyan-500/20',    bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    fill: '#06b6d4' },
} as const;

// ─── Tactical Signal Configs ──────────────────────────────────────────────────

const TACTICAL_SIGNAL_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string; icon: string; priority: number
}> = {
  STRONG_BUY:    { label: 'Strong Buy 🚀',    color: 'text-emerald-300', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', icon: '🚀', priority: 0 },
  MOMENTUM_BUY:  { label: 'Momentum Buy ⚡',  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '⚡', priority: 1 },
  BUY:           { label: 'Buy Signal 📈',    color: 'text-emerald-400', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', icon: '📈', priority: 2 },
  NEUTRAL:       { label: 'Neutral ⚪',       color: 'text-gray-400',    bg: 'bg-white/5',        border: 'border-white/10',       icon: '⚪', priority: 3 },
  SELL:          { label: 'Sell Signal 📉',   color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     icon: '📉', priority: 4 },
  MOMENTUM_SELL: { label: 'Momentum Sell ⚡', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: '🔻', priority: 5 },
  STRONG_SELL:   { label: 'Strong Sell 🔴',   color: 'text-red-300',     bg: 'bg-red-500/15',     border: 'border-red-500/40',     icon: '🔴', priority: 6 },
};

const STEALTH_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  STEALTH_ACC:  { label: 'Stealth Acc 🤫',  color: 'text-purple-400', icon: '🤫' },
  STEALTH_DIST: { label: 'Stealth Dist 👀', color: 'text-orange-400', icon: '👀' },
};


const DIVERGENCE_CONFIG = {
  LOCAL_BUY_FOREIGN_SELL: {
    label: 'Local Akumulasi, Asing Jual',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: '🟢',
    desc: 'Bandar lokal agresif beli saat asing distribusi — sinyal akumulasi institusi lokal.',
  },
  LOCAL_SELL_FOREIGN_BUY: {
    label: 'Asing Akumulasi, Local Jual',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: '🔵',
    desc: 'Foreign masuk, broker lokal keluar — waspadai konflik kepentingan.',
  },
  BOTH_BUY: {
    label: 'Konfirmasi Dua Arah — Strong Buy',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-500/30',
    icon: '⭐',
    desc: 'Local dan asing sama-sama net buy — conviction tertinggi.',
  },
  BOTH_SELL: {
    label: 'Distribusi Masif',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '🔴',
    desc: 'Local dan asing sama-sama net sell — distribusi masif.',
  },
  NEUTRAL: {
    label: 'Netral',
    color: 'text-gray-400',
    bg: 'bg-white/5',
    border: 'border-white/10',
    icon: '⚪',
    desc: 'Tidak ada divergence signifikan pada periode ini.',
  },
};

const STANCE_CFG = {
  REVERSAL_BUY:       { label:'Reversal Buy 🔄',      bg:'bg-emerald-500/15', border:'border-emerald-500/30', text:'text-emerald-400', icon:<RefreshCw className="w-3 h-3"/> },
  NEW_ENTRANT:        { label:'New Entrant 🆕',        bg:'bg-blue-500/15',    border:'border-blue-500/30',    text:'text-blue-400',    icon:<UserPlus className="w-3 h-3"/> },
  CONTINUATION_BUY:   { label:'Continuation ➡️',      bg:'bg-white/5',        border:'border-white/10',       text:'text-gray-300',    icon:<ArrowUpRight className="w-3 h-3"/> },
  REVERSAL_SELL:      { label:'Reversal Sell 🔄',      bg:'bg-red-500/15',     border:'border-red-500/30',     text:'text-red-400',     icon:<RefreshCw className="w-3 h-3"/> },
  CONTINUATION_SELL:  { label:'Exit ➡️',               bg:'bg-white/5',        border:'border-white/10',       text:'text-gray-500',    icon:<ArrowDownRight className="w-3 h-3"/> },
  NEUTRAL:            { label:'Neutral',               bg:'bg-white/5',        border:'border-white/5',        text:'text-gray-600',    icon:<Minus className="w-3 h-3"/> },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (v: number) => {
  if (v == null || isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a >= 1e12) return `${(v / 1e12).toFixed(2)} T`;
  if (a >= 1e9)  return `${(v / 1e9).toFixed(2)} M`;
  if (a >= 1e6)  return `${(v / 1e6).toFixed(1)} Jt`;
  return v.toLocaleString('id-ID');
};
const fmtPrice  = (v: number) => (v ? Math.round(v).toLocaleString('id-ID') : '—');
const fmtLot    = (v: number) => (v ? Math.abs(v).toLocaleString('id-ID') : '—');
const safeFixed = (v: number | null | undefined, d = 1) =>
  v != null && !isNaN(v) ? v.toFixed(d) : '—';

// ─── Tooltip components ───────────────────────────────────────────────────────

const BrokerBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value ?? 0;
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-3 text-[11px] shadow-2xl">
      <p className="text-white font-black mb-1">{label}</p>
      <p className={`font-mono font-bold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}{fmt(val)}
      </p>
    </div>
  );
};

const BreadthTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-3 text-[11px] shadow-2xl min-w-[160px]">
      <p className="text-white font-black mb-1">{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex justify-between gap-4">
          <span className="text-gray-400">{e.name}</span>
          <span className="font-bold" style={{color:e.color}}>{fmt(e.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── FlowBar ──────────────────────────────────────────────────────────────────

const FlowBar = ({ buy, sell }: { buy: number; sell: number }) => {
  const total = buy + sell;
  const buyPct = total > 0 ? (buy / total) * 100 : 50;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden w-20 bg-background">
      <div style={{ width: `${buyPct}%` }} className="bg-emerald-500" />
      <div style={{ width: `${100 - buyPct}%` }} className="bg-red-500" />
    </div>
  );
};

// ─── ConvictionBar ────────────────────────────────────────────────────────────

const ConvictionBar = ({ buyDays, totalDays, pct }: { buyDays: number; totalDays: number; pct: number }) => {
  const color = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-background rounded-full overflow-hidden w-16">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-gray-500 font-mono whitespace-nowrap">{buyDays}/{totalDays}d</span>
    </div>
  );
};

// ─── TopBrokerCards ───────────────────────────────────────────────────────────

const TopBrokerCards = ({
  rows, side, totalBrokers,
}: { rows: TrackerRow[]; side: 'buy' | 'sell'; totalBrokers: number }) => {
  const isBuy  = side === 'buy';
  const top3   = rows.slice(0, 3);
  const colors = COLOR_MAP[isBuy ? 'emerald' : 'red'];
  const total  = rows.reduce((s, r) => s + Math.abs(r.net_val), 0);

  return (
    <div className={`bg-card rounded-2xl border ${colors.border} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-black ${colors.text}`}>
          {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          Top 3 Net {isBuy ? 'Buyers' : 'Sellers'}
        </div>
        <span className="text-[10px] text-gray-500">{totalBrokers} brokers</span>
      </div>
      <div className="space-y-3">
        {top3.length === 0 && <p className="text-[10px] text-gray-600 text-center py-2">No data</p>}
        {top3.map((r, i) => {
          const netAbs = Math.abs(r.net_val);
          const barPct = total > 0 ? (netAbs / total) * 100 : 0;
          return (
            <div key={r.broker_code} className="flex items-center gap-3">
              <span className={`text-xs font-black w-4 text-center ${
                i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : 'text-amber-700'
              }`}>{i + 1}</span>
              <span className="text-sm font-black text-white w-14 shrink-0">{r.broker_code}</span>
              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${barPct}%`, backgroundColor: colors.fill }} />
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${colors.text}`}>{Math.round(barPct)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── SortIcon ─────────────────────────────────────────────────────────────────

const SortIcon = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) => {
  if (!active) return <ChevronDown className="w-3 h-3 opacity-20" />;
  return dir === 'desc'
    ? <ChevronDown className="w-3 h-3 text-gold-400" />
    : <ChevronUp   className="w-3 h-3 text-gold-400" />;
};

// ─── SmartMoneyScoreCard ──────────────────────────────────────────────────────

const SmartMoneyScoreCard = ({ ctx, currentPrice }: { ctx: StockContext; currentPrice: number | null }) => {
  const scoreColor =
    ctx.smart_money_score >= 4 ? 'text-emerald-400' :
    ctx.smart_money_score >= 2 ? 'text-yellow-400'  : 'text-red-400';

  return (
    <div className="glass rounded-2xl border border-border/50 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-gold-400" />
        <span className="text-xs font-black text-foreground uppercase tracking-wider">Smart Money Context</span>
        {ctx.signal && (
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-400 font-bold border border-gold-400/20">
            {ctx.signal}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">SM Score</p>
          <p className={`text-2xl font-black ${scoreColor}`}>{ctx.smart_money_score ?? '—'}<span className="text-xs text-gray-600">/5</span></p>
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Harga</p>
          <p className="text-lg font-black text-white">{currentPrice ? fmtPrice(currentPrice) : (ctx.close ? fmtPrice(ctx.close) : '—')}</p>
          {ctx.change_percent != null && (
            <p className={`text-[10px] font-bold ${ctx.change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {ctx.change_percent >= 0 ? '+' : ''}{ctx.change_percent?.toFixed(2)}%
            </p>
          )}
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">Whale</p>
          <p className={`text-xl font-black ${ctx.whale_signal ? 'text-yellow-400' : 'text-gray-600'}`}>
            {ctx.whale_signal ? '🐋 ON' : '—'}
          </p>
          {ctx.big_player_anomaly && (
            <p className="text-[9px] text-orange-400 font-bold mt-0.5">Big Player !</p>
          )}
        </div>
        <div className="bg-background rounded-xl p-3 text-center">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">AOV/MA20</p>
          <p className={`text-lg font-black ${(ctx.aov_ratio_ma20 ?? 0) > 1.5 ? 'text-orange-400' : 'text-gray-300'}`}>
            {safeFixed(ctx.aov_ratio_ma20)}x
          </p>
        </div>
      </div>

      {ctx.ksei_confirmation && (
        <div className="flex items-center gap-2 bg-background rounded-xl px-3 py-2 mb-3">
          <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="text-[10px] text-gray-400">KSEI Confirm:</span>
          <span className="text-[10px] font-bold text-blue-400">{ctx.ksei_confirmation}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background rounded-xl px-3 py-2">
          <p className="text-[9px] text-gray-600 mb-0.5">Local Smart (KSEI)</p>
          <p className={`text-xs font-bold ${(ctx.local_smart_miliar_saham ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {ctx.local_smart_miliar_saham != null ? `${ctx.local_smart_miliar_saham >= 0 ? '+' : ''}${ctx.local_smart_miliar_saham.toFixed(1)} M` : '—'}
          </p>
        </div>
        <div className="bg-background rounded-xl px-3 py-2">
          <p className="text-[9px] text-gray-600 mb-0.5">Foreign Smart (KSEI)</p>
          <p className={`text-xs font-bold ${(ctx.foreign_smart_miliar_saham ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {ctx.foreign_smart_miliar_saham != null ? `${ctx.foreign_smart_miliar_saham >= 0 ? '+' : ''}${ctx.foreign_smart_miliar_saham.toFixed(1)} M` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ─── DivergenceCard ───────────────────────────────────────────────────────────

const DivergenceCard = ({ data }: { data: DivergenceData }) => {
  const cfg = DIVERGENCE_CONFIG[data.divergence_type] || DIVERGENCE_CONFIG.NEUTRAL;
  return (
    <div className={`bg-card rounded-2xl border ${cfg.border} p-4 shadow-xl`}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        <span className="text-xs font-black text-white uppercase tracking-wider">Divergence Detector</span>
        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} font-bold border ${cfg.border}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">{cfg.desc}</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-background rounded-xl p-3">
          <p className="text-[9px] text-gray-600 mb-1 uppercase tracking-wider">Broker Lokal</p>
          <p className={`text-sm font-black ${data.broker_net_val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.broker_net_val >= 0 ? '+' : ''}{fmt(data.broker_net_val)}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] text-emerald-600">B: {fmt(data.broker_buy)}</span>
            <span className="text-[9px] text-red-600">S: {fmt(data.broker_sell)}</span>
          </div>
        </div>
        <div className="bg-background rounded-xl p-3">
          <p className="text-[9px] text-gray-600 mb-1 uppercase tracking-wider">Broker Asing</p>
          <p className={`text-sm font-black ${data.foreign_broker_net_val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.foreign_broker_net_val >= 0 ? '+' : ''}{fmt(data.foreign_broker_net_val)}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] text-emerald-600">B: {fmt(data.foreign_broker_buy)}</span>
            <span className="text-[9px] text-red-600">S: {fmt(data.foreign_broker_sell)}</span>
          </div>
        </div>
        <div className="bg-background rounded-xl p-3">
          <p className="text-[9px] text-gray-600 mb-1 uppercase tracking-wider">Foreign Flow</p>
          <p className={`text-sm font-black ${data.foreign_net_val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {data.foreign_net_val >= 0 ? '+' : ''}{fmt(data.foreign_net_val)}
          </p>
          <div className="flex gap-2 mt-1">
            <span className="text-[9px] text-emerald-600">B: {fmt(data.foreign_buy)}</span>
            <span className="text-[9px] text-red-600">S: {fmt(data.foreign_sell)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};


// ─── TacticalSignalBanner ────────────────────────────────────────────────────

function TacticalSignalBanner({ data, loading }: { data: TacticalSignalData | null; loading: boolean }) {
  if (loading) return (
    <div className="shimmer rounded-2xl h-16" />
  );
  if (!data || (!data.tactical && !data.stealth && !data.positioning)) return null;

  const tact = data.tactical;
  const stealth = data.stealth;
  const pos = data.positioning;

  const tactCfg = tact?.tactical_signal
    ? (TACTICAL_SIGNAL_CONFIG[tact.tactical_signal] ?? TACTICAL_SIGNAL_CONFIG.NEUTRAL)
    : null;
  const stealthCfg = stealth?.stealth_signal
    ? (STEALTH_CONFIG[stealth.stealth_signal] ?? null)
    : null;

  return (
    <div className={`rounded-2xl border p-4 ${tactCfg?.bg ?? 'bg-card'} ${tactCfg?.border ?? 'border-white/5'} shadow-lg`}>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        {/* Tactical Signal */}
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Tactical Signal</p>
            <p className={`text-sm font-black ${tactCfg?.color ?? 'text-gray-400'}`}>
              {tactCfg?.label ?? '—'}
            </p>
            {tact && (
              <div className="flex gap-3 mt-1">
                <span className="text-[9px] text-gray-600">
                  Foreign 5d: <span className={`font-bold ${(tact.net_foreign_5d ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tact.net_foreign_5d != null ? `${tact.net_foreign_5d >= 0 ? '+' : ''}${(tact.net_foreign_5d / 1e9).toFixed(1)} M` : '—'}
                  </span>
                </span>
                <span className="text-[9px] text-gray-600">
                  Broker 5d: <span className={`font-bold ${(tact.broker_net_5d ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tact.broker_net_5d != null ? `${tact.broker_net_5d >= 0 ? '+' : ''}${(tact.broker_net_5d / 1e9).toFixed(1)} M` : '—'}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stealth Accumulation */}
        {stealthCfg && stealth && (
          <div className="bg-background rounded-xl px-3 py-2 border border-purple-500/20">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">KSEI Stealth</p>
            <p className={`text-xs font-black ${stealthCfg.color}`}>{stealthCfg.label}</p>
            <p className="text-[9px] text-gray-600 mt-0.5">
              CP: <span className="text-purple-400 font-bold">{stealth.cp_flow_miliar >= 0 ? '+' : ''}{stealth.cp_flow_miliar?.toFixed(1)} M</span>
            </p>
          </div>
        )}

        {/* Strategic Positioning */}
        {pos && pos.strategic_signal && pos.strategic_signal !== 'NEUTRAL' && (
          <div className="bg-background rounded-xl px-3 py-2 border border-blue-500/20">
            <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5">Inst. Positioning</p>
            <p className={`text-xs font-black ${(pos.mom_change_pct ?? 0) >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
              {pos.strategic_signal}
            </p>
            <p className="text-[9px] text-gray-600 mt-0.5">
              MoM: <span className={`font-bold ${(pos.mom_change_pct ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {pos.mom_change_pct >= 0 ? '+' : ''}{pos.mom_change_pct?.toFixed(2)}%
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WhaleTimingPanel ────────────────────────────────────────────────────────

const WHALE_VERDICT_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  ACCUMULATING: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  DISTRIBUTING: { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20'     },
  HOLDING:      { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20'    },
  NEW_POSITION: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20'  },
  EXITING:      { color: 'text-red-500',     bg: 'bg-red-500/15',     border: 'border-red-500/30'     },
};

function WhaleTimingPanel({ data, loading }: { data: WhaleTimingRow[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-white/5 p-4 animate-pulse">
        <div className="h-4 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    );
  }
  if (data.length === 0) return null;

  const highReturn = data.filter(w => w.return_since_entry >= 20);
  const accumulators = data.filter(w => w.whale_verdict === 'ACCUMULATING');

  return (
    <div className="bg-card rounded-2xl border border-white/5 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">🐋</span>
        <span className="text-xs font-black text-white uppercase tracking-wider">KSEI Whale Timing</span>
        <span className="ml-auto text-[10px] text-gray-500">{data.length} institutions</span>
      </div>

      {(highReturn.length > 0 || accumulators.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3 mt-2">
          {accumulators.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              🟢 {accumulators.length} sedang akumulasi
            </span>
          )}
          {highReturn.length > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
              💰 {highReturn.length} whale untung &gt;20%
            </span>
          )}
        </div>
      )}

      <div className="space-y-2 max-h-[340px] overflow-y-auto">
        {data.map((w, i) => {
          const verdictCfg = WHALE_VERDICT_CONFIG[w.whale_verdict] ?? { color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' };
          const returnPositive = (w.return_since_entry ?? 0) >= 0;
          const isPctChange = w.first_percentage !== w.latest_percentage;
          return (
            <div key={i} className={`rounded-xl p-3 border ${verdictCfg.bg} ${verdictCfg.border}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-white truncate max-w-[180px]">{w.investor_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${verdictCfg.bg} ${verdictCfg.color} ${verdictCfg.border}`}>
                      {w.whale_verdict}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-gray-500 border border-white/10">
                      {w.local_foreign === 'LOCAL' ? '🇮🇩' : '🌐'} {w.investor_type}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
                    <span className="text-[9px] text-gray-600">
                      Masuk: <span className="text-gray-400 font-bold">{w.first_seen_date}</span>
                    </span>
                    {w.est_entry_price > 0 && (
                      <span className="text-[9px] text-gray-600">
                        Avg entry: <span className="text-white font-mono font-bold">Rp {Math.round(w.est_entry_price).toLocaleString('id-ID')}</span>
                      </span>
                    )}
                    <span className="text-[9px] text-gray-600">
                      Hold: <span className="text-gray-400 font-bold">{w.holding_days}h</span>
                    </span>
                    {isPctChange && (
                      <span className="text-[9px] text-gray-600">
                        Pct: <span className="text-blue-400 font-bold">{w.first_percentage?.toFixed(2)}%</span>
                        <span className="text-gray-600"> → </span>
                        <span className={`font-bold ${w.latest_percentage > w.first_percentage ? 'text-emerald-400' : 'text-red-400'}`}>
                          {w.latest_percentage?.toFixed(2)}%
                        </span>
                      </span>
                    )}
                  </div>
                </div>
                {w.return_since_entry != null && w.est_entry_price > 0 && (
                  <div className={`text-right shrink-0 px-2.5 py-1.5 rounded-xl border ${
                    returnPositive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
                  }`}>
                    <p className={`text-xs font-black font-mono ${returnPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {returnPositive ? '+' : ''}{w.return_since_entry?.toFixed(1)}%
                    </p>
                    <p className="text-[8px] text-gray-600 mt-0.5">since entry</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── InsiderSignalCard ───────────────────────────────────────────────────────

const ALERT_LEVEL_CFG: Record<string, { color: string; bg: string; border: string }> = {
  HIGH:   { color: 'text-red-300',    bg: 'bg-red-500/15',    border: 'border-red-500/30'    },
  MEDIUM: { color: 'text-yellow-300', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30' },
  LOW:    { color: 'text-gray-400',   bg: 'bg-white/5',       border: 'border-white/10'      },
};

function InsiderSignalCard({ data, loading }: { data: InsiderSignalData | null; loading: boolean }) {
  if (loading) return (
    <div className="bg-card rounded-2xl border border-white/5 p-4 animate-pulse h-32" />
  );
  if (!data || (data.alerts.length === 0 && !data.score)) return null;

  const score = data.score;
  const highAlerts = data.alerts.filter(a => a.alert_level === 'HIGH');

  return (
    <div className="bg-card rounded-2xl border border-white/5 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">🔍</span>
        <span className="text-xs font-black text-white uppercase tracking-wider">KSEI Insider Signal</span>
        {highAlerts.length > 0 && (
          <span className="ml-auto text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse">
            ⚠ {highAlerts.length} HIGH ALERT
          </span>
        )}
      </div>

      {score && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: 'Score',      value: score.insider_score?.toString() ?? '—', color: (score.insider_score ?? 0) >= 2 ? 'text-emerald-400' : (score.insider_score ?? 0) >= 0 ? 'text-yellow-400' : 'text-red-400' },
            { label: 'Corp Chg',   value: `${(score.corp_change ?? 0) >= 0 ? '+' : ''}${score.corp_change?.toFixed(2)}%`, color: (score.corp_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Foreign',    value: `${(score.foreign_change ?? 0) >= 0 ? '+' : ''}${score.foreign_change?.toFixed(2)}%`, color: (score.foreign_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Individual', value: `${(score.ind_change ?? 0) >= 0 ? '+' : ''}${score.ind_change?.toFixed(2)}%`, color: (score.ind_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map((s, i) => (
            <div key={i} className="bg-background rounded-xl p-2 text-center">
              <p className="text-[9px] text-gray-600 uppercase mb-0.5">{s.label}</p>
              <p className={`text-xs font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {data.alerts.length > 0 && (
        <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
          {data.alerts.slice(0, 8).map((a, i) => {
            const lvlCfg = ALERT_LEVEL_CFG[a.alert_level] ?? ALERT_LEVEL_CFG.LOW;
            const isBuy = a.action === 'BUY' || a.pct_point_change > 0;
            return (
              <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${lvlCfg.bg} ${lvlCfg.border}`}>
                <span className={`text-[10px] font-black ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isBuy ? '▲' : '▼'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{a.investor_name}</p>
                  <p className="text-[9px] text-gray-600">{a.investor_type} · {a.report_date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-[10px] font-black ${isBuy ? 'text-emerald-400' : 'text-red-400'}`}>
                    {a.pct_point_change >= 0 ? '+' : ''}{a.pct_point_change?.toFixed(2)}pp
                  </p>
                  <p className="text-[9px] text-gray-600">{a.curr_percentage?.toFixed(2)}%</p>
                </div>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${lvlCfg.color} ${lvlCfg.bg} ${lvlCfg.border}`}>
                  {a.alert_level}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Screener Helper Cells ───────────────────────────────────────────────────

function ScreenerTacticalCell({ row }: { row: ScreenerRow }) {
  const sig = row.tactical_signal;
  if (!sig || sig === 'NEUTRAL') return <span className="text-gray-600 text-[10px]">—</span>;
  const cfg = TACTICAL_SIGNAL_CONFIG[sig];
  if (!cfg) return <span className="text-gray-500 text-[10px]">{sig}</span>;
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.icon} {sig.replace('_', ' ')}
    </span>
  );
}

function ScreenerInsiderCell({ row }: { row: ScreenerRow }) {
  const score = row.insider_score;
  if (score == null) return <span className="text-gray-600 text-[10px]">—</span>;
  const color = score >= 2 ? 'text-emerald-400' : score >= 0 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div>
      <span className={`text-xs font-black font-mono ${color}`}>{score >= 0 ? '+' : ''}{score}</span>
      {row.insider_corp_change != null && (
        <p className={`text-[9px] ${row.insider_corp_change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          Corp {row.insider_corp_change >= 0 ? '+' : ''}{row.insider_corp_change?.toFixed(1)}%
        </p>
      )}
    </div>
  );
}

function ScreenerVolumeSpike({ row }: { row: ScreenerRow }) {
  const spike = row.volume_spike_type;
  if (!spike) return <span className="text-gray-600 text-[10px]">—</span>;
  const colors: Record<string, string> = {
    ULTRA_SPIKE:  'text-red-300 bg-red-500/15 border-red-500/30',
    STRONG_SPIKE: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    SPIKE:        'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
  };
  const cls = colors[spike] ?? 'text-gray-400 bg-white/5 border-white/10';
  return (
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${cls}`}>
      {spike.replace('_', ' ')}
    </span>
  );
}

// ─── BrokerProfileDrawer ──────────────────────────────────────────────────────

const BrokerProfileDrawer = ({
  brokerCode, onClose, currentPrice,
}: { brokerCode: string | null; onClose: () => void; currentPrice: number | null }) => {
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!brokerCode) return;
    const controller = new AbortController();
    setLoading(true);
    setProfile(null);
    fetch(`/api/broker-tracker?action=broker_profile&broker_code=${brokerCode}`, { signal: controller.signal })
      .then(r => r.json())
      .then(j => { if (!controller.signal.aborted) setProfile(j.error ? null : j); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [brokerCode]);

  useEffect(() => {
    if (!brokerCode) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [brokerCode, onClose]);

  if (!brokerCode) return null;

  const sum = profile?.summary?.[0];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md bg-background border-l border-white/10 h-full overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-white/5 px-5 py-4 flex items-center gap-3 z-10">
          <div className="p-2 bg-yellow-400/10 rounded-xl">
            <Users className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">{brokerCode}</h2>
            <p className="text-[10px] text-gray-500">Broker Profile</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
            </div>
          )}

          {!loading && sum && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Hari Aktif',    value: sum.active_days?.toLocaleString() ?? '—' },
                  { label: 'Total Saham',   value: sum.total_stocks?.toLocaleString() ?? '—' },
                  { label: 'Total Buy',     value: fmt(sum.total_buy_value) },
                  { label: 'Total Sell',    value: fmt(sum.total_sell_value) },
                  { label: 'Net Value',     value: fmt(sum.net_value),
                    color: sum.net_value >= 0 ? 'text-emerald-400' : 'text-red-400' },
                  { label: 'Buy Ratio',     value: `${safeFixed(sum.buy_ratio_pct)}%`,
                    color: (sum.buy_ratio_pct ?? 0) >= 55 ? 'text-emerald-400' : 'text-red-400' },
                ].map((s, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-sm font-black ${s.color ?? 'text-white'}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {sum.broker_name && (
                <div className="bg-card rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Nama Broker</p>
                  <p className="text-xs text-gray-300">{sum.broker_name}</p>
                </div>
              )}

              {profile?.favorites && profile.favorites.length > 0 && (
                <div className="bg-card rounded-2xl border border-white/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[10px] uppercase tracking-widest font-black text-yellow-400">
                      Top Saham
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {profile.favorites.map((f, i) => {
                      const floatPnl = currentPrice && f.avg_buy_price
                        ? ((currentPrice - f.avg_buy_price) / f.avg_buy_price) * 100
                        : null;
                      return (
                        <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-white/[0.02]">
                          <span className="text-[10px] text-gray-600 w-4 font-mono">{i + 1}</span>
                          <span className="text-sm font-black text-white w-12 shrink-0">{f.stock_code}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-bold ${f.net_value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {f.net_value >= 0 ? '+' : ''}{fmt(f.net_value)}
                            </p>
                            {f.avg_buy_price > 0 && (
                              <p className="text-[9px] text-gray-500">avg buy: {fmtPrice(f.avg_buy_price)}</p>
                            )}
                          </div>
                          {floatPnl != null && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              floatPnl >= 0
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                              {floatPnl >= 0 ? '+' : ''}{floatPnl.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !sum && (
            <p className="text-[11px] text-gray-600 text-center py-8">Data broker tidak tersedia</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Tactical Intel Header (Verdict Strip) ───────────────────────────────────

function VerdictStrip({ buyers, sellers, divergence, stockCtx }: {
  buyers: TrackerRow[]; sellers: TrackerRow[]
  divergence: DivergenceData | null; stockCtx: StockContext | null
}) {
  const netTotal = buyers.reduce((s,r) => s+r.net_val, 0) + sellers.reduce((s,r) => s+r.net_val, 0);
  const validC   = buyers.slice(0, 5).filter(r => r.buy_consistency_pct != null);
  const avgC     = validC.length > 0 ? validC.reduce((s,r) => s+(r.buy_consistency_pct??0), 0) / validC.length : 0;
  const stars    = avgC >= 70 ? 5 : avgC >= 55 ? 4 : avgC >= 40 ? 3 : avgC >= 25 ? 2 : 1;

  const localNet   = divergence?.broker_net_val ?? netTotal;   // all non-foreign (zero-sum mirror of foreign) — display only
  const foreignNet = divergence?.foreign_net_val ?? 0;          // EOD foreign flow — display only

  // ── Verdict from SMART (foreign brokers + local institutional) vs RETAIL.
  // Broker net is ZERO-SUM at stock level (local = -foreign always), so the old
  // "local vs foreign" verdict was a tautology that always read "Akumulasi Lokal"
  // whenever foreign sold. Real signal = smart-vs-retail + foreign EOD flow.
  const smartNet   = divergence?.smart_broker_net_val ?? (divergence?.foreign_broker_net_val ?? 0);
  const retailNet  = divergence?.retail_broker_net_val ?? 0;
  const foreignEod = divergence?.foreign_net_val ?? 0;

  const TH = 1_000_000; // 1 juta Rp threshold (hindari noise rounding)
  const smartSig   = Math.abs(smartNet)   > TH ? Math.sign(smartNet)   : 0;
  const retailSig  = Math.abs(retailNet)  > TH ? Math.sign(retailNet)  : 0;
  const foreignSig = Math.abs(foreignEod) > TH ? Math.sign(foreignEod) : 0;

  let verdictLabel = 'Sinyal Netral', color = 'yellow';
  let desc = 'Belum ada sinyal akumulasi atau distribusi yang dominan.';

  const lFmt = (v: number) => `${v >= 0 ? '+' : ''}${(v/1e9).toFixed(2)} M`;

  if (smartSig > 0 && retailSig < 0) {
    verdictLabel = 'Akumulasi Bandar 🟢'; color = 'emerald';
    desc = `Smart money (broker asing + institusi lokal) net buy ${lFmt(smartNet)} sementara retail net jual ${lFmt(retailNet)}. Bandar mengakumulasi, retail melepas — pola bullish klasik.`;
  } else if (smartSig < 0 && retailSig > 0) {
    verdictLabel = 'Distribusi ke Retail 🔴'; color = 'red';
    desc = `Smart money net JUAL ${lFmt(smartNet)}, retail net beli ${lFmt(retailNet)} (menampung). Foreign EOD flow ${lFmt(foreignEod)}. Bandar keluar, retail nyangkut — bearish.`;
  } else if (smartSig > 0 && retailSig > 0) {
    verdictLabel = 'Akumulasi Luas 🟢'; color = 'emerald';
    desc = `Smart money (${lFmt(smartNet)}) DAN retail (${lFmt(retailNet)}) sama-sama net buy. Momentum beli luas — pastikan bukan euforia puncak.`;
  } else if (smartSig < 0 && retailSig < 0) {
    verdictLabel = 'Distribusi Masif 🔴'; color = 'red';
    desc = `Smart money (${lFmt(smartNet)}) DAN retail (${lFmt(retailNet)}) sama-sama net sell — semua pihak keluar. Hindari posisi baru.`;
  } else if (foreignSig < 0) {
    verdictLabel = 'Foreign Distribusi ⚠️'; color = 'yellow';
    desc = `Foreign EOD net jual ${lFmt(foreignEod)}; sisi smart/retail broker relatif netral. Waspadai tekanan asing.`;
  } else if (foreignSig > 0) {
    verdictLabel = 'Foreign Akumulasi 🔵'; color = 'blue';
    desc = `Foreign EOD net beli ${lFmt(foreignEod)}; broker lokal relatif netral. Monitor apakah lokal follow.`;
  }

  const colorMap = {
    emerald: 'border-emerald-500/30 bg-emerald-500/5',
    red: 'border-red-500/30 bg-red-500/5',
    yellow: 'border-yellow-500/30 bg-yellow-500/5',
    blue: 'border-blue-500/30 bg-blue-500/5',
  }[color];

  const textMap = {
    emerald: 'text-emerald-400', red: 'text-red-400', yellow: 'text-yellow-400', blue: 'text-blue-400'
  }[color];

  const top1 = buyers[0];
  const totalBuyVal = buyers.reduce((s,r) => s+r.buy_val, 0);
  const top3Pct = totalBuyVal > 0 ? buyers.slice(0,3).reduce((s,r) => s+r.buy_val, 0) / totalBuyVal * 100 : 0;

  return (
    <div className={`rounded-2xl border p-5 shadow-xl ${colorMap}`}>
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-1">
            {netTotal > 0 ? <TrendingUp className={`w-4 h-4 ${textMap}`} /> :
             netTotal < 0 ? <TrendingDown className={`w-4 h-4 ${textMap}`} /> :
             <Minus className={`w-4 h-4 ${textMap}`} />}
            <span className={`text-[10px] uppercase tracking-widest font-black ${textMap}`}>Tactical Verdict</span>
          </div>
          <p className={`text-xl font-black mb-1 ${textMap}`}>{verdictLabel}</p>
          <p className="text-[11px] text-gray-400">{desc}</p>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          <p className="text-[9px] uppercase text-gray-500 tracking-widest">Conviction</p>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={`w-4 h-4 ${i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
            ))}
          </div>
          <span className="text-[10px] text-gray-500">{avgC.toFixed(0)}% streak</span>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <p className="text-[9px] uppercase text-gray-500 tracking-widest">Net Flow Periode</p>
          <div className="space-y-0.5">
            <p className={`text-lg font-black font-mono ${netTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {netTotal >= 0 ? '+' : ''}{fmt(netTotal)}
            </p>
            {divergence && (
              <div className="flex gap-2 text-[9px]">
                <span className="text-gray-500">Lokal:</span>
                <span className={`font-bold ${localNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {localNet >= 0 ? '+' : ''}{fmt(localNet)}
                </span>
                <span className="text-gray-500">Asing:</span>
                <span className={`font-bold ${foreignNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {foreignNet >= 0 ? '+' : ''}{fmt(foreignNet)}
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-500">{buyers.length} buyer · {sellers.length} seller</p>
        </div>

        {top1 && (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <p className="text-[9px] uppercase text-gray-500 tracking-widest">Top Buyer</p>
            <p className="text-sm font-black text-white font-mono">{top1.broker_code}</p>
            <p className="text-[10px] text-gray-400">Top-3 dominasi: <span className="text-yellow-400 font-bold">{top3Pct.toFixed(0)}%</span></p>
          </div>
        )}

        {stockCtx?.whale_signal && (
          <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-2 self-start">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] font-black text-yellow-400">WHALE DETECTED</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Broker Concentration Panel ───────────────────────────────────────────────

function ConcentrationPanel({ buyers }: { buyers: TrackerRow[] }) {
  if (buyers.length === 0) return null;
  const totalBuy = buyers.reduce((s, r) => s + r.buy_val, 0);
  if (totalBuy === 0) return null;

  const shares = buyers.map(r => r.buy_val / totalBuy);
  const hhi = Math.round(shares.reduce((s, sh) => s + sh * sh * 10000, 0));
  const top1Pct = shares[0] * 100;
  const top3Pct = shares.slice(0, 3).reduce((s, sh) => s + sh * 100, 0);

  let label = 'DISTRIBUTED', labelColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let desc = 'Akumulasi tersebar banyak broker — sinyal lebih organik.';

  if (hhi > 2500) {
    label = 'CONCENTRATED';
    labelColor = 'bg-red-500/10 text-red-400 border-red-500/20';
    desc = 'Dominasi 1-2 broker — risiko distribusi mendadak tinggi.';
  } else if (hhi > 1500) {
    label = 'MODERATE';
    labelColor = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    desc = 'Konsentrasi sedang — pantau perubahan stance broker utama.';
  }

  return (
    <div className="bg-card rounded-2xl border border-white/5 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-black text-white uppercase tracking-wider">Broker Concentration</span>
        <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full border ${labelColor}`}>
          {label}
        </span>
      </div>
      <p className="text-[11px] text-gray-400 mb-4">{desc}</p>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'HHI Score', value: hhi.toLocaleString(), sub: hhi > 2500 ? 'Concentrated' : hhi > 1500 ? 'Moderate' : 'Competitive' },
          { label: 'Top Buyer %', value: `${top1Pct.toFixed(1)}%`, sub: buyers[0]?.broker_code ?? '—' },
          { label: 'Top-3 Share', value: `${top3Pct.toFixed(1)}%`, sub: 'dari total buy' },
        ].map((s, i) => (
          <div key={i} className="bg-background rounded-xl p-3 text-center">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-sm font-black text-white">{s.value}</p>
            <p className="text-[9px] text-gray-600">{s.sub}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[9px] text-gray-600 mb-1.5 uppercase tracking-wider">Distribusi Akumulasi Top-10 Broker</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-background">
          {buyers.slice(0, 10).map((b, i) => {
            const pct = totalBuy > 0 ? (b.buy_val / totalBuy) * 100 : 0;
            const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', '#059669', '#047857', '#065f46', '#f59e0b', '#fbbf24'];
            return <div key={i} style={{ width: `${pct}%`, backgroundColor: colors[i % colors.length] }} title={`${b.broker_code}: ${pct.toFixed(1)}%`} />;
          })}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {buyers.slice(0, 5).map((b, i) => {
            const pct = totalBuy > 0 ? (b.buy_val / totalBuy) * 100 : 0;
            const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];
            return (
              <span key={i} className="flex items-center gap-1 text-[9px] text-gray-500">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: colors[i % colors.length] }} />
                {b.broker_code} {pct.toFixed(0)}%
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── StanceHistoryCard ────────────────────────────────────────────────────────

function StanceHistoryCard({ data, loading }: { data: StanceRow[]; loading: boolean }) {
  const priority: StanceRow['stance_type'][] = ['REVERSAL_BUY', 'NEW_ENTRANT', 'CONTINUATION_BUY', 'REVERSAL_SELL', 'CONTINUATION_SELL', 'NEUTRAL'];
  const sorted = [...data].sort((a, b) => priority.indexOf(a.stance_type) - priority.indexOf(b.stance_type));
  const reversals = sorted.filter(r => r.stance_type === 'REVERSAL_BUY' || r.stance_type === 'REVERSAL_SELL');
  const newEntrants = sorted.filter(r => r.stance_type === 'NEW_ENTRANT');

  return (
    <div className="bg-card rounded-2xl border border-white/5 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-black text-white uppercase tracking-wider">Broker Stance History</span>
        <span className="text-[10px] text-gray-500 ml-auto">Periode sebelumnya vs sekarang</span>
      </div>

      {(reversals.length > 0 || newEntrants.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {reversals.map(r => (
            <span key={r.broker_code} className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              r.stance_type === 'REVERSAL_BUY' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'
            }`}>🔄 {r.broker_code}</span>
          ))}
          {newEntrants.map(r => (
            <span key={r.broker_code} className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-blue-500/15 text-blue-400 border-blue-500/30">
              🆕 {r.broker_code}
            </span>
          ))}
        </div>
      )}

      {loading && <p className="text-[11px] text-gray-500 py-4 text-center">Memuat data stance...</p>}
      {!loading && data.length === 0 && (
        <p className="text-[11px] text-gray-600 py-4 text-center">Data periode sebelumnya tidak tersedia</p>
      )}

      {!loading && sorted.length > 0 && (
        <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
          {sorted.slice(0, 15).map(r => {
            const cfg = STANCE_CFG[r.stance_type] || STANCE_CFG.NEUTRAL;
            return (
              <div key={r.broker_code} className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${cfg.bg} ${cfg.border}`}>
                <span className={cfg.text}>{cfg.icon}</span>
                <span className={`font-black text-xs w-12 shrink-0 ${cfg.text}`}>{r.broker_code}</span>
                <span className={`text-[10px] font-bold ${cfg.text} flex-1`}>{cfg.label}</span>
                <div className="text-right shrink-0">
                  <p className={`text-[10px] font-black ${r.current_net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.current_net >= 0 ? '+' : ''}{fmt(r.current_net)}
                  </p>
                  {r.prev_net !== 0 && (
                    <p className="text-[9px] text-gray-600">prev: {r.prev_net >= 0 ? '+' : ''}{fmt(r.prev_net)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── BandarActionPanel Component ──────────────────────────────────────────────

interface BandarActionPanelProps {
  buyers: TrackerRow[];
  sellers: TrackerRow[];
  currentPrice: number | null;
  stockCtx: StockContext | null;
  tacticalData: TacticalSignalData | null;
}

const BandarActionPanel = ({
  buyers,
  sellers,
  currentPrice,
  stockCtx,
  tacticalData,
}: BandarActionPanelProps) => {
  // 1. Retail vs Institutional Net Flow
  const retailCodes = new Set(['YP', 'XC', 'PD', 'KK', 'XL']);
  let retailNet = 0;
  let instNet = 0;

  buyers.forEach(r => {
    if (retailCodes.has(r.broker_code)) {
      retailNet += r.net_val;
    } else {
      instNet += r.net_val;
    }
  });

  sellers.forEach(r => {
    if (retailCodes.has(r.broker_code)) {
      retailNet += r.net_val;
    } else {
      instNet += r.net_val;
    }
  });

  const totalFlowAbs = Math.abs(retailNet) + Math.abs(instNet);
  const retailPct = totalFlowAbs > 0 ? (Math.abs(retailNet) / totalFlowAbs) * 100 : 50;
  const instPct = totalFlowAbs > 0 ? (Math.abs(instNet) / totalFlowAbs) * 100 : 50;

  // 2. Whale Cost Basis
  const calcWhaleAvg = (list: TrackerRow[]) => {
    let totalNetVal = 0;
    let totalNetLot = 0;
    list.forEach(r => {
      if (r.net_val > 0 && r.net_lot > 0) {
        totalNetVal += r.net_val;
        totalNetLot += r.net_lot;
      }
    });
    return totalNetLot > 0 ? totalNetVal / (totalNetLot * 100) : null;
  };

  const avg3 = calcWhaleAvg(buyers.slice(0, 3));
  const avg5 = calcWhaleAvg(buyers.slice(0, 5));

  const priceRef = currentPrice || (stockCtx?.close ?? 0);

  const discount3 = avg3 && priceRef ? ((avg3 - priceRef) / avg3) * 100 : null;
  const discount5 = avg5 && priceRef ? ((avg5 - priceRef) / avg5) * 100 : null;

  // 3. Confluence Checklist
  const items = [
    {
      label: 'Retail Distribution',
      desc: 'Retail Net Flow is negative (YP, XC, PD, KK, XL net sell).',
      pass: retailNet < 0,
      value: fmt(retailNet),
      color: retailNet < 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Whale Concentration',
      desc: 'Top 3 net buyers control >= 50% of buying power.',
      pass: (() => {
        const totalNetBuyers = buyers.reduce((sum, r) => sum + r.net_val, 0);
        const top3Net = buyers.slice(0, 3).reduce((sum, r) => sum + r.net_val, 0);
        const share = totalNetBuyers > 0 ? (top3Net / totalNetBuyers) * 100 : 0;
        return share >= 50;
      })(),
      value: (() => {
        const totalNetBuyers = buyers.reduce((sum, r) => sum + r.net_val, 0);
        const top3Net = buyers.slice(0, 3).reduce((sum, r) => sum + r.net_val, 0);
        const share = totalNetBuyers > 0 ? (top3Net / totalNetBuyers) * 100 : 0;
        return `${share.toFixed(0)}% share`;
      })(),
      color: 'text-yellow-400',
    },
    {
      label: 'Margin of Safety',
      desc: 'Price trades close to or below Top 3 Whale Cost (within 5% or lower).',
      pass: discount3 !== null && discount3 >= -5,
      value: discount3 !== null ? `${discount3 >= 0 ? 'Discount' : 'Premium'} ${Math.abs(discount3).toFixed(1)}%` : '—',
      color: discount3 !== null && discount3 >= -5 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'KSEI Smart Money Score',
      desc: 'Smart Money Score is >= 3 (Moderate/Strong Whale Accumulation).',
      pass: stockCtx !== null && stockCtx.smart_money_score >= 3,
      value: stockCtx ? `Score ${stockCtx.smart_money_score}/5` : '—',
      color: stockCtx && stockCtx.smart_money_score >= 3 ? 'text-emerald-400' : 'text-gray-400',
    },
    {
      label: 'Tactical Buy Confirmation',
      desc: 'Tactical Signal is BUY/STRONG_BUY or Stealth Accumulation.',
      pass: (() => {
        const sig = tacticalData?.tactical?.tactical_signal;
        const stealth = tacticalData?.stealth?.stealth_signal;
        return sig === 'BUY' || sig === 'STRONG_BUY' || sig === 'MOMENTUM_BUY' || stealth === 'STEALTH_ACC';
      })(),
      value: tacticalData?.tactical?.tactical_signal || tacticalData?.stealth?.stealth_signal || 'NEUTRAL',
      color: 'text-purple-400',
    },
  ];

  const confluenceScore = items.filter(item => item.pass).length;

  // 4. Actionable Trading Plan
  const targetWhaleCost = avg3 || avg5 || priceRef;
  const isAccumulate = confluenceScore >= 3;

  const entryMin = targetWhaleCost * 0.97;
  const entryMax = targetWhaleCost * 1.03;
  const stopLoss = targetWhaleCost * 0.95;
  const targetPrice = targetWhaleCost * 1.15;

  return (
    <div className={`bg-card rounded-2xl border ${
      isAccumulate ? 'border-yellow-500/30 shadow-yellow-500/5' : 'border-white/5'
    } p-4 shadow-xl space-y-4 transition-all duration-300`}>
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${isAccumulate ? 'bg-yellow-400/10' : 'bg-white/5'}`}>
          <Zap className={`w-4 h-4 ${isAccumulate ? 'text-yellow-400' : 'text-gray-400'}`} />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Bandar Action & Confluence</h4>
          <p className="text-[9px] text-gray-500">Retail Flow & Whale Cost analysis</p>
        </div>
        <div className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black border ${
          isAccumulate
            ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20'
            : 'bg-white/5 text-gray-400 border-white/10'
        }`}>
          Score: {confluenceScore}/5
        </div>
      </div>

      {/* Flow */}
      <div className="bg-background rounded-xl p-3 space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-gray-400 font-bold">Flow Analysis</span>
          <span className="text-gray-500">Retail vs Institutional</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
          <div
            style={{ width: `${instPct}%` }}
            className={`h-full ${instNet >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
            title={`Institusi: ${instPct.toFixed(0)}%`}
          />
          <div
            style={{ width: `${retailPct}%` }}
            className={`h-full ${retailNet >= 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
            title={`Ritel: ${retailPct.toFixed(0)}%`}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono">
          <div className="text-left">
            <p className="text-gray-500">Smart Money (Inst.)</p>
            <p className={`font-bold ${instNet >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {instNet >= 0 ? '+' : ''}{fmt(instNet)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Retail Proxy</p>
            <p className={`font-bold ${retailNet >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {retailNet >= 0 ? '+' : ''}{fmt(retailNet)}
            </p>
          </div>
        </div>
        {retailNet < 0 ? (
          <p className="text-[9px] text-emerald-400/90 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 mt-1">
            💡 <b>Retail Distribution:</b> Retail is selling. Whales accumulating. Bullish!
          </p>
        ) : (
          <p className="text-[9px] text-red-400/90 bg-red-500/5 px-2 py-1 rounded border border-red-500/10 mt-1">
            ⚠️ <b>Retail Accumulation:</b> Retail is buying heavily. Whale flow may be slow.
          </p>
        )}
      </div>

      {/* Costs */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-background rounded-xl p-3 text-center space-y-1">
          <p className="text-[9px] text-gray-500 uppercase font-bold">Top 3 Whale Cost</p>
          <p className="text-base font-black text-white font-mono">{avg3 ? `Rp ${fmtPrice(avg3)}` : '—'}</p>
          {discount3 !== null && (
            <p className={`text-[10px] font-bold ${discount3 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {discount3 >= 0 ? 'Discount' : 'Premium'} {Math.abs(discount3).toFixed(1)}%
            </p>
          )}
        </div>
        <div className="bg-background rounded-xl p-3 text-center space-y-1">
          <p className="text-[9px] text-gray-500 uppercase font-bold">Top 5 Whale Cost</p>
          <p className="text-base font-black text-white font-mono">{avg5 ? `Rp ${fmtPrice(avg5)}` : '—'}</p>
          {discount5 !== null && (
            <p className={`text-[10px] font-bold ${discount5 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {discount5 >= 0 ? 'Discount' : 'Premium'} {Math.abs(discount5).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-background rounded-xl p-3 space-y-2">
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Confluence Checklist</p>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2.5 text-[10px] py-1 border-b border-white/[0.03] last:border-0">
              <span className="mt-0.5 shrink-0 font-bold">
                {item.pass ? (
                  <span className="text-emerald-400 font-bold">✓</span>
                ) : (
                  <span className="text-red-500 font-bold">✗</span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className={`font-bold ${item.pass ? 'text-white' : 'text-gray-500'}`}>{item.label}</span>
                  <span className={`font-mono text-[9px] font-bold ${item.color}`}>{item.value}</span>
                </div>
                <p className="text-[8px] text-gray-600 truncate">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trading Plan */}
      <div className={`rounded-xl p-3 border ${
        isAccumulate
          ? 'bg-yellow-400/5 border-yellow-400/20'
          : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs">🎯</span>
          <span className="text-[10px] font-black uppercase tracking-wider text-white">Tactical Trading Plan</span>
          <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded ${
            isAccumulate ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400'
          }`}>
            {isAccumulate ? 'ACCUMULATE' : 'WATCH / WAIT'}
          </span>
        </div>

        {isAccumulate ? (
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Entry Zone (±3%):</span>
              <span className="text-yellow-400 font-bold">
                Rp {Math.round(entryMin).toLocaleString('id-ID')} - {Math.round(entryMax).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Stop Loss (-5%):</span>
              <span className="text-red-400 font-bold">Rp {Math.round(stopLoss).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between flex-wrap">
              <span className="text-gray-500">Target Price (+15%):</span>
              <span className="text-emerald-400 font-bold">Rp {Math.round(targetPrice).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ) : (
          <p className="text-[9px] text-gray-500 leading-relaxed">
            Confluence score is low ({confluenceScore}/5). Retail net flow is not selling, or smart money confirmation is missing. Monitor and wait for a entry setup near whale cost basis.
          </p>
        )}
      </div>
    </div>
  );
};

// ─── ScreenerResults Component ───────────────────────────────────────────────
function ScreenerResults({ data, screenerSortCol, screenerSortDir, toggleScreenerSort,
  setFilterMinNet, setFilterMaxSellPct, setFilterSmScore, exportCSV,
  setCode, setActiveTab, loadData }: {
  data: ScreenerRow[]
  screenerSortCol: keyof ScreenerRow
  screenerSortDir: 'asc' | 'desc'
  toggleScreenerSort: (col: keyof ScreenerRow) => void
  setFilterMinNet: (v: number) => void
  setFilterMaxSellPct: (v: number) => void
  setFilterSmScore: (v: number) => void
  exportCSV: () => void
  setCode: (c: string) => void
  setActiveTab: (t: ActiveTab) => void
  loadData: (overrideCode?: string, overrideTab?: ActiveTab) => Promise<void>
}) {
  // Client-side view filters (no refetch) — sharpen the candidate list.
  const [vf, setVf] = useState({ whale: false, conc: false, foreign: false });
  const rows = data.filter(r =>
    (!vf.whale   || r.whale_signal) &&
    (!vf.conc    || ((r as any).smart_concentration_pct ?? 0) >= 50) &&
    (!vf.foreign || (r.foreign_net_miliar ?? 0) > 0));
  // NOTE: sell_pressure_pct ≈ 100% for every stock (broker tape is zero-sum: total_sell≈total_buy),
  // so the old "Clean Accum (<40%)" metric was always 0. Replaced with smart-broker concentration.
  const concCount  = data.filter(r => ((r as any).smart_concentration_pct ?? 0) >= 50).length;
  const whaleCount = data.filter(r => r.whale_signal).length;
  const highScore  = data.filter(r => (r.composite_score ?? 0) >= 20).length;
  const avgConc    = data.length > 0
    ? data.reduce((s, r) => s + (((r as any).smart_concentration_pct ?? 0)), 0) / data.length : 0;

  const SortIcon  = ({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) =>
    active ? (dir === 'desc' ? <span className="text-gold-400">▼</span> : <span className="text-gold-400">▲</span>)
           : <span className="opacity-20">▼</span>;

  return (
    <div className="space-y-3">
      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Kandidat', value: data.length,  color: 'text-gold-400',     sub: 'smart net > 0' },
          { label: 'Konsentrasi',    value: concCount,    color: 'text-emerald-400',  sub: 'top broker ≥ 50%' },
          { label: 'Whale Signal',   value: whaleCount,   color: 'text-purple-400',   sub: 'anomali order besar' },
          { label: 'Score Tinggi',   value: highScore,    color: 'text-blue-400',     sub: 'composite score ≥ 20' },
        ].map(k => (
          <div key={k.label} className="glass rounded-2xl p-3 text-center card-hover">
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[10px] font-bold text-muted-foreground/65 mt-0.5">{k.label}</p>
            <p className="text-[9px] text-muted-foreground/35">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider font-bold">Quick Filter:</span>
        {[
          { label: '🟢 Net ≥ 1M',   action: () => { setFilterMinNet(1); } },
          { label: '⭐ Net ≥ 2M',   action: () => { setFilterMinNet(2); } },
          { label: '🔄 Reset',      action: () => { setFilterMinNet(0.5); setFilterMaxSellPct(100); setFilterSmScore(0); } },
        ].map(p => (
          <button key={p.label} onClick={p.action}
            className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-border/50 bg-white/[0.03] hover:bg-white/[0.08] hover:border-gold-400/30 text-muted-foreground hover:text-foreground transition-all">
            {p.label}
          </button>
        ))}
        <span className="w-px h-4 bg-white/10 mx-0.5" />
        {([
          { key: 'whale',   label: '🐋 Whale' },
          { key: 'conc',    label: '💎 Konsentrasi ≥50%' },
          { key: 'foreign', label: '🌐 Net Asing > 0' },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setVf(v => ({ ...v, [t.key]: !v[t.key] }))}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${vf[t.key] ? 'bg-gold-400/15 text-gold-400 border-gold-400/40' : 'border-border/50 bg-white/[0.03] text-muted-foreground hover:text-foreground hover:border-gold-400/30'}`}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-muted-foreground/40">
          Avg Konsentrasi: <span className={avgConc >= 40 ? 'text-emerald-400 font-bold' : 'text-muted-foreground font-bold'}>{avgConc.toFixed(0)}%</span>
        </span>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-2xl">
        <div className="px-5 py-4 bg-gold-400/[0.04] border-b border-gold-400/10 flex items-center gap-3">
          <Activity size={16} className="text-gold-400" />
          <span className="text-gold-400 font-black text-xs uppercase tracking-wider">
            Top {rows.length} Accumulation Candidates
          </span>
          <span className="ml-auto" />
          <button onClick={exportCSV} className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] text-gray-400 hover:text-gold-400 hover:border-gold-400/30 transition-all flex items-center gap-1">
            <Download size={14} /> CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-card/70 text-muted-foreground text-left text-[10px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('stock_code')}>
                  Stock <SortIcon active={screenerSortCol === 'stock_code'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('sector')}>
                  Sektor <SortIcon active={screenerSortCol === 'sector'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('net_miliar')}>
                  Net (M) <SortIcon active={screenerSortCol === 'net_miliar'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('total_value')}>
                  Turnover <SortIcon active={screenerSortCol === 'total_value'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('buy_broker_count')}>
                  Brk <SortIcon active={screenerSortCol === 'buy_broker_count'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-center" title="Local vs Foreign broker net">L/F Net</th>
                <th className="px-4 py-3 text-center">Top Buyer</th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('whale_signal')}>
                  Flags <SortIcon active={screenerSortCol === 'whale_signal'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-center cursor-pointer hover:text-foreground" onClick={() => toggleScreenerSort('smart_money_score')}>
                  SM <SortIcon active={screenerSortCol === 'smart_money_score'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-right cursor-pointer hover:text-foreground text-emerald-400 font-black"
                    onClick={() => toggleScreenerSort('composite_score')}>
                  Score ★ <SortIcon active={screenerSortCol === 'composite_score'} dir={screenerSortDir} />
                </th>
                <th className="px-4 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rows.map((r, i) => {
                const smColor = (r.smart_money_score ?? 0) >= 4 ? 'text-emerald-400'
                  : (r.smart_money_score ?? 0) >= 2 ? 'text-yellow-400' : 'text-gray-500';
                const localNet   = r.local_net_miliar   ?? 0;
                const foreignNet = r.foreign_net_miliar ?? 0;
                const score = r.composite_score ?? 0;
                const scoreColor = score >= 25 ? 'text-emerald-400' : score >= 15 ? 'text-yellow-400' : score >= 8 ? 'text-blue-400' : 'text-gray-500';
                return (
                  <tr key={r.stock_code}
                    className="hover:bg-gold-400/[0.04] cursor-pointer transition-colors group"
                    onClick={() => { setCode(r.stock_code); setActiveTab('tracker'); setTimeout(() => loadData(r.stock_code, 'tracker'), 0); }}
                  >
                    <td className="px-4 py-3 text-muted-foreground/50 font-mono text-[10px]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-black text-foreground text-sm group-hover:text-gold-400 transition-colors">{r.stock_code}</span>
                      {r.company_name && <p className="text-[9px] text-muted-foreground/50 truncate max-w-[80px]">{r.company_name}</p>}
                    </td>
                    <td className="px-4 py-3"><span className="text-[9px] text-muted-foreground/55">{r.sector ?? '—'}</span></td>
                    {/* Net */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-black text-emerald-400 font-mono">
                        +{(r.net_miliar ?? r.net_accumulation / 1e9).toFixed(1)} M
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground/60 font-mono text-[10px]">{fmt(r.total_value)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">{r.buy_broker_count}</span>
                    </td>
                    {/* L/F Net */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center gap-0.5 text-[9px] font-mono">
                        <span className={localNet >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          L:{localNet >= 0 ? '+' : ''}{localNet.toFixed(1)}
                        </span>
                        <span className={foreignNet >= 0 ? 'text-blue-400' : 'text-orange-400'}>
                          F:{foreignNet >= 0 ? '+' : ''}{foreignNet.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    {/* Top Buyer */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex flex-col items-center">
                        {r.top_buyer_code && <span className="text-[10px] font-bold text-foreground">{r.top_buyer_code}</span>}
                        {r.top_buyer_pct != null && (
                          <span className={`text-[9px] font-mono ${r.top_buyer_pct > 60 ? 'text-amber-400' : 'text-muted-foreground/50'}`}>
                            {r.top_buyer_pct}%
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Flags */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.whale_signal && <span title="Whale Signal">🐋</span>}
                        {r.big_player_anomaly && <span title="Big Player">⚡</span>}
                        {!r.whale_signal && !r.big_player_anomaly && <span className="text-muted-foreground/30 text-[10px]">—</span>}
                      </div>
                    </td>
                    {/* SM Score */}
                    <td className="px-4 py-3 text-center">
                      <span className={`font-black text-sm ${smColor}`}>{r.smart_money_score ?? '—'}</span>
                    </td>
                    {/* Composite Score */}
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-black font-mono ${scoreColor}`}>{score.toFixed(1)}</span>
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-foreground font-mono">{r.latest_price ? fmtPrice(r.latest_price) : '—'}</p>
                      {r.price_change_pct != null && (
                        <p className={`text-[9px] font-bold ${r.price_change_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.price_change_pct >= 0 ? '+' : ''}{r.price_change_pct.toFixed(1)}%
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-2.5 border-t border-border/30 text-[10px] text-muted-foreground/35">
          <span>{rows.length} saham · klik baris untuk buka Broker Tracker</span>
        </div>
      </div>
    </div>
  );
}

// ─── MarketIntelTab Component ────────────────────────────────────────────────

function MarketIntelTab({ brokerIntel, marketBreadth, brokerAlpha, loading, error }: {
  brokerIntel: BrokerIntelRow[]; marketBreadth: MarketBreadthRow[]; brokerAlpha: BrokerAlphaRow[]; loading: boolean; error: string | null
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  const topBuyers  = [...brokerIntel].filter(r => r.net_value > 0).sort((a, b) => b.net_value - a.net_value).slice(0, 10);
  const topSellers = [...brokerIntel].filter(r => r.net_value < 0).sort((a, b) => a.net_value - b.net_value).slice(0, 10);
  const consistency = [...brokerIntel].filter(r => r.buy_consistency_pct > 0 && (r.total_days ?? 0) >= 10).sort((a, b) => b.buy_consistency_pct - a.buy_consistency_pct).slice(0, 10);

  const breadthReversed = [...marketBreadth].reverse();
  const latestBreadth   = marketBreadth[0];

  return (
    <div className="space-y-5">

      {/* ── Intel Tab Header — explain purpose clearly ── */}
      <div className="glass rounded-2xl p-5 border border-gold-400/15">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,rgba(231,183,51,0.15),rgba(231,183,51,0.05))', border: '1px solid rgba(231,183,51,0.2)' }}>
            <Brain size={18} className="text-gold-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-black text-foreground">Market Broker Intelligence</h2>
            <p className="text-[11px] text-muted-foreground/65 mt-1 leading-relaxed">
              Tab ini menjawab: <strong className="text-foreground/80">"Broker mana yang smart money?"</strong>
              Gunakan untuk memfilter noise — fokus hanya ke broker yang histori beli-nya konsisten menghasilkan return positif.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { icon: '📊', title: 'Market Breadth', desc: 'Net flow broker market-wide per hari — lihat apakah pasar net buy atau net sell secara agregat.' },
                { icon: '🏆', title: 'Top Buyers/Sellers Today', desc: 'Broker terbesar yang net buy/sell hari ini — pasar sedang dikuasai siapa?' },
                { icon: '⚡', title: 'Alpha Broker', desc: 'Broker yang terbukti beli sebelum saham naik — track record mereka bisa jadi panduan.' },
              ].map(s => (
                <div key={s.title} className="p-2.5 rounded-xl bg-background border border-border/40">
                  <p className="text-[10px] font-black text-foreground/80">{s.icon} {s.title}</p>
                  <p className="text-[9px] text-muted-foreground/55 mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Error loading Market Intel data:</p>
            <p className="text-xs opacity-90 mt-1">{error}</p>
          </div>
        </div>
      )}
      {latestBreadth && (
        <div className="bg-card rounded-2xl border border-white/5 p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">Market-Wide Broker Breadth</span>
            <span className="text-[10px] text-gray-500 ml-auto">{latestBreadth.date}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Active Brokers', value: latestBreadth.broker_count?.toLocaleString(), color: 'text-white' },
              { label: 'Stocks Traded',  value: latestBreadth.stock_count?.toLocaleString(),  color: 'text-white' },
              { label: 'Net Flow',       value: fmt(latestBreadth.net_flow), color: latestBreadth.net_flow >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Buy Txn',        value: latestBreadth.buy_transactions?.toLocaleString(), color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="bg-background rounded-xl p-3 text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="h-[180px] w-full">
            <ResponsiveContainer>
              <BarChart data={breadthReversed} margin={{ left: 0, right: 8, bottom: 20, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="date" stroke="#374151" fontSize={9} tick={{ fill: '#6b7280' }} interval={Math.floor(breadthReversed.length / 6)} />
                <YAxis stroke="#374151" fontSize={10} tickFormatter={v => fmt(v)} width={60} tick={{ fill: '#6b7280' }} />
                <Tooltip content={<BreadthTooltip />} cursor={{ fill: '#ffffff06' }} />
                <ReferenceLine y={0} stroke="#ffffff25" />
                <Bar dataKey="net_flow" name="Net Flow" maxBarSize={20} radius={[2, 2, 0, 0]}>
                  {breadthReversed.map((d, i) => (
                    <Cell key={i} fill={d.net_flow >= 0 ? '#10b981' : '#ef4444'} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {[
          { title: 'Top Net Buyers Today', data: topBuyers,  icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />, color: 'emerald' },
          { title: 'Top Net Sellers Today', data: topSellers, icon: <TrendingDown className="w-3.5 h-3.5 text-red-400" />,   color: 'red' },
        ].map(({ title, data, icon, color }) => (
          <div key={title} className={`bg-card rounded-2xl border ${color === 'emerald' ? 'border-emerald-500/20' : 'border-red-500/20'} overflow-hidden shadow-xl`}>
            <div className={`px-4 py-3 ${color === 'emerald' ? 'bg-emerald-500/5' : 'bg-red-500/5'} border-b ${color === 'emerald' ? 'border-emerald-500/15' : 'border-red-500/15'} flex items-center gap-2`}>
              {icon}
              <span className={`text-[10px] uppercase tracking-widest font-black ${color === 'emerald' ? 'text-emerald-400' : 'text-red-400'}`}>{title}</span>
            </div>
            <div className="divide-y divide-white/5">
              {data.map((r, i) => (
                <div key={r.broker_code} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
                  <span className="text-[10px] text-gray-600 w-4 font-mono">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white">{r.broker_code}</p>
                    {r.broker_name && <p className="text-[9px] text-gray-500 truncate max-w-[160px]">{r.broker_name}</p>}
                  </div>
                  <div className="text-right">
                    <p className={`text-[11px] font-black ${r.net_value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.net_value)}</p>
                    <p className="text-[9px] text-gray-600">{r.stock_count} saham</p>
                  </div>
                </div>
              ))}
              {data.length === 0 && <p className="text-[11px] text-gray-600 text-center py-6">No data</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Consistency Leaders */}
        <div className="glass rounded-2xl border border-gold-400/20 overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-gold-400/[0.05] border-b border-gold-400/15 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5 text-gold-400" />
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-400">Consistency Leaders — Most Bullish Brokers (All-Time)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-[#1a2235] text-gray-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Broker</th>
                  <th className="px-4 py-2.5 text-right">Buy Consistency</th>
                  <th className="px-4 py-2.5 text-right">Net Buy Days</th>
                  <th className="px-4 py-2.5 text-right">All-Time Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {consistency.map((r, i) => (
                  <tr key={r.broker_code} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-gray-600 font-mono">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-black text-white">{r.broker_code}</p>
                      {r.broker_name && <p className="text-[9px] text-gray-500 truncate max-w-[160px]">{r.broker_name}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${r.buy_consistency_pct >= 70 ? 'bg-emerald-500' : r.buy_consistency_pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${r.buy_consistency_pct}%` }} />
                        </div>
                        <span className={`font-black text-[10px] ${r.buy_consistency_pct >= 70 ? 'text-emerald-400' : r.buy_consistency_pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {r.buy_consistency_pct?.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                      {r.net_buy_days}/{r.total_days}d
                    </td>
                    <td className={`px-4 py-2.5 text-right font-black ${r.all_time_net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(r.all_time_net)}
                    </td>
                  </tr>
                ))}
                {consistency.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-600 text-[11px]">Data tidak tersedia</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Broker Alpha Performance Leaderboard */}
        <div className="bg-card rounded-2xl border border-yellow-500/20 overflow-hidden shadow-xl">
          <div className="px-4 py-3 bg-yellow-500/5 border-b border-yellow-500/15 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[10px] uppercase tracking-widest font-black text-yellow-400">Broker Alpha rankings — Performance Leaderboard (Last 30 Days)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-[#1a2235] text-gray-500 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left">#</th>
                  <th className="px-4 py-2.5 text-left">Broker</th>
                  <th className="px-4 py-2.5 text-right">Alpha Return</th>
                  <th className="px-4 py-2.5 text-right">Stocks Accumulated</th>
                  <th className="px-4 py-2.5 text-right">Total Net Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {brokerAlpha.map((r, i) => (
                  <tr key={r.broker_code} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-gray-600 font-mono">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-black text-white">{r.broker_code}</p>
                      {r.broker_name && <p className="text-[9px] text-gray-500 truncate max-w-[160px]">{r.broker_name}</p>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-black font-mono ${r.alpha_score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {r.alpha_score >= 0 ? '+' : ''}{r.alpha_score.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-300 font-mono">
                      {r.stocks_accumulated} stocks
                    </td>
                    <td className={`px-4 py-2.5 text-right font-black ${r.total_net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(r.total_net)}
                    </td>
                  </tr>
                ))}
                {brokerAlpha.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-600 text-[11px]">Data tidak tersedia</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function BrokerTrackerPage() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get('code')?.toUpperCase() || '';

  // ── Core state ────────────────────────────────────────────────────────────
  const [activeTab,       setActiveTab]       = useState<ActiveTab>('tracker');
  const [code,            setCode]            = useState(urlCode || 'BBCA');
  const [trackerData,     setTrackerData]     = useState<TrackerRow[]>([]);
  const [screenerData,    setScreenerData]    = useState<ScreenerRow[]>([]);
  const [historyData,     setHistoryData]     = useState<HistoryRow[]>([]);
  const [priceData,       setPriceData]       = useState<PriceRow[]>([]);
  const [invPrice,        setInvPrice]        = useState<InvCandle[]>([]);
  const [invBrokers,      setInvBrokers]      = useState<InvBrokerRow[]>([]);
  const [invLoading,      setInvLoading]      = useState(false);
  const [invTopN,         setInvTopN]         = useState(5);
  const [invStart,        setInvStart]        = useState(() => { const d = new Date(); d.setDate(d.getDate() - 180); return d.toISOString().slice(0, 10); });
  const [invEnd,          setInvEnd]          = useState(() => new Date().toISOString().slice(0, 10));
  const [multiBrokerData, setMultiBrokerData] = useState<MultiBrokerRow[]>([]);
  const [stockCtx,        setStockCtx]        = useState<StockContext | null>(null);
  const [divergence,      setDivergence]      = useState<DivergenceData | null>(null);
  const [sectorList,      setSectorList]      = useState<string[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  // ── Screener filters ──────────────────────────────────────────────────────
  const [filterSector,     setFilterSector]     = useState('');
  const [filterWhaleOnly,  setFilterWhaleOnly]  = useState(false);
  const [filterPowerScore, setFilterPowerScore] = useState(0);
  const [filterMinVal,     setFilterMinVal]     = useState('1000000000');
  const [filterMinBroker,  setFilterMinBroker]  = useState('3');

  // ── Sort ──────────────────────────────────────────────────────────────────
  const [buySortCol,  setBuySortCol]  = useState<keyof TrackerRow>('net_val');
  const [buySortDir,  setBuySortDir]  = useState<'asc' | 'desc'>('desc');
  const [sellSortCol, setSellSortCol] = useState<keyof TrackerRow>('net_val');
  const [sellSortDir, setSellSortDir] = useState<'asc' | 'desc'>('asc');

  // ── Broker Profile drawer ─────────────────────────────────────────────────
  const [openBroker, setOpenBroker] = useState<string | null>(null);

  // ── NEW: Stance / Intel state ─────────────────────────────────────────────
  const [stanceData,    setStanceData]    = useState<StanceRow[]>([]);
  const [stanceLoading, setStanceLoading] = useState(false);
  const [brokerIntel,   setBrokerIntel]   = useState<BrokerIntelRow[]>([]);
  const [marketBreadth, setMarketBreadth] = useState<MarketBreadthRow[]>([]);
  const [brokerAlpha,   setBrokerAlpha]   = useState<BrokerAlphaRow[]>([]);
  const [intelLoading,  setIntelLoading]  = useState(false);
  const [intelError,    setIntelError]    = useState<string | null>(null);

  // ── NEW: Whale timing, tactical signal, insider signal ────────────────────
  const [whaleTiming,     setWhaleTiming]     = useState<WhaleTimingRow[]>([]);
  const [whaleLoading,    setWhaleLoading]    = useState(false);
  const [tacticalData,    setTacticalData]    = useState<TacticalSignalData | null>(null);
  const [tacticalLoading, setTacticalLoading] = useState(false);
  const [insiderData,     setInsiderData]     = useState<InsiderSignalData | null>(null);
  const [insiderLoading,  setInsiderLoading]  = useState(false);

  // ── NEW: Screener sort + quality filters ──────────────────────────────────
  const [screenerSortCol,  setScreenerSortCol]  = useState<keyof ScreenerRow>('composite_score');
  const [screenerSortDir,  setScreenerSortDir]  = useState<'asc' | 'desc'>('desc');
  const [filterSmScore,    setFilterSmScore]    = useState(0);
  const [filterMinNet,     setFilterMinNet]     = useState(0.5);   // min net miliar
  const [filterMaxSellPct, setFilterMaxSellPct] = useState(100);   // max sell pressure % (100 = no filter; sell_pressure ≈100% due to zero-sum tape)
  const [screenerPeriod,   setScreenerPeriod]   = useState(5);     // 5d / 14d / 30d / 60d / 90d

  // ── Date ──────────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 5);
    return d.toISOString().split('T')[0];
  });
  const [endDate,      setEndDate]      = useState<string>(new Date().toISOString().split('T')[0]);
  const [activePreset, setActivePreset] = useState<string>('5d');

  const presets = [
    { label: 'Kemarin',  days: 1,  id: '1d'  },
    { label: '1 Minggu', days: 5,  id: '5d'  },
    { label: '1 Bulan',  days: 20, id: '20d' },
    { label: '3 Bulan',  days: 60, id: '60d' },
  ];

  const applyPreset = (days: number, id: string) => {
    const end = new Date(), start = new Date();
    start.setDate(start.getDate() - days);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setActivePreset(id);
  };

  const currentPrice = useMemo(() =>
    priceData.length > 0 ? priceData[priceData.length - 1].close : null,
  [priceData]);

  useEffect(() => {
    fetch('/api/broker-tracker?action=sector_list')
      .then(r => r.json())
      .then(j => {
        if (!j.error) setSectorList((j.data || []).map((r: any) => r.sector));
      })
      .catch(() => {});
  }, []);

  const enrichTracker = useCallback(async (
    rows: TrackerRow[],
    tick: string,
    params: string,
    price: number | null,
  ) => {
    try {
      const cvRes  = await fetch(`/api/broker-tracker?action=broker_conviction&code=${tick}&${params}`);
      const cvJson = await cvRes.json();
      if (!cvJson.error && cvJson.data) {
        const map = new Map<string, any>();
        cvJson.data.forEach((r: any) => map.set(r.broker_code, r));
        return rows.map(r => {
          const cv = map.get(r.broker_code);
          const floatPnl = price && r.buy_avg_price && r.net_val > 0
            ? ((price - r.buy_avg_price) / r.buy_avg_price) * 100
            : price && r.sell_avg_price && r.net_val < 0
            ? ((r.sell_avg_price - price) / r.sell_avg_price) * 100
            : null;
          return {
            ...r,
            buy_consistency_pct: cv?.buy_consistency_pct ?? null,
            net_buy_days:        cv?.net_buy_days        ?? null,
            total_days:          cv?.total_days          ?? null,
            floating_pnl:        floatPnl,
          };
        });
      }
    } catch (_) {}
    return rows;
  }, []);

  const intelLoadedRef = useRef(false);

  const loadBrokerIntel = useCallback(async () => {
    if (intelLoadedRef.current) return;
    intelLoadedRef.current = true;
    setIntelLoading(true);
    setIntelError(null);
    try {
      const [intelRes, breadthRes, alphaRes] = await Promise.all([
        fetch('/api/broker-tracker?action=broker_intel'),
        fetch('/api/broker-tracker?action=broker_breadth'),
        fetch('/api/broker-tracker?action=broker_alpha&alpha_days=30'),
      ]);
      const [iJson, bJson, aJson] = await Promise.all([
        intelRes.json(),
        breadthRes.json(),
        alphaRes.json(),
      ]);

      const errors: string[] = [];
      if (iJson.error) {
        errors.push(`Intel: ${iJson.error}`);
      } else {
        setBrokerIntel(iJson.data || []);
      }

      if (bJson.error) {
        errors.push(`Breadth: ${bJson.error}`);
      } else {
        setMarketBreadth(bJson.data || []);
      }

      if (aJson.error) {
        errors.push(`Alpha: ${aJson.error}`);
      } else {
        setBrokerAlpha(aJson.data || []);
      }

      if (errors.length > 0) {
        setIntelError(errors.join(' | '));
      }
    } catch (e: any) {
      setIntelError(e.message || 'Gagal mengambil data Market Intel.');
    }
    setIntelLoading(false);
  }, []);

  const loadStance = useCallback(async (tick: string, params: string) => {
    setStanceLoading(true);
    try {
      const res  = await fetch(`/api/broker-tracker?action=stance_history&code=${tick}&${params}`);
      const json = await res.json();
      if (!json.error) setStanceData(json.data || []);
      else setStanceData([]);
    } catch (_) { setStanceData([]); }
    setStanceLoading(false);
  }, []);

  useEffect(() => { loadBrokerIntel(); }, []);

  // ── Inventory tab — candle + per-broker cumulative net for the current code ──
  const loadInventory = useCallback(() => {
    const c = code.trim().toUpperCase();
    if (!c) return;
    setInvLoading(true);
    fetch(`/api/broker-tracker?action=inventory&code=${c}&start=${invStart}&end=${invEnd}&top_n=${invTopN}`)
      .then(r => r.json())
      .then(j => { setInvPrice(j.price || []); setInvBrokers(j.brokers || []); })
      .catch(() => { setInvPrice([]); setInvBrokers([]); })
      .finally(() => setInvLoading(false));
  }, [code, invStart, invEnd, invTopN]);

  useEffect(() => {
    if (activeTab === 'inventory' && code.trim() && invPrice.length === 0) loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = useCallback(async (
    overrideCode?: string,
    overrideTab?: ActiveTab,
  ) => {
    const tab  = overrideTab ?? activeTab;
    const tick = (overrideCode ?? code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    if (!tick) { setError('Kode saham tidak valid'); return; }

    setLoading(true);
    setError(null);
    const params = `startDate=${startDate}&endDate=${endDate}`;

    try {
      if (tab === 'tracker') {
        // 1.3: tracker+history+price_history+stock_context in ONE request (action=bundle);
        // divergence kept separate (heavier 5-CTE query). Wave-1 round-trips: 5 → 2.
        const [bundleRes, divRes] = await Promise.all([
          fetch(`/api/broker-tracker?action=bundle&code=${tick}&${params}`),
          fetch(`/api/broker-tracker?action=divergence&code=${tick}&${params}`),
        ]);

        const [bundleJson, divJson] = await Promise.all([bundleRes.json(), divRes.json()]);

        if (bundleJson.error) throw new Error(bundleJson.error);

        const rawRows: TrackerRow[] = bundleJson.tracker || [];
        const ph: PriceRow[]        = bundleJson.price_history || [];
        const latestPrice           = ph.length > 0 ? ph[ph.length - 1].close : null;

        setPriceData(ph);
        setHistoryData(bundleJson.history || []);
        setStockCtx(bundleJson.stock_context?.[0] || null);
        setDivergence(!divJson.error ? (divJson.data?.[0] || null) : null);
        setScreenerData([]);

        const enriched = await enrichTracker(rawRows, tick, params, latestPrice);
        setTrackerData(enriched);

        const topB = enriched.filter(r => r.net_val > 0).slice(0, 10).map(r => r.broker_code);
        const topS = enriched.filter(r => r.net_val < 0).slice(0, 10).map(r => r.broker_code);
        const codes = [...topB, ...topS];
        if (codes.length > 0) {
          const mRes  = await fetch(`/api/broker-tracker?action=multi_broker_history&code=${tick}&broker_codes=${codes.join(',')}&${params}`);
          const mJson = await mRes.json();
          setMultiBrokerData(!mJson.error ? mJson.data || [] : []);
        } else {
          setMultiBrokerData([]);
        }

        // Fire-and-forget: whale timing, tactical signal, insider signal
        setWhaleLoading(true);
        fetch(`/api/broker-tracker?action=whale_timing&code=${tick}&days=365`)
          .then(r => r.json())
          .then(j => setWhaleTiming(!j.error ? (j.data ?? []) : []))
          .catch(() => setWhaleTiming([]))
          .finally(() => setWhaleLoading(false));

        setTacticalLoading(true);
        fetch(`/api/broker-tracker?action=tactical_signal&code=${tick}&${params}`)
          .then(r => r.json())
          .then(j => setTacticalData(j.error ? null : j))
          .catch(() => setTacticalData(null))
          .finally(() => setTacticalLoading(false));

        setInsiderLoading(true);
        fetch(`/api/broker-tracker?action=insider_signal&code=${tick}&days=90`)
          .then(r => r.json())
          .then(j => setInsiderData(j.error ? null : j))
          .catch(() => setInsiderData(null))
          .finally(() => setInsiderLoading(false));

        loadStance(tick, params);

      } else if (tab === 'screener') {
        const sectorQ    = filterSector    ? `&sector=${encodeURIComponent(filterSector)}`         : '';
        const whaleQ     = filterWhaleOnly ? `&whale_only=true`                                     : '';
        const pwrQ       = filterPowerScore > 0 ? `&min_power_score=${filterPowerScore}`            : '';
        const minValQ    = `&min_total_value=${filterMinVal}`;
        const minBrkQ    = `&min_broker_count=${filterMinBroker}`;
        // ★ New quality filters
        const minNetQ    = `&min_net_miliar=${filterMinNet}`;
        const maxSpQ     = `&max_sell_pressure=${filterMaxSellPct}`;
        const periodQ    = `&screener_days=${screenerPeriod}`;

        const res  = await fetch(`/api/broker-tracker?action=screener&${params}${sectorQ}${whaleQ}${pwrQ}${minValQ}${minBrkQ}${minNetQ}${maxSpQ}${periodQ}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setScreenerData(json.data || []);
        setTrackerData([]);
        setHistoryData([]);
        setPriceData([]);
        setMultiBrokerData([]);
        setStockCtx(null);
        setDivergence(null);
      }
    } catch (e: any) {
      setError(e.message ?? 'Terjadi kesalahan.');
    }
    setLoading(false);
  }, [activeTab, code, startDate, endDate, filterSector, filterWhaleOnly, filterPowerScore, filterMinVal, filterMinBroker, filterMinNet, filterMaxSellPct, screenerPeriod, enrichTracker, loadStance]);

  useEffect(() => {
    if (urlCode) loadData(urlCode, 'tracker');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buyers = useMemo(() =>
    trackerData.filter(r => r.net_val > 0).sort((a, b) => {
      const va = a[buySortCol] as number, vb = b[buySortCol] as number;
      return buySortDir === 'desc' ? vb - va : va - vb;
    }),
  [trackerData, buySortCol, buySortDir]);

  const sellers = useMemo(() =>
    trackerData.filter(r => r.net_val < 0).sort((a, b) => {
      if (sellSortCol === 'net_val') return sellSortDir === 'asc' ? a.net_val - b.net_val : b.net_val - a.net_val;
      const va = Math.abs(a[sellSortCol] as number), vb = Math.abs(b[sellSortCol] as number);
      return sellSortDir === 'desc' ? vb - va : va - vb;
    }),
  [trackerData, sellSortCol, sellSortDir]);

  const brokerBarData = useMemo(() =>
    [...buyers.slice(0, 10), ...sellers.slice(0, 10)]
      .sort((a, b) => b.net_val - a.net_val)
      .map(r => ({ broker: r.broker_code, net_val: r.net_val })),
  [buyers, sellers]);

  const sortedScreenerData = useMemo(() => {
    let data = [...screenerData];
    if (filterSmScore > 0) data = data.filter(r => (r.smart_money_score ?? 0) >= filterSmScore);
    data.sort((a, b) => {
      const av = (a[screenerSortCol] as number) ?? 0;
      const bv = (b[screenerSortCol] as number) ?? 0;
      return screenerSortDir === 'desc' ? bv - av : av - bv;
    });
    return data;
  }, [screenerData, screenerSortCol, screenerSortDir, filterSmScore]);

  const exportCSV = useCallback(() => {
    const headers = ['Stock','Sector','Net (M)','Turnover','Buy Brokers','Sell Brokers','Sell%','L/F Net','Top Buyer','Top Buyer%','Whale','Big Player','SM Score','Composite Score','Price','Price Chg%'];
    const rows = sortedScreenerData.map(r => [
      r.stock_code, r.sector ?? '', (r.net_miliar ?? r.net_accumulation / 1e9).toFixed(1),
      r.total_value, r.buy_broker_count, r.sell_broker_count,
      r.sell_pressure_pct != null ? r.sell_pressure_pct.toFixed(0) : '',
      `L:${(r.local_net_miliar ?? 0).toFixed(1)} F:${(r.foreign_net_miliar ?? 0).toFixed(1)}`,
      r.top_buyer_code ?? '', r.top_buyer_pct != null ? r.top_buyer_pct.toFixed(1) : '',
      r.whale_signal ? 'Y' : 'N', r.big_player_anomaly ? 'Y' : 'N',
      r.smart_money_score ?? '', (r.composite_score ?? 0).toFixed(1),
      r.latest_price ?? '', r.price_change_pct ?? '',
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `screener-${startDate}-${endDate}.csv`;
    a.click();
  }, [sortedScreenerData, startDate, endDate]);

  const TrackerTable = ({ rows, side }: { rows: TrackerRow[]; side: 'buy' | 'sell' }) => {
    const isBuy      = side === 'buy';
    const colors     = COLOR_MAP[isBuy ? 'emerald' : 'red'];
    const sortCol    = isBuy ? buySortCol  : sellSortCol;
    const sortDir    = isBuy ? buySortDir  : sellSortDir;
    const setSortCol = isBuy ? setBuySortCol  : setSellSortCol;
    const setSortDir = isBuy ? setBuySortDir  : setSellSortDir;
    const slice      = rows.slice(0, 15);

    const toggle = (col: keyof TrackerRow) => {
      if (sortCol === col) setSortDir((d: 'asc' | 'desc') => d === 'desc' ? 'asc' : 'desc');
      else { setSortCol(col); setSortDir(isBuy ? 'desc' : 'asc'); }
    };

    return (
      <div className={`bg-card rounded-2xl border ${colors.border} overflow-hidden shadow-xl`}>
        <div className={`px-4 py-3 ${colors.bg} border-b ${colors.border} flex items-center gap-2`}>
          {isBuy ? <TrendingUp className={`w-3.5 h-3.5 ${colors.text}`} />
                 : <TrendingDown className={`w-3.5 h-3.5 ${colors.text}`} />}
          <span className={`text-[10px] uppercase tracking-widest font-black ${colors.text}`}>
            {isBuy ? 'Top Buyers' : 'Top Sellers'}
          </span>
          <span className="ml-auto text-[10px] text-gray-500 font-mono">{slice.length} brokers</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-[#1a2235] text-gray-500 text-left">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Broker</th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-white select-none"
                    onClick={() => toggle('net_val')}>
                  <span className="flex items-center justify-end gap-1">
                    NET VAL <SortIcon active={sortCol === 'net_val'} dir={sortDir} />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right cursor-pointer hover:text-white select-none"
                    onClick={() => toggle(isBuy ? 'buy_lot' : 'sell_lot')}>
                  <span className="flex items-center justify-end gap-1">
                    LOT <SortIcon active={sortCol === (isBuy ? 'buy_lot' : 'sell_lot')} dir={sortDir} />
                  </span>
                </th>
                <th className="px-3 py-2.5 text-right">AVG PX</th>
                <th className="px-3 py-2.5 text-right text-yellow-500/70">P&L</th>
                <th className="px-3 py-2.5 text-center text-gold-400/70">STREAK</th>
                <th className="px-3 py-2.5 text-right">BAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {slice.map((r, i) => {
                const netColor = r.net_val > 0 ? 'text-emerald-400' : 'text-red-400';
                const avgPx    = isBuy ? r.buy_avg_price  : r.sell_avg_price;
                const lot      = isBuy ? r.buy_lot        : r.sell_lot;
                const pnl      = r.floating_pnl;
                const streak   = r.buy_consistency_pct;
                return (
                  <tr key={r.broker_code} className="hover:bg-white/[0.03] transition-colors group">
                    <td className="px-3 py-2.5 text-gray-600 font-mono text-[10px]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => setOpenBroker(r.broker_code)}
                        className="text-left group/btn"
                      >
                        <span className="font-black text-white text-xs group-hover/btn:text-yellow-400 transition-colors flex items-center gap-1.5">
                          {r.broker_code}
                          {/* ★ Local/Foreign badge */}
                          {r.broker_lf && (
                            <span className={`text-[8px] font-black px-1 py-0 rounded ${
                              r.broker_lf === 'F'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {r.broker_lf}
                            </span>
                          )}
                          {r.is_prime && (
                            <span className="text-[7px] font-black px-1 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">★</span>
                          )}
                          <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/btn:opacity-60" />
                        </span>
                        {r.broker_name && (
                          <p className="text-[9px] text-gray-500 truncate max-w-[130px]">{r.broker_name}</p>
                        )}
                      </button>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-bold ${netColor}`}>{fmt(Math.abs(r.net_val))}</td>
                    <td className="px-3 py-2.5 text-right text-gray-300 font-mono">{fmtLot(lot)}</td>
                    <td className="px-3 py-2.5 text-right text-yellow-400 font-mono text-[10px]">{fmtPrice(avgPx)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {pnl != null ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          pnl >= 0
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(1)}%
                        </span>
                      ) : <span className="text-gray-700 text-[10px]">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      {streak != null && r.total_days != null ? (
                        <div className="flex flex-col items-center min-w-[52px]">
                          <span className={`text-[9px] font-bold ${
                            streak >= 70 ? 'text-emerald-400' :
                            streak >= 40 ? 'text-yellow-400'  : 'text-red-400'
                          }`}>{streak.toFixed(0)}%</span>
                          <ConvictionBar buyDays={r.net_buy_days ?? 0} totalDays={r.total_days} pct={streak} />
                        </div>
                      ) : <span className="text-gray-700 text-[10px] block text-center">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <FlowBar buy={r.buy_val} sell={r.sell_val} />
                        <span className="text-[9px] text-gray-600 font-mono">
                          {r.buy_val + r.sell_val > 0
                            ? `${Math.round(r.buy_val / (r.buy_val + r.sell_val) * 100)}% B`
                            : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const SCREENER_SORTABLE: (keyof ScreenerRow)[] = [
    'stock_code', 'sector', 'net_miliar', 'total_value', 'buy_broker_count',
    'sell_pressure_pct', 'whale_signal', 'smart_money_score', 'composite_score',
  ];

  const toggleScreenerSort = (col: keyof ScreenerRow) => {
    if (screenerSortCol === col) {
      setScreenerSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setScreenerSortCol(col);
      setScreenerSortDir('desc');
    }
  };

  return (
    <div className="sidebar-offset max-w-[1440px] mx-auto p-3 md:p-5 space-y-4 min-h-screen animate-fade-in">

      <BrokerProfileDrawer
        brokerCode={openBroker}
        onClose={() => setOpenBroker(null)}
        currentPrice={currentPrice}
      />

      {/* Header with 3 Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center glass p-3 md:p-4 rounded-2xl border border-border/50 gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
            <BarChart3 className="text-gold-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-gold">Broker Summary Analytics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Broker Flow · Smart Money · Divergence
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl w-full md:w-auto">
          {([
            { id: 'tracker', label: 'Tracker', icon: <Eye className="w-3 h-3" />, count: trackerData.length },
            { id: 'screener', label: 'Screener', icon: <Target className="w-3 h-3" />, count: screenerData.length },
            { id: 'intel', label: 'Intel', icon: <Radio className="w-3 h-3" />, count: brokerIntel.length },
            { id: 'inventory', label: 'Inventory', icon: <Layers className="w-3 h-3" />, count: 0 },
          ] as const).map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              className={`relative flex-1 md:flex-none flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white/[0.08] text-gold-400 shadow-lg shadow-gold-400/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span className={activeTab === tab.id ? 'opacity-100' : 'opacity-50'}>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${
                  activeTab === tab.id
                    ? 'bg-gold-400/15 text-gold-400'
                    : 'bg-white/[0.06] text-gray-500'
                }`}>
                  {tab.count > 99 ? '99+' : tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-gold-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Control Panel */}
      {(activeTab === 'tracker' || activeTab === 'screener') && (
        <div className="glass p-3 md:p-4 rounded-2xl border border-border/50">
          <div className="flex flex-wrap gap-3 items-end">
            {activeTab === 'tracker' && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Stock Ticker</label>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && loadData()}
                      className="w-28 bg-background border border-white/5 rounded-lg pl-8 pr-3 py-2
                                 text-sm font-black text-yellow-400 focus:ring-1 focus:ring-yellow-400
                                 outline-none placeholder:text-gray-600"
                      placeholder="BBCA" maxLength={10} />
                  </div>
                  {code.trim().length >= 2 && (
                    <Link href={`/stock/${code.trim().toUpperCase()}`} prefetch={false}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10
                                 bg-white/[0.04] text-[10px] font-bold text-gray-400 hover:text-gold-400
                                 hover:border-gold-400/30 transition-all whitespace-nowrap group">
                      <BarChart3 className="w-3.5 h-3.5 group-hover:text-gold-400" />
                      Stock Chart
                    </Link>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'screener' && (
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Sektor</label>
                  <select value={filterSector} onChange={e => setFilterSector(e.target.value)}
                    className="bg-background border border-white/10 rounded-lg px-3 py-2 text-[11px]
                               text-gray-300 outline-none focus:border-yellow-400/40 [color-scheme:dark] min-w-[140px]">
                    <option value="">Semua Sektor</option>
                    {sectorList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
                    Min Power Score: <span className="text-gold-400">{filterPowerScore}</span>
                  </label>
                  <input type="range" min={0} max={50} step={1} value={filterPowerScore}
                    onChange={e => setFilterPowerScore(Number(e.target.value))}
                    className="w-28 accent-yellow-400" />
                </div>
                {/* ★ Quality filters (Min SM Score & Max Sell% removed: SM score is legacy/weak;
                    sell_pressure ≈ 100% always due to zero-sum broker tape) */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">
                    Min Net: <span className="text-emerald-400">{filterMinNet.toFixed(1)} M</span>
                  </label>
                  <input type="range" min={0} max={10} step={0.5} value={filterMinNet}
                    onChange={e => setFilterMinNet(Number(e.target.value))}
                    className="w-28 accent-emerald-400" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 ml-1">Periode</label>
                  <div className="flex gap-1 bg-background rounded-lg p-1">
                    {[5, 14, 30, 60, 90].map(d => (
                      <button key={d} onClick={() => setScreenerPeriod(d)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
                          screenerPeriod === d ? 'bg-gold-400 text-black shadow' : 'text-gray-400 hover:text-white'
                        }`}>{d}D</button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className={`w-8 h-4 rounded-full transition-colors ${filterWhaleOnly ? 'bg-yellow-400' : 'bg-white/10'}`}
                    onClick={() => setFilterWhaleOnly(v => !v)}>
                    <div className={`w-3 h-3 bg-white rounded-full mt-0.5 transition-transform ${filterWhaleOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-400">Whale Only 🐋</span>
                </label>
              </div>
            )}

            {/* Time Horizon — only for Tracker (Screener uses Periode → fixed materialized window) */}
            {activeTab === 'tracker' && (
            <div className="space-y-1.5 flex-1 min-w-0">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-1 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Time Horizon
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 bg-background rounded-lg p-1 shrink-0">
                  {presets.map(p => (
                    <button key={p.id} onClick={() => applyPreset(p.days, p.id)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all whitespace-nowrap ${
                        activePreset === p.id ? 'bg-gold-400 text-black shadow' : 'text-gray-400 hover:text-white'
                      }`}>{p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input type="date" value={startDate}
                    onChange={e => { setStartDate(e.target.value); setActivePreset('custom'); }}
                    className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-[11px]
                               text-gray-300 outline-none cursor-pointer [color-scheme:dark]
                               focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/20" />
                  <span className="text-gray-600 text-xs select-none">→</span>
                  <input type="date" value={endDate}
                    onChange={e => { setEndDate(e.target.value); setActivePreset('custom'); }}
                    className="bg-background border border-white/10 rounded-lg px-3 py-1.5 text-[11px]
                               text-gray-300 outline-none cursor-pointer [color-scheme:dark]
                               focus:border-yellow-400/40 focus:ring-1 focus:ring-yellow-400/20" />
                </div>
              </div>
            </div>
            )}

            <button onClick={() => loadData()} disabled={loading}
              className="bg-gold-400 text-black px-7 py-2 rounded-xl font-black text-xs
                         hover:bg-gold-300 active:scale-95 transition-all flex items-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-gold-400/20">
              {loading ? <Loader2 className="animate-spin w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {activeTab === 'tracker' ? 'RUN TRACKER' : 'SCAN ACCUM'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── TRACKER TAB ── */}
      {activeTab === 'tracker' && trackerData.length > 0 && (
        <div className="space-y-4">

          {/* Row 1: Tactical Verdict + Signal Banner */}
          <VerdictStrip buyers={buyers} sellers={sellers} divergence={divergence} stockCtx={stockCtx} />
          <TacticalSignalBanner data={tacticalData} loading={tacticalLoading} />

          {/* Row 2: Smart Money Score (left) + Bandar Action (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              {stockCtx && <SmartMoneyScoreCard ctx={stockCtx} currentPrice={currentPrice} />}
              <ConcentrationPanel buyers={buyers} />
            </div>
            <div>
              <BandarActionPanel
                buyers={buyers}
                sellers={sellers}
                currentPrice={currentPrice}
                stockCtx={stockCtx}
                tacticalData={tacticalData}
              />
            </div>
          </div>

          {/* Row 3: Whale Timing (left) + Insider Signal (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WhaleTimingPanel data={whaleTiming} loading={whaleLoading} />
            <InsiderSignalCard data={insiderData} loading={insiderLoading} />
          </div>

          {/* Row 4: Divergence (left) + Stance History (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {divergence && <DivergenceCard data={divergence} />}
            <StanceHistoryCard data={stanceData} loading={stanceLoading} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TopBrokerCards rows={buyers}  side="buy"  totalBrokers={buyers.length}  />
            <TopBrokerCards rows={sellers} side="sell" totalBrokers={sellers.length} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TrackerTable rows={buyers}  side="buy"  />
            <TrackerTable rows={sellers} side="sell" />
          </div>

          {/* Broker Net Flow Bar */}
          <div className="glass p-5 rounded-2xl border border-border/50 shadow-xl">
            <div className="flex items-center gap-2 mb-1">
              <BarChart2 className="w-4 h-4 text-gold-400" />
              <h3 className="text-sm font-black text-foreground">Broker Net Flow — Top 20</h3>
              <span className="ml-auto text-[10px] text-gray-500">{code} · {startDate} → {endDate}</span>
            </div>
            <p className="text-[10px] text-gray-600 mb-4">
              <span className="text-emerald-600">■</span> Net Buyer &nbsp;·&nbsp;
              <span className="text-red-600">■</span> Net Seller
            </p>
            <div className="h-[280px] w-full">
              <ResponsiveContainer>
                <BarChart data={brokerBarData} margin={{ left: 0, right: 8, bottom: 40, top: 4 }} barCategoryGap="18%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis dataKey="broker" stroke="#374151" fontSize={9} tick={{ fill: '#6b7280' }}
                    interval={0} angle={-45} textAnchor="end" height={50} />
                  <YAxis stroke="#374151" fontSize={10} tickFormatter={v => fmt(v)} width={64} tick={{ fill: '#6b7280' }} />
                  <Tooltip content={<BrokerBarTooltip />} cursor={{ fill: '#ffffff06' }} />
                  <ReferenceLine y={0} stroke="#ffffff25" strokeWidth={1} />
                  <Bar dataKey="net_val" maxBarSize={30} radius={[2,2,0,0]}>
                    {brokerBarData.map((d, i) => (
                      <Cell key={i} fill={d.net_val >= 0 ? COLOR_MAP.emerald.fill : COLOR_MAP.red.fill} opacity={0.82} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'tracker' && !loading && trackerData.length === 0 && !error && (
        <div className="text-center py-16 text-gray-600">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold">Masukkan kode saham dan klik RUN TRACKER</p>
          <p className="text-xs mt-1 opacity-60">Contoh: BBCA, TLKM, AADI, GOTO</p>
        </div>
      )}

      {/* ── WHALE SCREENER TAB ── */}
      {activeTab === 'screener' && sortedScreenerData.length > 0 && (
        <ScreenerResults
          data={sortedScreenerData}
          screenerSortCol={screenerSortCol}
          screenerSortDir={screenerSortDir}
          toggleScreenerSort={toggleScreenerSort}
          setFilterMinNet={setFilterMinNet}
          setFilterMaxSellPct={setFilterMaxSellPct}
          setFilterSmScore={setFilterSmScore}
          exportCSV={exportCSV}
          setCode={setCode}
          setActiveTab={setActiveTab}
          loadData={loadData}
        />
      )}

      {activeTab === 'screener' && !loading && screenerData.length > 0 && sortedScreenerData.length === 0 && !error && (
        <div className="glass rounded-2xl p-16 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400/30" />
          <p className="text-sm font-bold text-muted-foreground/60">Tidak ada saham yang lolos filter</p>
          <p className="text-[11px] mt-1.5 text-muted-foreground/35 max-w-md mx-auto">
            {screenerData.length} saham ditemukan, tapi semua tereliminasi oleh SM Score ≥ {filterSmScore}. Coba turunkan filter atau reset.
          </p>
          <button onClick={() => setFilterSmScore(0)}
            className="mt-4 px-4 py-2 rounded-lg border border-gold-400/30 bg-gold-400/10 text-gold-400 text-[10px] font-bold hover:bg-gold-400/20 transition-all">
            Reset SM Score Filter
          </button>
        </div>
      )}

      {activeTab === 'screener' && !loading && screenerData.length === 0 && !error && (
        <div className="glass rounded-2xl p-16 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-gold-400/30" />
          <p className="text-sm font-bold text-muted-foreground/60">Klik SCAN ACCUM untuk mencari saham akumulasi</p>
          <p className="text-[11px] mt-1.5 text-muted-foreground/35 max-w-md mx-auto">
            Screener akan menampilkan saham dengan broker net buy signifikan, sell pressure rendah, dan composite score tertinggi.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center text-[10px] text-muted-foreground/40">
            {['Net Akumulasi ≥ 500 Jt', 'Sell Pressure ≤ 85%', 'Broker Count ≥ 3'].map(t => (
              <span key={t} className="px-2.5 py-1 rounded-full border border-border/30 bg-white/[0.02]">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── MARKET INTEL TAB ── */}
      {activeTab === 'intel' && (
        <MarketIntelTab
          brokerIntel={brokerIntel}
          marketBreadth={marketBreadth}
          brokerAlpha={brokerAlpha}
          loading={intelLoading}
          error={intelError}
        />
      )}

      {/* ── INVENTORY ANALYSIS TAB ── */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="glass p-4 rounded-2xl border border-border/50 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gold-400" />
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') loadInventory(); }}
                placeholder="Kode saham (mis. BBCA)"
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm w-44 outline-none focus:border-gold-400/50 uppercase" />
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground/60">
              <Calendar className="w-3.5 h-3.5 text-gold-400" />
              <input type="date" value={invStart} max={invEnd} onChange={e => setInvStart(e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gold-400/50" />
              <span className="text-[10px]">→</span>
              <input type="date" value={invEnd} min={invStart} onChange={e => setInvEnd(e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-gold-400/50" />
            </div>
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <span className="text-[9px] text-muted-foreground/50 px-1 uppercase tracking-wider">Top</span>
              {[3, 5, 8].map(n => (
                <button key={n} onClick={() => setInvTopN(n)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${invTopN === n ? 'bg-gold-400/20 text-gold-400' : 'text-gray-400 hover:text-white'}`}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={loadInventory} disabled={invLoading || !code.trim()}
              className="ml-auto px-4 py-2 rounded-lg bg-gold-400/15 text-gold-400 border border-gold-400/30 text-xs font-bold hover:bg-gold-400/25 transition-all disabled:opacity-50 flex items-center gap-1.5">
              {invLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Load Inventory
            </button>
          </div>

          <div className="glass p-5 rounded-2xl border border-border/50 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-gold-400" />
              <h3 className="text-sm font-black text-foreground">Inventory Analysis</h3>
              <span className="text-[10px] text-muted-foreground/50">{code ? `· ${code.toUpperCase()}` : ''} · candle + posisi kumulatif broker</span>
            </div>
            {invLoading ? (
              <div className="h-[460px] flex items-center justify-center text-muted-foreground/40 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" /> Memuat…
              </div>
            ) : invPrice.length === 0 ? (
              <div className="h-[460px] flex flex-col items-center justify-center text-muted-foreground/30 gap-2">
                <Layers className="w-10 h-10" />
                <p className="text-sm font-bold">Ketik kode saham → Load Inventory</p>
                <p className="text-xs opacity-60">Candle harga + garis akumulasi/distribusi tiap broker</p>
              </div>
            ) : (
              <InventoryChart price={invPrice} brokers={invBrokers} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
