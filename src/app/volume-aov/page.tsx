'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Zap, Search, RefreshCw, Filter, ExternalLink } from 'lucide-react'
import Link from 'next/link'

async function apiFetch(params: Record<string,string|number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)])).toString()
  const r = await fetch(`/api/volume-aov?${qs}`)
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.data ?? []
}

const PERIODS = ['1d','7d','14d','30d','90d']
const CONF_LABELS = ['Triple Confirm','Vol + AOV','Vol + Foreign','AOV + Foreign','Vol Spike','AOV Spike']

function confBadge(type: string) {
  if (type.includes('Triple'))  return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  if (type.includes('Vol + AOV')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  if (type.includes('Foreign'))   return 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  if (type.includes('Vol'))       return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  if (type.includes('AOV'))       return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

export default function VolumeAovPage() {
  const [rows, setRows]         = useState<any[]>([])
  const [sectors, setSectors]   = useState<string[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string|null>(null)
  const [period, setPeriod]     = useState('7d')
  const [sector, setSector]     = useState('')
  const [minConf, setMinConf]   = useState(2)
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [data, secs] = await Promise.all([
        apiFetch({ action:'screener', period, sector, min_conf: minConf }),
        apiFetch({ action:'sectors' }),
      ])
      setRows(data)
      setSectors(secs.map((s:any) => s.sector))
    } catch(e:any) { setError(e.message) }
    finally { setLoading(false) }
  }, [period, sector, minConf])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    if (!search) return rows
    const q = search.toUpperCase()
    return rows.filter(r => r.stock_code?.includes(q) || r.sector?.includes(q))
  }, [rows, search])

  const tripleCount = rows.filter(r => r.spike_type?.includes('Triple')).length
  const highConfCount = rows.filter(r => r.conf_score >= 3).length

  return (
    <div className="sidebar-offset min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15), rgba(231,183,51,0.06))', border: '1px solid rgba(231,183,51,0.2)' }}
            >
              <Zap size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-[20px] font-black tracking-tight leading-none">Volume &amp; AOV Screener</h1>
              <p className="text-[11px] text-muted-foreground/50 mt-[3px] uppercase tracking-[0.15em]">
                Breakout Detection · Volume Spike · AOV Anomaly · Multi-layer Konfirmasi
              </p>
            </div>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-all">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 stagger">
          <div className="metric-card card-hover text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/50 mb-1">Triple Confirm</div>
            <div className="text-[30px] font-black font-mono leading-none text-purple-400">{tripleCount}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-1">Vol + AOV + Foreign</div>
          </div>
          <div className="metric-card card-hover text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/50 mb-1">High Conf (≥3)</div>
            <div className="text-[30px] font-black font-mono leading-none text-primary">{highConfCount}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-1">3+ kondisi terpenuhi</div>
          </div>
          <div className="metric-card card-hover text-center">
            <div className="text-[10px] uppercase tracking-[0.15em] font-bold text-muted-foreground/50 mb-1">Total Saham</div>
            <div className="text-[30px] font-black font-mono leading-none text-foreground">{filtered.length}</div>
            <div className="text-[10px] text-muted-foreground/40 mt-1">hasil filter saat ini</div>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="panel flex flex-wrap gap-3 p-3">
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Cari kode..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none text-sm" />
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={[
                'text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-150',
                period === p
                  ? 'bg-primary/[0.12] text-primary border border-primary/20'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] border border-transparent',
              ].join(' ')}>
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        <select value={sector} onChange={e => setSector(e.target.value)}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none">
          <option value="">Semua Sektor</option>
          {sectors.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground text-xs">Min konfirmasi:</span>
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setMinConf(n)}
              className={[
                'w-7 h-7 rounded-lg text-[11px] font-bold transition-all duration-150',
                minConf === n
                  ? 'bg-primary/[0.12] text-primary border border-primary/20'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] border border-transparent',
              ].join(' ')}>
              {n}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center text-[11px] text-muted-foreground/50 font-mono">
          {filtered.length} hasil
        </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-[12px]">
            {error}
          </div>
        )}

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-border/50 text-muted-foreground">
                <th className="text-left px-3 py-3 font-medium">Saham</th>
                <th className="text-right px-3 py-3 font-medium">Harga</th>
                <th className="text-center px-3 py-3 font-medium">Konfirmasi</th>
                <th className="text-left px-3 py-3 font-medium">Jenis Spike</th>
                <th className="text-right px-3 py-3 font-medium">Vol Ratio</th>
                <th className="text-right px-3 py-3 font-medium">AOV Ratio</th>
                <th className="text-right px-3 py-3 font-medium hidden md:table-cell">Foreign Net</th>
                <th className="text-center px-3 py-3 font-medium hidden lg:table-cell">Whale</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:8}).map((_,i) => (
                <tr key={i} className="border-b border-border/50 animate-pulse">
                  {Array.from({length:9}).map((_,j) => <td key={j} className="px-3 py-3"><div className="h-3 bg-muted rounded w-full" /></td>)}
                </tr>
              )) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-10 text-center text-muted-foreground">Tidak ada saham dengan konfirmasi yang diminta</td></tr>
              ) : filtered.map(r => (
                <tr key={r.stock_code} className="tr-hover border-b border-white/[0.03]">
                  <td className="px-3 py-2.5">
                    <Link href={`/stock/${r.stock_code}`} prefetch={false} className="font-semibold font-mono hover:text-primary transition-colors">{r.stock_code}</Link>
                    <div className="text-muted-foreground text-xs">{r.sector}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="font-medium">{Number(r.close).toLocaleString('id-ID')}</div>
                    <div className={Number(r.change_percent)>=0 ? 'text-emerald-400' : 'text-red-400'}>
                      {Number(r.change_percent)>=0?'+':''}{Number(r.change_percent).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex justify-center gap-0.5">
                      {Array.from({length:5}).map((_,i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-sm ${i < r.conf_score ? 'bg-amber-400' : 'bg-muted'}`} />
                      ))}
                    </div>
                    <div className="text-muted-foreground mt-0.5">{r.conf_score}/5</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded border text-xs ${confBadge(r.spike_type || '')}`}>
                      {r.spike_type}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={Number(r.volume_ratio)>=2 ? 'text-amber-400 font-semibold' : Number(r.volume_ratio)>=1.5 ? 'text-amber-300' : 'text-foreground'}>
                      {Number(r.volume_ratio).toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className={Number(r.aov_ratio_ma20)>=1.5 ? 'text-orange-400 font-semibold' : 'text-foreground'}>
                      {Number(r.aov_ratio_ma20).toFixed(2)}x
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right hidden md:table-cell">
                    <span className={Number(r.net_foreign_value)>=0 ? 'text-emerald-400' : 'text-red-400'}>
                      {(Number(r.net_foreign_value)/1e9).toFixed(1)} M
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                    {r.whale_signal ? '🐋' : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/stock/${r.stock_code}`} prefetch={false} className="text-muted-foreground hover:text-foreground">
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

        {/* ── Legend ─────────────────────────────────────────────────────── */}
        <div className="glass rounded-xl p-3 text-[11px] text-muted-foreground/60">
          <span className="font-bold text-muted-foreground">Konfirmasi score (0–5): </span>
          Volume ≥ 2× (+1) · AOV ≥ 1.5× (+1) · Foreign net buy (+1) · Whale signal (+1) · Above VWMA (+1). Min 3 = setidaknya 3 kondisi terpenuhi.
        </div>

      </div>
    </div>
  )
}
