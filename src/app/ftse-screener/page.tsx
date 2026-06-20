'use client';
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Globe, Search, AlertTriangle, AlertCircle, CheckCircle2, Info,
  Loader2, Upload, Target, Trash2, Activity,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────────
interface RawRow {
  stock_code: string;
  company_name: string | null;
  sector: string | null;
  close: number;
  tradeable_shares: number;
  free_float: number;
  n_months: number;
  months_entry: number;        // months (of 12) with median daily vol ≥ 0.05% of free float
  months_retain: number;       // months (of 12) ≥ 0.04%
  median_daily_pct: number;    // median monthly value of (median daily vol / free-float shares) %
  top_holders_pct: number;
  target_date: string;
}

type FtseStatus = 'CURRENT' | 'AT_RISK' | 'CANDIDATE' | 'NEARLY' | 'NOT_ELIGIBLE';
type StatusFilter = 'ALL' | FtseStatus;

interface FtseRow extends RawRow {
  full_mc_idr: number;
  full_mc_usd: number;
  float_mc_idr: number;
  float_mc_usd: number;
  pass_free_float: boolean;
  pass_size: boolean;
  pass_liq_entry: boolean;
  pass_liq_retain: boolean;
  is_eligible: boolean;
  is_nearly: boolean;
  is_hsc: boolean;
  liquidity_ok: boolean;
  months_short: number;        // months below the entry bar
  push_upside_pct: number;     // % price rise to clear the size gate
  ftse_status: FtseStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_EXCHANGE_RATE = 17700;
const HSC_THRESHOLD = 85;
// FTSE keeps an existing constituent on a looser bar (retention 0.04%/8mo vs entry 0.05%/10mo) —
// that asymmetry is native to the methodology. For size we apply a 2/3 maintenance buffer.
const MAINTAIN_FACTOR = 2 / 3;
// "Nearly eligible": within NEAR_MONTHS of the entry month-count and ≥ NEAR_FACTOR of the size bars.
const NEAR_FACTOR = 0.75;
const NEAR_MONTHS = 2;
const LIQ_ENTRY_PCT = 0.05;   // methodology constant — median daily volume ÷ free-float shares
const LIQ_RETAIN_PCT = 0.04;
const LS_CONST = 'ftse_constituents';

const DEFAULTS = { fullMc: 150, floatMc: 75, freeFloat: 5, monthsEntry: 10, monthsRetain: 8 };

const STATUS_UI: Record<FtseStatus, { label: string; badgeCls: string; rowCls: string; dotCls: string }> = {
  CURRENT:      { label: 'Current',      badgeCls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', rowCls: '',                    dotCls: 'bg-emerald-400' },
  AT_RISK:      { label: 'At Risk',      badgeCls: 'bg-red-500/10     text-red-300     border-red-500/30',     rowCls: 'bg-red-500/[0.025]',  dotCls: 'bg-red-400' },
  CANDIDATE:    { label: 'Candidate',    badgeCls: 'bg-blue-500/10    text-blue-300    border-blue-500/30',    rowCls: 'bg-blue-500/[0.025]', dotCls: 'bg-blue-400' },
  NEARLY:       { label: 'Nearly',       badgeCls: 'bg-amber-500/10   text-amber-300   border-amber-500/30',   rowCls: 'bg-amber-500/[0.02]', dotCls: 'bg-amber-400' },
  NOT_ELIGIBLE: { label: 'Not Eligible', badgeCls: 'bg-white/5        text-gray-500    border-white/10',       rowCls: '',                    dotCls: 'bg-gray-600' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtUsd = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(2)} M` : `$${Math.round(v)} Jt`;
const fmtIdr = (v: number) => {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1)} T`;
  if (v >= 1e9)  return `Rp ${(v / 1e9).toFixed(1)} M`;
  return `Rp ${(v / 1e6).toFixed(0)} Jt`;
};

function extractCode(cell: string): string | null {
  if (/^[A-Z]{2,4}$/.test(cell)) return cell;
  const bbg = cell.match(/^([A-Z]{2,4})\s+IJ(\s|$)/);
  if (bbg) return bbg[1];
  const reuters = cell.match(/^([A-Z]{2,4})\.JK$/i);
  if (reuters) return reuters[1].toUpperCase();
  return null;
}

function parseFtseCsv(text: string): string[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const codeIdx = headers.findIndex(h => ['code', 'ticker', 'symbol', 'kode', 'constituent'].includes(h));
  const out = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    let code: string | null = null;
    if (codeIdx >= 0 && cells[codeIdx]) code = extractCode(cells[codeIdx].toUpperCase());
    if (!code) { for (const c of cells) { code = extractCode(c); if (code) break; } }
    if (code) out.add(code);
  }
  return Array.from(out);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FTSEScreenerPage() {
  const [data, setData]       = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Config
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [asOfDate, setAsOfDate]         = useState('');
  const [fullMcMin, setFullMcMin]       = useState(DEFAULTS.fullMc);
  const [floatMcMin, setFloatMcMin]     = useState(DEFAULTS.floatMc);
  const [ffMin, setFfMin]               = useState(DEFAULTS.freeFloat);
  const [monthsEntryMin, setMonthsEntryMin]   = useState(DEFAULTS.monthsEntry);
  const [monthsRetainMin, setMonthsRetainMin] = useState(DEFAULTS.monthsRetain);

  // Constituents
  const [constituents, setConstituents] = useState<string[]>([]);
  const [lastUploadMsg, setLastUploadMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [onlyPassed, setOnlyPassed]     = useState(false);
  const [onlyNearly, setOnlyNearly]     = useState(false);
  const [sortCol, setSortCol]           = useState<string>('full_mc_usd');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  useEffect(() => {
    try { const c = localStorage.getItem(LS_CONST); if (c) setConstituents(JSON.parse(c)); } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = asOfDate ? `/api/ftse-screener?date=${asOfDate}` : '/api/ftse-screener';
    fetch(url).then(r => r.json()).then(json => {
      if (json.error) { setError(json.error); setLoading(false); return; }
      setData(json.data || []);
      if (json.target_date && !asOfDate)
        setAsOfDate(new Date(json.target_date).toISOString().split('T')[0]);
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [asOfDate]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const codes = parseFtseCsv(ev.target?.result as string);
      setConstituents(codes);
      localStorage.setItem(LS_CONST, JSON.stringify(codes));
      setLastUploadMsg(`✅ ${codes.length} kode konstituen FTSE dimuat`);
      setTimeout(() => setLastUploadMsg(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearList = () => { setConstituents([]); localStorage.removeItem(LS_CONST); };

  // ── Compute ──────────────────────────────────────────────────────────────────
  const computed: FtseRow[] = useMemo(() => {
    return data.map(row => {
      // tradeable_shares = TOTAL listed shares. Full MC = total × price; Float MC = Full × free-float%.
      const fullMcIdr   = row.tradeable_shares * row.close;
      const fullMcUsd   = fullMcIdr / exchangeRate / 1_000_000;
      const floatMcIdr  = fullMcIdr * (row.free_float / 100);
      const floatMcUsd  = floatMcIdr / exchangeRate / 1_000_000;

      const passFreeFloat = row.free_float > ffMin;
      const passSize      = fullMcUsd >= fullMcMin && floatMcUsd >= floatMcMin;
      const passLiqEntry  = row.months_entry  >= monthsEntryMin;
      const passLiqRetain = row.months_retain >= monthsRetainMin;
      const isEligible    = passFreeFloat && passSize && passLiqEntry;

      // Retention bar — looser liquidity (FTSE-native) + 2/3 size buffer.
      const meetsMaintain =
        passFreeFloat &&
        fullMcUsd  >= fullMcMin  * MAINTAIN_FACTOR &&
        floatMcUsd >= floatMcMin * MAINTAIN_FACTOR &&
        passLiqRetain;

      const isHsc = row.top_holders_pct >= HSC_THRESHOLD || row.free_float < 10;

      // "Nearly eligible" — close to the entry bar: free float OK, size within near band,
      // and liquidity within NEAR_MONTHS of the required month-count (the pushable lever).
      const sizeNear = fullMcUsd >= fullMcMin * NEAR_FACTOR && floatMcUsd >= floatMcMin * NEAR_FACTOR;
      const isNearly = !isEligible && passFreeFloat && sizeNear &&
                       row.months_entry >= (monthsEntryMin - NEAR_MONTHS);

      const monthsShort = Math.max(0, monthsEntryMin - row.months_entry);
      const liquidityOk = passLiqEntry;
      const fullGap  = fullMcUsd  > 0 ? fullMcMin  / fullMcUsd  - 1 : Infinity;
      const floatGap = floatMcUsd > 0 ? floatMcMin / floatMcUsd - 1 : Infinity;
      const pushUpsidePct = Math.max(0, fullGap, floatGap) * 100;

      const isCurrent = constituents.includes(row.stock_code);
      let ftse_status: FtseStatus = 'NOT_ELIGIBLE';
      if      (isCurrent  && meetsMaintain)  ftse_status = 'CURRENT';
      else if (isCurrent  && !meetsMaintain) ftse_status = 'AT_RISK';
      else if (!isCurrent && isEligible)     ftse_status = 'CANDIDATE';
      else if (!isCurrent && isNearly)       ftse_status = 'NEARLY';

      return {
        ...row,
        full_mc_idr: fullMcIdr, full_mc_usd: fullMcUsd,
        float_mc_idr: floatMcIdr, float_mc_usd: floatMcUsd,
        pass_free_float: passFreeFloat, pass_size: passSize,
        pass_liq_entry: passLiqEntry, pass_liq_retain: passLiqRetain,
        is_eligible: isEligible, is_nearly: isNearly, is_hsc: isHsc,
        liquidity_ok: liquidityOk, months_short: monthsShort, push_upside_pct: pushUpsidePct,
        ftse_status,
      };
    }).sort((a, b) => {
      if (constituents.length > 0) {
        const ord: Record<FtseStatus, number> = { AT_RISK: 0, CANDIDATE: 1, NEARLY: 2, CURRENT: 3, NOT_ELIGIBLE: 4 };
        return ord[a.ftse_status] - ord[b.ftse_status] || b.full_mc_usd - a.full_mc_usd;
      }
      return b.full_mc_usd - a.full_mc_usd;
    });
  }, [data, exchangeRate, fullMcMin, floatMcMin, ffMin, monthsEntryMin, monthsRetainMin, constituents]);

  const displayed = useMemo(() => {
    const sorted = [...computed].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      const av = (a as any)[sortCol] ?? 0;
      const bv = (b as any)[sortCol] ?? 0;
      if (typeof av === 'string') return dir * av.localeCompare(bv);
      return dir * (av - bv);
    });
    return sorted
      .filter(r => statusFilter === 'ALL' || r.ftse_status === statusFilter)
      .filter(r => !onlyPassed || r.is_eligible)
      .filter(r => !onlyNearly || r.is_nearly)
      .filter(r => !search || r.stock_code.includes(search) || (r.company_name ?? '').toUpperCase().includes(search));
  }, [computed, statusFilter, onlyPassed, onlyNearly, search, sortCol, sortDir]);

  const counts = useMemo(() => ({
    eligible:  computed.filter(d => d.is_eligible).length,
    candidate: computed.filter(d => d.ftse_status === 'CANDIDATE').length,
    nearly:    computed.filter(d => d.ftse_status === 'NEARLY').length,
    atRisk:    computed.filter(d => d.ftse_status === 'AT_RISK').length,
    current:   computed.filter(d => d.ftse_status === 'CURRENT').length,
  }), [computed]);

  const hasConst = constituents.length > 0;

  const liqCls = (m: number) =>
    m >= monthsEntryMin ? 'text-emerald-300'
    : m >= monthsEntryMin - NEAR_MONTHS ? 'text-amber-300'
    : 'text-red-400';

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="sidebar-offset min-h-screen animate-fade-in">

      {/* Header */}
      <div className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-transparent pointer-events-none" />
        <div className="relative px-6 py-5 max-w-[1600px] mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(20,184,166,0.05) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-400">FTSE GEIS Eligibility Screener</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              FTSE Global Equity Index Series · Secondary Emerging · Median-Volume Liquidity (X/12) · Free Float &gt;5% · Constituent Tracker
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 max-w-[1600px] mx-auto space-y-4">

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Config + Summary */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 glass rounded-2xl border border-border/50 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-black">Parameter Simulasi FTSE GEIS</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Kurs USD/IDR', val: exchangeRate, set: setExchangeRate, pre: 'Rp', suf: '' },
                { label: 'Min Full MC', val: fullMcMin, set: setFullMcMin, pre: '$', suf: 'Jt' },
                { label: 'Min Float MC', val: floatMcMin, set: setFloatMcMin, pre: '$', suf: 'Jt' },
                { label: 'Min Free Float', val: ffMin, set: setFfMin, pre: '', suf: '%' },
              ].map(({ label, val, set, pre, suf }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">{label}</label>
                  <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                    {pre && <span className="text-[10px] text-gray-500">{pre}</span>}
                    <input type="number" value={val} onChange={e => set(Number(e.target.value))}
                      className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                    {suf && <span className="text-[10px] text-gray-500">{suf}</span>}
                  </div>
                </div>
              ))}
              {/* As-Of */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Tanggal As-Of</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)}
                    className="bg-transparent w-full text-white text-[11px] font-mono font-bold focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>
              {/* Months entry */}
              <div className="bg-white/5 border border-emerald-400/20 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-emerald-400/70 mb-1.5 font-bold">Bulan Masuk (≥/12 @0.05%)</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-emerald-400/20">
                  <input type="number" value={monthsEntryMin} onChange={e => setMonthsEntryMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">/12</span>
                </div>
              </div>
              {/* Months retain */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Bulan Bertahan (≥/12 @0.04%)</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <input type="number" value={monthsRetainMin} onChange={e => setMonthsRetainMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">/12</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-[9px] text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-emerald-400" /> Likuiditas = median volume harian ÷ saham free-float. Masuk: <strong>{LIQ_ENTRY_PCT}%</strong>/{monthsEntryMin} bln · Bertahan: <strong>{LIQ_RETAIN_PCT}%</strong>/{monthsRetainMin} bln</span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> HSC: Top holders KSEI ≥ 85%</span>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 content-start">
            <div className="col-span-2 glass rounded-2xl border border-emerald-400/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-1 font-bold">Lolos Semua Kriteria</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-emerald-400 font-mono">{counts.eligible}</p>
                  <p className="text-xs text-gray-500 mb-1">saham</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[9px] text-gray-500">Hampir eligible: <span className="text-amber-400 font-bold">{counts.nearly}</span></p>
                {hasConst && <p className="text-[9px] text-gray-500">Potential IN: <span className="text-blue-400 font-bold">{counts.candidate}</span></p>}
                {hasConst && <p className="text-[9px] text-gray-500">Potential OUT: <span className="text-red-400 font-bold">{counts.atRisk}</span></p>}
              </div>
            </div>

            <button onClick={() => setStatusFilter(f => f === 'NEARLY' ? 'ALL' : 'NEARLY')}
              className={`glass rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer text-left ${statusFilter === 'NEARLY' ? 'border-amber-500/50 ring-1 ring-amber-500/20' : 'border-amber-500/20 hover:border-amber-500/40'}`}>
              <div>
                <p className="text-[9px] text-amber-400/80 uppercase font-bold tracking-wider">◐ Hampir Masuk</p>
                <p className="text-3xl font-black text-amber-400 font-mono mt-1">{counts.nearly}</p>
              </div>
              <Target className="w-7 h-7 text-amber-500/40" />
            </button>
            {hasConst ? (
              <button onClick={() => setStatusFilter(f => f === 'CANDIDATE' ? 'ALL' : 'CANDIDATE')}
                className={`glass rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer text-left ${statusFilter === 'CANDIDATE' ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-blue-500/20 hover:border-blue-500/40'}`}>
                <div>
                  <p className="text-[9px] text-blue-400/80 uppercase font-bold tracking-wider">🎯 Potential IN</p>
                  <p className="text-3xl font-black text-blue-400 font-mono mt-1">{counts.candidate}</p>
                </div>
                <CheckCircle2 className="w-7 h-7 text-blue-500/40" />
              </button>
            ) : (
              <div className="glass rounded-xl border border-white/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-emerald-400/80 uppercase font-bold tracking-wider">✓ Eligible</p>
                  <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{counts.eligible}</p>
                </div>
                <CheckCircle2 className="w-7 h-7 text-emerald-500/40" />
              </div>
            )}
          </div>
        </div>

        {/* Constituent Upload */}
        <div className="glass rounded-2xl border border-white/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-400/15 border border-emerald-400/30 flex items-center justify-center">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-black">Konstituen FTSE</span>
            {hasConst ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-400/15 text-emerald-400 border border-emerald-400/25">{constituents.length} saham</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-gray-500 border border-white/10">Upload CSV → deteksi Potential IN / OUT</span>
            )}
            {lastUploadMsg && <span className="text-emerald-300 text-[11px] font-bold">{lastUploadMsg}</span>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-emerald-400/10 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/20 transition-colors">
              <Upload className="w-3 h-3" /> Upload CSV
            </button>
            {hasConst && (
              <button onClick={clearList}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-white/5 text-gray-400 border-white/10 hover:text-red-400 hover:border-red-500/30 transition-colors">
                <Trash2 className="w-3 h-3" /> Reset
              </button>
            )}
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleUpload} className="hidden" />
          </div>
        </div>

        {/* Table */}
        <div className="glass rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Cari saham..." value={search}
                  onChange={e => setSearch(e.target.value.toUpperCase())}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-emerald-400/50 w-48" />
              </div>
              {hasConst && (
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: 'ALL',          label: 'Semua',        cls: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' },
                    { key: 'AT_RISK',      label: '⚠ At Risk',    cls: 'border-red-500/40     bg-red-500/10     text-red-300'     },
                    { key: 'CANDIDATE',    label: '🎯 Candidate',  cls: 'border-blue-500/40    bg-blue-500/10    text-blue-300'    },
                    { key: 'NEARLY',       label: '◐ Hampir',     cls: 'border-amber-500/40   bg-amber-500/10   text-amber-300'   },
                    { key: 'CURRENT',      label: '✓ Current',    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                  ] as const).map(({ key, label, cls }) => (
                    <button key={key} onClick={() => setStatusFilter(key as StatusFilter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        statusFilter === key ? cls : 'border-white/10 bg-white/5 text-gray-600 hover:text-gray-400'
                      }`}>{label}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={onlyPassed} onChange={e => setOnlyPassed(e.target.checked)} className="hidden" />
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${onlyPassed ? 'bg-emerald-400 border-emerald-400' : 'bg-background border-white/20 group-hover:border-white/40'}`}>
                  {onlyPassed && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                </div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Hanya Lolos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group" title="Hampir eligible — kandidat yang volume/ukurannya berpotensi 'didorong' agar masuk FTSE">
                <input type="checkbox" checked={onlyNearly} onChange={e => setOnlyNearly(e.target.checked)} className="hidden" />
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${onlyNearly ? 'bg-amber-500 border-amber-500' : 'bg-background border-white/20 group-hover:border-white/40'}`}>
                  {onlyNearly && <Target className="w-3.5 h-3.5 text-black" />}
                </div>
                <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Hampir Eligible</span>
              </label>
            </div>
          </div>

          <div className="mx-4 mt-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-emerald-300/70 leading-relaxed">
              <strong className="text-emerald-300">Catatan:</strong> Lolos screener ≠ pasti masuk FTSE.
              <span className="text-gray-500"> (1) Ambang ukuran FTSE berbasis percentile cumulative float mcap regional — angka Min MC di sini adalah perkiraan yang bisa Anda sesuaikan;
              (2) Tes likuiditas resmi diuji di review Maret & September;
              (3) Foreign headroom & batas asing belum diperhitungkan (keterbatasan data);
              (4) Fast Entry untuk IPO punya aturan terpisah.</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Mengkalkulasi kriteria FTSE...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse mobile-pin" style={{ minWidth: 1300 }}>
                <thead className="bg-background border-b border-white/5 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 w-10">#</th>
                    {[
                      { col: 'stock_code', label: 'Saham', align: 'left' },
                      { col: 'full_mc_usd', label: 'Full Market Cap', align: 'right' },
                      { col: 'float_mc_usd', label: 'Float Market Cap', align: 'right' },
                      { col: 'free_float', label: 'Free Float', align: 'right' },
                      { col: 'months_entry', label: 'Likuiditas /12', align: 'right' },
                      { col: 'median_daily_pct', label: 'Median Harian', align: 'right' },
                    ].map(({ col, label, align }) => (
                      <th key={col} onClick={() => handleSort(col)}
                        className={`px-4 py-3 text-[10px] uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-white text-${align} ${sortCol === col ? 'text-white' : 'text-gray-500'}`}>
                        <span className="inline-flex items-center gap-1">{label}{sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ' ↕'}</span>
                      </th>
                    ))}
                    {hasConst && <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-emerald-400/70 text-center">Status FTSE</th>}
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 text-center">Kriteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {displayed.map((row, i) => {
                    const sc = STATUS_UI[row.ftse_status];
                    return (
                      <tr key={row.stock_code} className={`hover:bg-white/[0.025] transition-colors ${sc.rowCls}`}>
                        <td className="px-4 py-3 text-xs text-gray-600 font-mono">{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link href={`/stock/${row.stock_code}`} prefetch={false} className="hover:opacity-75 transition-opacity">
                            <p className="font-black text-white text-sm">{row.stock_code}</p>
                            <p className="text-[9px] text-gray-500 truncate max-w-[160px]">{row.company_name ?? '—'}</p>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm ${row.pass_size ? 'text-white' : 'text-red-400'}`}>{fmtUsd(row.full_mc_usd)}</p>
                          <p className="text-[9px] text-gray-600 font-mono">{fmtIdr(row.full_mc_idr)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm ${row.pass_size ? 'text-white' : 'text-red-400'}`}>{fmtUsd(row.float_mc_usd)}</p>
                          <p className="text-[9px] text-gray-600 font-mono">{fmtIdr(row.float_mc_idr)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {row.is_hsc && <span title={`Top holders KSEI = ${row.top_holders_pct.toFixed(1)}%`}><AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" /></span>}
                            <p className={`font-mono font-bold text-sm ${row.pass_free_float ? 'text-white' : 'text-red-400'}`}>{row.free_float.toFixed(1)}%</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm ${liqCls(row.months_entry)}`}>{row.months_entry.toFixed(0)}/12</p>
                          <p className="text-[8px] text-gray-600 font-mono">bertahan {row.months_retain.toFixed(0)}/12</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-mono font-bold text-sm text-white">{row.median_daily_pct.toFixed(3)}%</p>
                          <p className="text-[8px] text-gray-600">min {LIQ_ENTRY_PCT}%</p>
                        </td>
                        {hasConst && (
                          <td className="px-4 py-3 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black ${sc.badgeCls}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${sc.dotCls}`} />
                              {sc.label}
                            </div>
                            {row.ftse_status === 'NEARLY' && (
                              <p className="text-[8px] text-amber-400/80 mt-1 font-bold">
                                {row.months_short > 0 ? `≈ −${row.months_short} bln likuiditas` : row.liquidity_ok ? `≈ +${row.push_upside_pct.toFixed(0)}% → masuk` : 'hampir'}
                              </p>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {row.is_eligible ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-emerald-300 text-[10px] font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                            </div>
                          ) : row.is_nearly ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black"
                              title={row.months_short > 0 ? `Kurang ${row.months_short} bulan likuiditas dari ambang masuk` : `Likuiditas cukup — perlu ~+${row.push_upside_pct.toFixed(0)}% harga untuk lolos ukuran`}>
                              <Target className="w-3.5 h-3.5" /> NEARLY{row.months_short > 0 ? ` · −${row.months_short}bln` : row.liquidity_ok ? ` · +${row.push_upside_pct.toFixed(0)}%` : ''}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-gray-600 text-[10px] font-bold">
                              FAILED
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {displayed.length === 0 && (
                    <tr>
                      <td colSpan={hasConst ? 9 : 8} className="text-center py-14 text-gray-600">Tidak ada data saham yang sesuai filter.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
