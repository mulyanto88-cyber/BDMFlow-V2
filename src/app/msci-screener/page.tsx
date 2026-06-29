'use client';
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Shield, Settings, Search, AlertTriangle, AlertCircle,
  CheckCircle2, XCircle, Info, Calculator,
  Loader2, TrendingUp, Upload, Target,
  ChevronDown, ChevronUp, Trash2
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawRow {
  stock_code: string;
  company_name: string | null;
  sector: string | null;
  close: number;
  tradeable_shares: number;
  free_float: number;
  days_3m: number;
  total_days_3m: number;
  med_sum_3m: number;
  n_months_3m: number;
  med_sum_12m: number;
  n_months_12m: number;
  top_holders_pct: number;
  target_date: string;
}

type MsciStatus = 'CURRENT' | 'AT_RISK' | 'CANDIDATE' | 'NEARLY' | 'NOT_ELIGIBLE';
type StatusFilter = 'ALL' | MsciStatus;
type Category = 'STANDARD' | 'SMALLCAP';

interface MsciRow extends RawRow {
  full_mc_idr: number;
  full_mc_usd: number;
  float_mc_idr: number;
  float_mc_usd: number;
  atvr_3m: number;
  atvr_12m: number;
  fot_3m: number;
  is_hsc: boolean;
  requires_multiplier: boolean;
  required_float_usd: number;
  pass_full_mc: boolean;
  pass_float_mc: boolean;
  pass_atvr_3m: boolean;
  pass_atvr_12m: boolean;
  pass_fot_3m: boolean;
  is_eligible: boolean;
  is_nearly: boolean;
  liquidity_ok: boolean;
  push_upside_pct: number;
  msci_status: MsciStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_EXCHANGE_RATE = 17700;
const HSC_THRESHOLD = 85;
// MSCI keeps an existing constituent while its size/ATVR stays ≥ 2/3 of the inclusion bar
// (documented ATVR maintenance buffer = 2/3 → 10% for EM). Applied to size as a conservative proxy.
const MAINTAIN_FACTOR = 2 / 3;
// "Nearly eligible": a non-member clearing ≥ this fraction of EVERY criterion (but not the full bar).
// Close enough that a modest markup could push it in — prime owner-driven inclusion candidates.
const NEAR_FACTOR = 0.75;
const LS_STD = 'msci_standard_constituents';
const LS_SC  = 'msci_smallcap_constituents';

const CONFIGS = {
  // MSCI EM liquidity: 3M/12M ATVR ≥ 15%. Frequency of Trading: the Standard Index excludes < 90%,
  // the investable universe / Small Cap uses ≥ 80%. Size refs (fullMc/floatMc, USD mn) are global
  // minimums that MSCI updates each May/Nov SAIR — refresh them after each review.
  STANDARD: { label: 'Standard (Large/Mid)', fullMc: 2964, floatMc: 1482, fif: 15, atvr3m: 15, atvr12m: 15, fot3m: 90 },
  SMALLCAP:  { label: 'Small Cap',           fullMc: 250,  floatMc: 125,  fif: 15, atvr3m: 15, atvr12m: 15, fot3m: 80 },
};

const STATUS_UI: Record<MsciStatus, { label: string; badgeCls: string; rowCls: string; dotCls: string }> = {
  CURRENT:      { label: 'Current',      badgeCls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', rowCls: '',                      dotCls: 'bg-emerald-400' },
  AT_RISK:      { label: 'At Risk',      badgeCls: 'bg-red-500/10     text-red-300     border-red-500/30',     rowCls: 'bg-red-500/[0.025]',    dotCls: 'bg-red-400' },
  CANDIDATE:    { label: 'Candidate',    badgeCls: 'bg-blue-500/10    text-blue-300    border-blue-500/30',    rowCls: 'bg-blue-500/[0.025]',   dotCls: 'bg-blue-400' },
  NEARLY:       { label: 'Nearly',       badgeCls: 'bg-amber-500/10   text-amber-300   border-amber-500/30',   rowCls: 'bg-amber-500/[0.02]',   dotCls: 'bg-amber-400' },
  NOT_ELIGIBLE: { label: 'Not Eligible', badgeCls: 'bg-white/5        text-gray-500    border-white/10',       rowCls: '',                      dotCls: 'bg-gray-600' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtUsd = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(2)} M` : `$${Math.round(v)} Jt`;
const fmtIdr = (v: number) => {
  if (v >= 1e12) return `Rp ${(v / 1e12).toFixed(1)} T`;
  if (v >= 1e9)  return `Rp ${(v / 1e9).toFixed(1)} M`;
  return `Rp ${(v / 1e6).toFixed(0)} Jt`;
};

interface ParsedConstituents {
  standard: string[];
  smallCap: string[];
  isSmartSplit: boolean;
}

function extractCode(cell: string): string | null {
  if (/^[A-Z]{2,4}$/.test(cell)) return cell;
  const bbg = cell.match(/^([A-Z]{2,4})\s+IJ(\s|$)/);
  if (bbg) return bbg[1];
  const reuters = cell.match(/^([A-Z]{2,4})\.JK$/i);
  if (reuters) return reuters[1].toUpperCase();
  return null;
}

function parseMsciCsv(text: string, type: 'std' | 'sc'): ParsedConstituents {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { standard: [], smallCap: [], isSmartSplit: false };

  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const codeIdx = headers.findIndex(h => ['code', 'ticker', 'symbol', 'kode'].includes(h));
  const catIdx  = headers.findIndex(h => h.includes('category') || h.includes('kategori') || h.includes('segment') || h.includes('type'));

  const standard = new Set<string>();
  const smallCap = new Set<string>();
  const uncat    = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
    // Try dedicated code column first, then scan all cells
    let code: string | null = null;
    if (codeIdx >= 0 && cells[codeIdx]) code = extractCode(cells[codeIdx].toUpperCase());
    if (!code) { for (const c of cells) { code = extractCode(c); if (code) break; } }
    if (!code) continue;

    if (catIdx >= 0 && cells[catIdx]) {
      const cat = cells[catIdx].toLowerCase();
      if (cat.includes('standard') || cat.includes('large') || cat.includes('mid') || cat.includes('global standard')) standard.add(code);
      else if (cat.includes('small')) smallCap.add(code);
      else uncat.add(code);
    } else {
      uncat.add(code);
    }
  }

  const hasSmartSplit = standard.size > 0 || smallCap.size > 0;

  if (hasSmartSplit) {
    // Kolom Category terdeteksi — auto-split
    uncat.forEach(c => (type === 'std' ? standard : smallCap).add(c));
    return { standard: Array.from(standard), smallCap: Array.from(smallCap), isSmartSplit: true };
  }

  // No category column — treat as selected type
  const all = Array.from(uncat);
  return { standard: type === 'std' ? all : [], smallCap: type === 'sc' ? all : [], isSmartSplit: false };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MSCIScreenerPage() {
  const [data, setData]       = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // Config
  const [category, setCategory]         = useState<Category>('STANDARD');
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [asOfDate, setAsOfDate]         = useState('');
  const [fullMcMin, setFullMcMin]       = useState(CONFIGS.STANDARD.fullMc);
  const [floatMcMin, setFloatMcMin]     = useState(CONFIGS.STANDARD.floatMc);
  const [fifMin, setFifMin]             = useState(CONFIGS.STANDARD.fif);
  const [atvr3mMin, setAtvr3mMin]       = useState(CONFIGS.STANDARD.atvr3m);
  const [atvr12mMin, setAtvr12mMin]     = useState(CONFIGS.STANDARD.atvr12m);
  const [fot3mMin, setFot3mMin]         = useState(CONFIGS.STANDARD.fot3m);

  // Constituents
  const [stdList, setStdList]           = useState<string[]>([]);
  const [scList, setScList]             = useState<string[]>([]);
  const [showConstPanel, setShowConstPanel] = useState(false);
  const stdRef = useRef<HTMLInputElement>(null);
  const scRef  = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [onlyPassed, setOnlyPassed]     = useState(false);
  const [onlyNearly, setOnlyNearly]     = useState(false);
  const [excludeHsc, setExcludeHsc]     = useState(false);
  const [sortCol, setSortCol]           = useState<string>('full_mc_usd');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('desc');

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  // Load constituents from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_STD); if (s) setStdList(JSON.parse(s));
      const c = localStorage.getItem(LS_SC);  if (c) setScList(JSON.parse(c));
    } catch {}
  }, []);

  // Sync thresholds when category changes
  useEffect(() => {
    const cfg = CONFIGS[category];
    setFullMcMin(cfg.fullMc); setFloatMcMin(cfg.floatMc); setFifMin(cfg.fif);
    setAtvr3mMin(cfg.atvr3m); setAtvr12mMin(cfg.atvr12m); setFot3mMin(cfg.fot3m);
  }, [category]);

  // Fetch
  useEffect(() => {
    setLoading(true);
    const url = asOfDate ? `/api/msci-screener?date=${asOfDate}` : '/api/msci-screener';
    fetch(url).then(r => r.json()).then(json => {
      if (json.error) { setError(json.error); setLoading(false); return; }
      setData(json.data || []);
      if (json.target_date && !asOfDate)
        setAsOfDate(new Date(json.target_date).toISOString().split('T')[0]);
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [asOfDate]);

  const [lastUploadMsg, setLastUploadMsg] = useState<string | null>(null);
  const smartRef = useRef<HTMLInputElement>(null);

  // CSV Upload
  const handleUpload = (type: 'std' | 'sc') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = parseMsciCsv(ev.target?.result as string, type);
      if (result.isSmartSplit) {
        setStdList(result.standard); localStorage.setItem(LS_STD, JSON.stringify(result.standard));
        setScList(result.smallCap);  localStorage.setItem(LS_SC,  JSON.stringify(result.smallCap));
        setLastUploadMsg(`✅ Auto-split: ${result.standard.length} Standard · ${result.smallCap.length} Small Cap terdeteksi`);
      } else {
        const codes = type === 'std' ? result.standard : result.smallCap;
        if (type === 'std') { setStdList(codes); localStorage.setItem(LS_STD, JSON.stringify(codes)); }
        else                { setScList(codes);  localStorage.setItem(LS_SC,  JSON.stringify(codes)); }
        setLastUploadMsg(`✅ ${codes.length} kode saham berhasil dimuat`);
      }
      setTimeout(() => setLastUploadMsg(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const clearList = (type: 'std' | 'sc') => {
    if (type === 'std') { setStdList([]); localStorage.removeItem(LS_STD); }
    else                { setScList([]);  localStorage.removeItem(LS_SC);  }
  };

  const activeList = category === 'STANDARD' ? stdList : scList;

  // ── Compute ──────────────────────────────────────────────────────────────────
  const computed: MsciRow[] = useMemo(() => {
    return data.map(row => {
      // tradeable_shares = TOTAL listed shares (verified: TLKM/ASII match their total share counts,
      // not free float). Full MC = total shares × price;  Float MC = Full MC × free-float%.
      const fullMcIdr   = row.tradeable_shares * row.close;
      const fullMcUsd   = fullMcIdr / exchangeRate / 1_000_000;
      const floatMcIdr  = fullMcIdr * (row.free_float / 100);
      const floatMcUsd  = floatMcIdr / exchangeRate / 1_000_000;

      // MSCI ATVR: average monthly (median daily value × trading days) ÷ float MC, annualized ×12.
      // Median per month screens out one-off block-trade spikes (vs a plain sum/mean).
      const atvr3m  = floatMcIdr > 0 && row.n_months_3m > 0
        ? (row.med_sum_3m  / row.n_months_3m)  / floatMcIdr * 12 * 100 : 0;
      const atvr12m = floatMcIdr > 0 && row.n_months_12m > 0
        ? (row.med_sum_12m / row.n_months_12m) / floatMcIdr * 12 * 100 : 0;
      const fot3m   = row.total_days_3m > 0 ? (row.days_3m / row.total_days_3m) * 100 : 0;

      const isHsc              = row.top_holders_pct >= HSC_THRESHOLD || row.free_float < 10;
      const requiresMultiplier = row.free_float < fifMin;
      const requiredFloatUsd   = requiresMultiplier ? floatMcMin * 1.8 : floatMcMin;

      // Inclusion bar — full thresholds (drives "PASSED" and ADDITION / Candidate)
      const passFullMc  = fullMcUsd  >= fullMcMin;
      const passFloatMc = floatMcUsd >= requiredFloatUsd;
      const passAtvr3m  = atvr3m     >= atvr3mMin;
      const passAtvr12m = atvr12m    >= atvr12mMin;
      const passFot3m   = fot3m      >= fot3mMin;
      const isEligible  = passFullMc && passFloatMc && passAtvr3m && passAtvr12m && passFot3m;

      // Maintenance bar — asymmetric & looser: MSCI keeps an existing constituent while size/ATVR
      // stay ≥ 2/3 of the requirement (FOT stays a hard screen). Stops false "OUT" on members that
      // only dip slightly below the inclusion line.
      const meetsMaintain =
        fullMcUsd  >= fullMcMin        * MAINTAIN_FACTOR &&
        floatMcUsd >= requiredFloatUsd * MAINTAIN_FACTOR &&
        atvr3m     >= atvr3mMin        * MAINTAIN_FACTOR &&
        atvr12m    >= atvr12mMin       * MAINTAIN_FACTOR &&
        passFot3m;

      // "Nearly eligible" — clears ≥ NEAR_FACTOR of EVERY criterion but not the full bar.
      const isNearly =
        !isEligible &&
        fullMcUsd  >= fullMcMin        * NEAR_FACTOR &&
        floatMcUsd >= requiredFloatUsd * NEAR_FACTOR &&
        atvr3m     >= atvr3mMin        * NEAR_FACTOR &&
        atvr12m    >= atvr12mMin       * NEAR_FACTOR &&
        fot3m      >= fot3mMin         * NEAR_FACTOR;

      // Liquidity already cleared? Then size is the only gate → a price markup can lift it in.
      const liquidityOk = passAtvr3m && passAtvr12m && passFot3m;
      // % price rise needed to clear BOTH size thresholds (price scales Full & Float MC linearly).
      const fullGap  = fullMcUsd  > 0 ? fullMcMin        / fullMcUsd  - 1 : Infinity;
      const floatGap = floatMcUsd > 0 ? requiredFloatUsd / floatMcUsd - 1 : Infinity;
      const pushUpsidePct = Math.max(0, fullGap, floatGap) * 100;

      const isCurrent = activeList.includes(row.stock_code);
      let msci_status: MsciStatus = 'NOT_ELIGIBLE';
      if      (isCurrent  && meetsMaintain)  msci_status = 'CURRENT';   // within buffer → stays in
      else if (isCurrent  && !meetsMaintain) msci_status = 'AT_RISK';   // below buffer → potential OUT
      else if (!isCurrent && isEligible)     msci_status = 'CANDIDATE'; // clears full bar → potential IN
      else if (!isCurrent && isNearly)       msci_status = 'NEARLY';    // near band → potential push-in

      return {
        ...row,
        full_mc_idr: fullMcIdr, full_mc_usd: fullMcUsd,
        float_mc_idr: floatMcIdr, float_mc_usd: floatMcUsd,
        atvr_3m: atvr3m, atvr_12m: atvr12m, fot_3m: fot3m,
        is_hsc: isHsc, requires_multiplier: requiresMultiplier, required_float_usd: requiredFloatUsd,
        pass_full_mc: passFullMc, pass_float_mc: passFloatMc,
        pass_atvr_3m: passAtvr3m, pass_atvr_12m: passAtvr12m, pass_fot_3m: passFot3m,
        is_eligible: isEligible, is_nearly: isNearly, liquidity_ok: liquidityOk,
        push_upside_pct: pushUpsidePct, msci_status,
      };
    }).sort((a, b) => {
      if (activeList.length > 0) {
        const ord: Record<MsciStatus, number> = { AT_RISK: 0, CANDIDATE: 1, NEARLY: 2, CURRENT: 3, NOT_ELIGIBLE: 4 };
        return ord[a.msci_status] - ord[b.msci_status] || b.full_mc_usd - a.full_mc_usd;
      }
      return b.full_mc_usd - a.full_mc_usd;
    });
  }, [data, exchangeRate, fullMcMin, floatMcMin, fifMin, atvr3mMin, atvr12mMin, fot3mMin, activeList]);

  const displayed = useMemo(() => {
    const sorted = [...computed].sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      const av = (a as any)[sortCol] ?? 0;
      const bv = (b as any)[sortCol] ?? 0;
      if (typeof av === 'string') return dir * av.localeCompare(bv);
      return dir * (av - bv);
    });
    return sorted
      .filter(r => statusFilter === 'ALL' || r.msci_status === statusFilter)
      .filter(r => !onlyPassed  || r.is_eligible)
      .filter(r => !onlyNearly  || r.is_nearly)
      .filter(r => !excludeHsc  || !r.is_hsc)
      .filter(r => !search || r.stock_code.includes(search) || (r.company_name ?? '').toUpperCase().includes(search));
  }, [computed, statusFilter, onlyPassed, onlyNearly, excludeHsc, search, sortCol, sortDir]);

  const counts = useMemo(() => ({
    eligible:  computed.filter(d => d.is_eligible).length,
    current:   computed.filter(d => d.msci_status === 'CURRENT').length,
    atRisk:    computed.filter(d => d.msci_status === 'AT_RISK').length,
    candidate: computed.filter(d => d.msci_status === 'CANDIDATE').length,
    nearly:    computed.filter(d => d.msci_status === 'NEARLY').length,
    hsc:       computed.filter(d => d.is_eligible && d.is_hsc).length,
    mult:      computed.filter(d => d.is_eligible && d.requires_multiplier).length,
  }), [computed]);

  const hasConst = activeList.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen animate-fade-in">

      {/* Header */}
      <div className="relative border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-yellow-900/5 to-transparent pointer-events-none" />
        <div className="relative px-6 py-5 max-w-[1600px] mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
            <Shield className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight gradient-gold">MSCI Eligibility Screener</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              GIMI Methodology · 3M/12M ATVR · 3M FOT · FIF 1.8× · HSC · Constituent Tracker
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

          {/* Config Panel */}
          <div className="xl:col-span-2 glass rounded-2xl border border-border/50 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-black">Parameter Simulasi MSCI</span>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl">
                {(['STANDARD', 'SMALLCAP'] as Category[]).map(c => (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      category === c ? 'bg-gold-400/20 text-gold-400 border border-gold-400/40' : 'text-gray-500 hover:text-gray-300'
                    }`}>{CONFIGS[c].label}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Kurs */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Kurs USD/IDR</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <span className="text-[10px] text-gray-500">Rp</span>
                  <input type="number" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                </div>
              </div>
              {/* As-Of Date */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Tanggal As-Of</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <input type="date" value={asOfDate} onChange={e => setAsOfDate(e.target.value)}
                    className="bg-transparent w-full text-white text-[11px] font-mono font-bold focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>
              {/* Full MC */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Min Full MC</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <span className="text-[10px] text-gray-500">$</span>
                  <input type="number" value={fullMcMin} onChange={e => setFullMcMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">Jt</span>
                </div>
              </div>
              {/* Float MC */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Min Float MC</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <span className="text-[10px] text-gray-500">$</span>
                  <input type="number" value={floatMcMin} onChange={e => setFloatMcMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">Jt</span>
                </div>
              </div>
              {/* FIF */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Min FIF</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <input type="number" value={fifMin} onChange={e => setFifMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">%</span>
                </div>
              </div>
              {/* 3M ATVR */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Min 3M ATVR</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <input type="number" value={atvr3mMin} onChange={e => setAtvr3mMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">%</span>
                </div>
              </div>
              {/* 12M ATVR */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1.5 font-bold">Min 12M ATVR</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-white/5">
                  <input type="number" value={atvr12mMin} onChange={e => setAtvr12mMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">%</span>
                </div>
              </div>
              {/* 3M FOT */}
              <div className="bg-white/5 border border-gold-400/20 rounded-xl p-3">
                <label className="block text-[9px] uppercase tracking-wider text-gold-400/70 mb-1.5 font-bold">Min 3M FOT ✦ NEW</label>
                <div className="flex items-center gap-1.5 bg-background rounded-lg px-2.5 py-1.5 border border-gold-400/20">
                  <input type="number" value={fot3mMin} onChange={e => setFot3mMin(Number(e.target.value))}
                    className="bg-transparent w-full text-white text-xs font-mono font-bold focus:outline-none" />
                  <span className="text-[10px] text-gray-500">%</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-[9px] text-gray-400 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-gold-400" /> FIF &lt; {fifMin}% → Float MC dikali <strong>1.8×</strong></span>
              <span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> HSC: Top holders KSEI ≥ 85%</span>
              <span className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-blue-400" /> FOT = Hari diperdagangkan ÷ Total hari bursa 3 bulan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 content-start">
            <div className="col-span-2 glass rounded-2xl border border-gold-400/20 p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gold-400/80 mb-1 font-bold">Lolos Semua Kriteria</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-gold-400 font-mono">{counts.eligible}</p>
                  <p className="text-xs text-gray-500 mb-1">saham</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[9px] text-gray-500">Hampir eligible: <span className="text-amber-400 font-bold">{counts.nearly}</span></p>
                <p className="text-[9px] text-gray-500">Multiplier 1.8x: <span className="text-blue-400 font-bold">{counts.mult}</span></p>
                <p className="text-[9px] text-gray-500">HSC Warning: <span className="text-yellow-400 font-bold">{counts.hsc}</span></p>
              </div>
            </div>

            {hasConst && (
              <>
                <button onClick={() => setStatusFilter(f => f === 'AT_RISK' ? 'ALL' : 'AT_RISK')}
                  className={`glass rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer text-left ${statusFilter === 'AT_RISK' ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-red-500/20 hover:border-red-500/40'}`}>
                  <div>
                    <p className="text-[9px] text-red-400/80 uppercase font-bold tracking-wider">⚠ Potential OUT</p>
                    <p className="text-3xl font-black text-red-400 font-mono mt-1">{counts.atRisk}</p>
                  </div>
                  <XCircle className="w-7 h-7 text-red-500/40" />
                </button>
                <button onClick={() => setStatusFilter(f => f === 'CANDIDATE' ? 'ALL' : 'CANDIDATE')}
                  className={`glass rounded-xl border p-4 flex items-center justify-between transition-all cursor-pointer text-left ${statusFilter === 'CANDIDATE' ? 'border-blue-500/50 ring-1 ring-blue-500/20' : 'border-blue-500/20 hover:border-blue-500/40'}`}>
                  <div>
                    <p className="text-[9px] text-blue-400/80 uppercase font-bold tracking-wider">🎯 Potential IN</p>
                    <p className="text-3xl font-black text-blue-400 font-mono mt-1">{counts.candidate}</p>
                  </div>
                  <Target className="w-7 h-7 text-blue-500/40" />
                </button>
                <div className="col-span-2 glass rounded-xl border border-white/5 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] text-emerald-400/80 uppercase font-bold tracking-wider">✓ Current Members</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{counts.current}</p>
                  </div>
                  <CheckCircle2 className="w-7 h-7 text-emerald-500/40" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Constituent Upload Panel ── */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <button onClick={() => setShowConstPanel(p => !p)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gold-400/15 border border-gold-400/30 flex items-center justify-center">
                <Upload className="w-3.5 h-3.5 text-gold-400" />
              </div>
              <span className="text-sm font-black">Manajemen Konstituen MSCI</span>
              <div className="flex gap-2 ml-1">
                {stdList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gold-400/15 text-gold-400 border border-gold-400/25">
                    Standard: {stdList.length} saham
                  </span>
                )}
                {scList.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gold-400/15 text-gold-400 border border-gold-400/25">
                    Small Cap: {scList.length} saham
                  </span>
                )}
                {stdList.length === 0 && scList.length === 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-gray-500 border border-white/10">
                    Upload CSV MSCI → deteksi saham Potential IN/OUT
                  </span>
                )}
              </div>
            </div>
            {showConstPanel ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>

          {showConstPanel && (
            <div className="px-5 pb-5 pt-4 border-t border-white/5 space-y-4">

              {/* Smart Upload Banner */}
              <div className="bg-gradient-to-r from-amber-900/10 to-yellow-900/5 border border-gold-400/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-gold-400 mb-0.5">⚡ Smart Upload — 1 File untuk Standard & Small Cap</p>
                  <p className="text-[10px] text-gray-500">Jika CSV punya kolom <code className="bg-white/10 px-1 rounded text-gold-400">Category</code>, sistem otomatis pisah Standard dan Small Cap dalam satu kali upload.</p>
                  <p className="text-[10px] text-gray-500 mt-1">Format: <code className="bg-white/10 px-1 rounded text-gray-400">Code, Name, Category</code> — Category berisi kata "Standard" atau "Small".</p>
                </div>
                <button onClick={() => smartRef.current?.click()}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black border bg-gold-400/15 text-gold-400 border-gold-400/30 hover:bg-gold-400/25 transition-colors whitespace-nowrap">
                  <Upload className="w-4 h-4" /> Smart Upload
                </button>
                <input ref={smartRef} type="file" accept=".csv,.txt" onChange={handleUpload('std')} className="hidden" />
              </div>

              {/* Upload Success Toast */}
              {lastUploadMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-emerald-300 text-[11px] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> {lastUploadMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standard */}
              <div className="bg-white/5 border border-gold-400/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gold-400">MSCI Indonesia Standard Index</p>
                  <div className="flex gap-2">
                    <button onClick={() => stdRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-gold-400/10 text-gold-400 border-gold-400/30 hover:bg-gold-400/20 transition-colors">
                      <Upload className="w-3 h-3" /> Upload CSV
                    </button>
                    {stdList.length > 0 && (
                      <button onClick={() => clearList('std')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-white/5 text-gray-400 border-white/10 hover:text-red-400 hover:border-red-500/30 transition-colors">
                        <Trash2 className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>
                <input ref={stdRef} type="file" accept=".csv,.txt" onChange={handleUpload('std')} className="hidden" />
                {stdList.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {stdList.map(c => <span key={c} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-gold-400/10 text-gold-400 border border-gold-400/20">{c}</span>)}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-600">Upload file CSV dari MSCI. Kode saham (2–4 huruf) akan terdeteksi otomatis dari semua kolom.</p>
                )}
              </div>

              {/* Small Cap */}
              <div className="bg-white/5 border border-gold-400/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gold-400">MSCI Indonesia Small Cap Index</p>
                  <div className="flex gap-2">
                    <button onClick={() => scRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-gold-400/10 text-gold-400 border-gold-400/30 hover:bg-gold-400/20 transition-colors">
                      <Upload className="w-3 h-3" /> Upload CSV
                    </button>
                    {scList.length > 0 && (
                      <button onClick={() => clearList('sc')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-white/5 text-gray-400 border-white/10 hover:text-red-400 hover:border-red-500/30 transition-colors">
                        <Trash2 className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>
                </div>
                <input ref={scRef} type="file" accept=".csv,.txt" onChange={handleUpload('sc')} className="hidden" />
                {scList.length > 0 ? (
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {scList.map(c => <span key={c} className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-gold-400/10 text-gold-400 border border-gold-400/20">{c}</span>)}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-600">Upload file CSV dari MSCI. Kode saham (2–4 huruf) akan terdeteksi otomatis dari semua kolom.</p>
                )}
              </div>
              </div> {/* end inner grid */}
            </div>
          )}
        </div>

        {/* ── Table ── */}
        <div className="glass rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex flex-wrap gap-3 items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Cari saham..." value={search}
                  onChange={e => setSearch(e.target.value.toUpperCase())}
                  className="pl-9 pr-4 py-2 bg-white/5 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:border-gold-400/50 w-48" />
              </div>

              {hasConst && (
                <div className="flex gap-1.5 flex-wrap">
                  {([
                    { key: 'ALL',          label: 'Semua',        cls: 'border-gold-400/40 bg-gold-400/10 text-gold-400' },
                    { key: 'AT_RISK',      label: '⚠ At Risk',    cls: 'border-red-500/40     bg-red-500/10     text-red-300'     },
                    { key: 'CANDIDATE',    label: '🎯 Candidate',  cls: 'border-blue-500/40    bg-blue-500/10    text-blue-300'    },
                    { key: 'NEARLY',       label: '◐ Hampir',     cls: 'border-amber-500/40   bg-amber-500/10   text-amber-300'   },
                    { key: 'CURRENT',      label: '✓ Current',    cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                    { key: 'NOT_ELIGIBLE', label: 'Not Eligible', cls: 'border-white/20        bg-white/5        text-gray-400'    },
                  ] as const).map(({ key, label, cls }) => (
                    <button key={key} onClick={() => setStatusFilter(key as StatusFilter)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        statusFilter === key ? cls : 'border-white/10 bg-white/5 text-gray-600 hover:text-gray-400'
                      }`}>{label}</button>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={onlyPassed} onChange={e => setOnlyPassed(e.target.checked)} className="hidden" />
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                onlyPassed ? 'bg-gold-400 border-gold-400' : 'bg-background border-white/20 group-hover:border-white/40'
              }`}>
                {onlyPassed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Hanya yang Lolos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group" title="Hampir eligible — kandidat yang berpotensi 'didorong' agar masuk MSCI">
              <input type="checkbox" checked={onlyNearly} onChange={e => setOnlyNearly(e.target.checked)} className="hidden" />
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                onlyNearly ? 'bg-amber-500 border-amber-500' : 'bg-background border-white/20 group-hover:border-white/40'
              }`}>
                {onlyNearly && <Target className="w-3.5 h-3.5 text-black" />}
              </div>
              <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Hampir Eligible</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input type="checkbox" checked={excludeHsc} onChange={e => setExcludeHsc(e.target.checked)} className="hidden" />
              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                excludeHsc ? 'bg-yellow-500 border-yellow-500' : 'bg-background border-white/20 group-hover:border-white/40'
              }`}>
                {excludeHsc && <XCircle className="w-3.5 h-3.5 text-black" />}
              </div>
              <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">Sembunyikan HSC</span>
            </label>
          </div>

          {/* MSCI Disclaimer */}
          <div className="mx-4 mt-3 mb-0 px-4 py-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-300/70 leading-relaxed">
              <strong className="text-amber-300">Catatan:</strong> Lolos screener ≠ pasti masuk MSCI. MSCI juga mempertimbangkan:
              <span className="text-gray-500"> (1) Buffer asimetris: member lama dipertahankan selama metrik ≥ 2/3 ambang (sudah dimodelkan di kolom Status), tapi penambahan baru sering perlu buffer ukuran ekstra (±1,5×) — saham yang tipis lolos belum tentu langsung masuk;
              (2) Minimum listing 12 bulan untuk saham IPO baru;
              (3) Country-level weight cap & regional diversification;
              (4) Indonesia Market Accessibility Review (sedang berjalan 2025-2026 — penyebab 6 saham dikeluarkan Mei 2026);
              (5) Discretionary review oleh Index Management Committee.</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-gold-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Mengkalkulasi kriteria MSCI...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse mobile-pin" style={{ minWidth: hasConst ? 1500 : 1300 }}>
                <thead className="bg-background border-b border-white/5 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 w-10">#</th>
                    {[{col:'stock_code',label:'Saham',align:'left'},{col:'full_mc_usd',label:'Full Market Cap',align:'right'},{col:'float_mc_usd',label:'Float Market Cap',align:'right'},{col:'free_float',label:'Free Float / FIF',align:'right'},{col:'atvr_3m',label:'3M ATVR',align:'right'},{col:'atvr_12m',label:'12M ATVR',align:'right'},{col:'fot_3m',label:'3M FOT',align:'right'}].map(({col, label, align}) => (
                      <th key={col} onClick={() => handleSort(col)}
                        className={`px-4 py-3 text-[10px] uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-white text-${align} ${
                          sortCol === col ? (col === 'fot_3m' ? 'text-gold-400' : 'text-white') : 'text-gray-500'
                        }`}>
                        <span className="inline-flex items-center gap-1 justify-end">
                          {label}
                          {sortCol === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ' ↕'}
                        </span>
                      </th>
                    ))}
                    {hasConst && <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gold-400/70 text-center">Status MSCI</th>}
                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-gray-500 text-center">Kriteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {displayed.map((row, i) => {
                    const sc = STATUS_UI[row.msci_status];
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
                          <p className={`font-mono font-bold text-sm ${row.pass_full_mc ? 'text-white' : 'text-red-400'}`}>{fmtUsd(row.full_mc_usd)}</p>
                          <p className="text-[9px] text-gray-600 font-mono">{fmtIdr(row.full_mc_idr)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm flex items-center justify-end gap-1 ${row.pass_float_mc ? 'text-white' : 'text-red-400'}`}>
                            {row.requires_multiplier && (
                              <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 rounded border border-blue-500/30" title="FIF < min → Float MC dikali 1.8x">1.8x</span>
                            )}
                            {fmtUsd(row.float_mc_usd)}
                          </p>
                          <p className="text-[9px] text-gray-600 font-mono">{fmtIdr(row.float_mc_idr)}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {row.is_hsc && (
                              <span title={`Top holders KSEI = ${row.top_holders_pct.toFixed(1)}%`}>
                                <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                              </span>
                            )}
                            <div>
                              <p className="font-mono font-bold text-white text-sm">{row.free_float.toFixed(1)}%</p>
                              {row.is_hsc && <p className="text-[8px] text-yellow-500 font-bold">HSC</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm ${row.pass_atvr_3m ? 'text-white' : 'text-red-400'}`}>{row.atvr_3m.toFixed(1)}%</p>
                          {!row.pass_atvr_3m && <p className="text-[8px] text-red-500">↓ min {atvr3mMin}%</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm ${row.pass_atvr_12m ? 'text-white' : 'text-red-400'}`}>{row.atvr_12m.toFixed(1)}%</p>
                          {!row.pass_atvr_12m && <p className="text-[8px] text-red-500">↓ min {atvr12mMin}%</p>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className={`font-mono font-bold text-sm ${row.pass_fot_3m ? 'text-white' : 'text-red-400'}`}>{row.fot_3m.toFixed(1)}%</p>
                          {!row.pass_fot_3m && <p className="text-[8px] text-red-500">↓ min {fot3mMin}%</p>}
                        </td>
                        {hasConst && (
                          <td className="px-4 py-3 text-center">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[10px] font-black ${sc.badgeCls}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${sc.dotCls}`} />
                              {sc.label}
                            </div>
                            {row.msci_status === 'NEARLY' && (
                              <p className="text-[8px] text-amber-400/80 mt-1 font-bold">
                                {row.liquidity_ok ? `≈ +${row.push_upside_pct.toFixed(0)}% → masuk` : 'likuiditas blm cukup'}
                              </p>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {row.is_eligible ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-400/30 bg-gold-400/10 text-gold-400 text-[10px] font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                            </div>
                          ) : row.is_nearly ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black"
                              title={row.liquidity_ok ? `Likuiditas sudah cukup — perlu ~+${row.push_upside_pct.toFixed(0)}% harga untuk lolos market cap` : 'Mendekati ambang, likuiditas belum cukup'}>
                              <Target className="w-3.5 h-3.5" /> NEARLY{row.liquidity_ok ? ` · +${row.push_upside_pct.toFixed(0)}%` : ''}
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
                      <td colSpan={hasConst ? 11 : 10} className="text-center py-14 text-gray-600">
                        Tidak ada data saham yang sesuai filter.
                      </td>
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
