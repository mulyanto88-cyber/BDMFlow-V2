'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Building2, Globe, Users, RefreshCw, Search, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'

async function apiFetch(params: Record<string,string|number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k,v])=>[k,String(v)])).toString()
  const r = await fetch(`/api/broker-flow?${qs}`)
  const j = await r.json()
  if (j.error) throw new Error(j.error)
  return j.data ?? []
}

const DAYS_OPTIONS = [1,5,7,14,30]

function catBadge(cat: string) {
  if (cat === 'FOREIGN')      return 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  if (cat === 'LOCAL_INST')   return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}

function netColor(v: number) {
  if (v > 5)  return 'text-emerald-400'
  if (v > 0)  return 'text-emerald-300/70'
  if (v < -5) return 'text-red-400'
  if (v < 0)  return 'text-red-300/70'
  return 'text-slate-400'
}

const TABS = ['Per Saham','Per Broker','Per Kategori']

export default function BrokerFlowPage() {
  const [tab, setTab]           = useState(0)
  const [rows, setRows]         = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string|null>(null)
  const [days, setDays]         = useState(7)
  const [catFilter, setCatFilter] = useState('')
  const [search, setSearch]     = useState('')
  const [sortKey, setSortKey]   = useState('fg_net')
  const [sortDir, setSortDir]   = useState<'asc'|'desc'>('desc')
  const [expandedBroker, setExpandedBroker] = useState<string|null>(null)
  const [brokerFaves, setBrokerFaves]       = useState<any[]>([])
  const [catSeries, setCatSeries]           = useState<any[]>([])

  const actionMap = ['by_stock','by_broker','by_category']

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (tab === 2) {
        const d = await apiFetch({ action:'by_category', days })
        setCatSeries(d)
        setRows([])
      } else {
        const d = await apiFetch({ action: actionMap[tab], days, category: catFilter })
        setRows(d)
      }
    } catch(e:any) { setError(e.message) }
    finally { setLoading(false) }
  }, [tab, days, catFilter])

  useEffect(() => { load() }, [load])

  const sorted = useMemo(() => {
    const d = [...rows]
    d.sort((a,b) => {
      const av = Number(a[sortKey] ?? 0), bv = Number(b[sortKey] ?? 0)
      return sortDir === 'desc' ? bv - av : av - bv
    })
    if (!search) return d
    const q = search.toUpperCase()
    return d.filter(r => String(r.stock_code || r.broker_code || r.broker_name || '').toUpperCase().includes(q))
  }, [rows, sortKey, sortDir, search])

  async function loadBrokerFaves(code: string) {
    if (expandedBroker === code) { setExpandedBroker(null); return }
    const d = await apiFetch({ action:'broker_favorites', broker_code: code, days })
    setBrokerFaves(d)
    setExpandedBroker(code)
  }

  function SortBtn({ k, label }: { k:string; label:string }) {
    return (
      <button className="flex items-center gap-0.5 hover:text-foreground transition-colors" onClick={() => {
        if (sortKey===k) setSortDir(d => d==='desc'?'asc':'desc')
        else { setSortKey(k); setSortDir('desc') }
      }}>
        {label}
        {sortKey===k ? (sortDir==='desc' ? <ChevronDown size={11}/> : <ChevronUp size={11}/>) : <ChevronDown size={11} className="opacity-30"/>}
      </button>
    )
  }

  // Category aggregate chart (simple bar)
  const catTotals = useMemo(() => {
    const map: Record<string,number> = {}
    catSeries.forEach(r => { map[r.category] = (map[r.category] || 0) + Number(r.net_miliar) })
    return Object.entries(map).map(([cat,net]) => ({ cat, net })).sort((a,b) => b.net - a.net)
  }, [catSeries])

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
              <Building2 size={18} className="text-primary" />
            </div>
            <div>
              <h1 className="text-[20px] font-black tracking-tight leading-none">Broker Flow Screener</h1>
              <p className="text-[11px] text-muted-foreground/50 mt-[3px] uppercase tracking-[0.15em]">
                Foreign · Institusi Lokal · Ritel — broker_classification
              </p>
            </div>
          </div>
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div className="panel flex items-center gap-1 p-1.5 w-fit">
          {TABS.map((t,i) => (
            <button key={t} onClick={() => setTab(i)}
              className={[
                'flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold rounded-xl transition-all duration-300 relative overflow-hidden',
                tab === i
                  ? 'text-primary shadow-[0_2px_10px_-2px_rgba(231,183,51,0.2)]'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04]',
              ].join(' ')}>
              {tab === i && <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none rounded-xl border border-primary/20" />}
              <span className="relative z-10 flex items-center gap-1.5">
                {i===0 && <Globe size={13}/>}
                {i===1 && <Building2 size={13}/>}
                {i===2 && <Users size={13}/>}
                {t}
              </span>
            </button>
          ))}
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <div className="panel flex flex-wrap gap-3 p-3">
        {tab < 2 && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input type="text" placeholder="Cari kode..." value={search} onChange={e=>setSearch(e.target.value)}
              className="pl-8 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none w-40"/>
          </div>
        )}
        {tab === 0 && (
          <select value={catFilter} onChange={e=>setCatFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none">
            <option value="">Semua Kategori</option>
            <option value="FOREIGN">Foreign</option>
            <option value="LOCAL_INST">Local Inst</option>
            <option value="LOCAL_RETAIL">Local Retail</option>
          </select>
        )}
        <div className="flex gap-1">
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={[
                'text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all duration-150',
                days === d
                  ? 'bg-primary/[0.12] text-primary border border-primary/20'
                  : 'text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] border border-transparent',
              ].join(' ')}>
              {d}D
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50">
          <RefreshCw size={13} className={loading ? 'animate-spin':''}/>
        </button>
        <div className="flex items-center text-xs text-muted-foreground ml-auto">
          {sorted.length} hasil
        </div>
      </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-red-400 text-[12px]">
            {error}
          </div>
        )}

        {/* Tab 0: Per Saham */}
        {tab === 0 && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-border/50 text-muted-foreground">
                  <th className="text-left px-3 py-3 font-medium">Saham</th>
                  <th className="text-right px-3 py-3"><SortBtn k="fg_net" label="🌏 Asing"/></th>
                  <th className="text-right px-3 py-3"><SortBtn k="inst_net" label="🏛️ Inst"/></th>
                  <th className="text-right px-3 py-3 hidden md:table-cell"><SortBtn k="retail_net" label="👥 Retail"/></th>
                  <th className="text-right px-3 py-3 hidden lg:table-cell"><SortBtn k="prime_net" label="⭐ Prime"/></th>
                  <th className="text-right px-3 py-3 hidden md:table-cell">Harga</th>
                  <th className="text-center px-3 py-3 hidden lg:table-cell">Signal</th>
                  <th className="px-3 py-3"/>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:8}).map((_,i)=>(
                  <tr key={i} className="border-b border-border/50 animate-pulse">
                    {Array.from({length:8}).map((_,j)=><td key={j} className="px-3 py-3"><div className="h-3 bg-muted rounded"/></td>)}
                  </tr>
                )) : sorted.map(r => (
                  <tr key={r.stock_code} className="tr-hover border-b border-white/[0.03]">
                    <td className="px-3 py-2.5">
                      <Link href={`/stock/${r.stock_code}`} prefetch={false} className="font-mono font-semibold hover:text-primary transition-colors">{r.stock_code}</Link>
                      <div className="text-muted-foreground">{r.sector}</div>
                    </td>
                    <td className={`px-3 py-2.5 text-right font-medium ${netColor(r.fg_net)}`}>
                      {Number(r.fg_net)>=0?'+':''}{Number(r.fg_net).toFixed(1)} M
                    </td>
                    <td className={`px-3 py-2.5 text-right font-medium ${netColor(r.inst_net)}`}>
                      {Number(r.inst_net)>=0?'+':''}{Number(r.inst_net).toFixed(1)} M
                    </td>
                    <td className={`px-3 py-2.5 text-right hidden md:table-cell ${netColor(r.retail_net)}`}>
                      {Number(r.retail_net)>=0?'+':''}{Number(r.retail_net).toFixed(1)} M
                    </td>
                    <td className={`px-3 py-2.5 text-right hidden lg:table-cell ${netColor(r.prime_net)}`}>
                      {Number(r.prime_net)>=0?'+':''}{Number(r.prime_net).toFixed(1)} M
                    </td>
                    <td className="px-3 py-2.5 text-right hidden md:table-cell">
                      <div>{Number(r.close).toLocaleString('id-ID')}</div>
                      <div className={Number(r.change_percent)>=0?'text-emerald-400':'text-red-400'}>
                        {Number(r.change_percent)>=0?'+':''}{Number(r.change_percent).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center hidden lg:table-cell text-xs text-muted-foreground">{r.signal}</td>
                    <td className="px-3 py-2.5"><Link href={`/stock/${r.stock_code}`} prefetch={false} className="text-muted-foreground hover:text-foreground"><ExternalLink size={12}/></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Tab 1: Per Broker */}
        {tab === 1 && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-border/50 text-muted-foreground">
                  <th className="text-left px-3 py-3 font-medium">Broker</th>
                  <th className="text-left px-3 py-3 font-medium">Kategori</th>
                  <th className="text-right px-3 py-3"><SortBtn k="net_miliar" label="Net (M)"/></th>
                  <th className="text-right px-3 py-3 hidden md:table-cell">Buy</th>
                  <th className="text-right px-3 py-3 hidden md:table-cell">Sell</th>
                  <th className="text-right px-3 py-3 hidden lg:table-cell">Saham</th>
                  <th className="px-3 py-3"/>
                </tr>
              </thead>
              <tbody>
                {loading ? Array.from({length:8}).map((_,i)=>(
                  <tr key={i} className="border-b border-border/50 animate-pulse">
                    {Array.from({length:7}).map((_,j)=><td key={j} className="px-3 py-3"><div className="h-3 bg-muted rounded"/></td>)}
                  </tr>
                )) : sorted.map(r => (
                  <>
                    <tr key={r.broker_code} className="tr-hover border-b border-white/[0.03] cursor-pointer"
                      onClick={() => loadBrokerFaves(r.broker_code)}>
                      <td className="px-3 py-2.5">
                        <div className="font-mono font-semibold">{r.broker_code}</div>
                        <div className="text-muted-foreground truncate max-w-[160px]">{r.broker_name}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded border ${catBadge(r.category)}`}>{r.category}</span>
                        {r.is_prime && <span className="ml-1 text-amber-400">⭐</span>}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-semibold ${netColor(r.net_miliar)}`}>
                        {Number(r.net_miliar)>=0?'+':''}{Number(r.net_miliar).toFixed(1)} M
                      </td>
                      <td className="px-3 py-2.5 text-right text-emerald-400 hidden md:table-cell">{Number(r.buy_miliar).toFixed(1)} M</td>
                      <td className="px-3 py-2.5 text-right text-red-400 hidden md:table-cell">{Number(r.sell_miliar).toFixed(1)} M</td>
                      <td className="px-3 py-2.5 text-right hidden lg:table-cell">{r.stocks_traded}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {expandedBroker===r.broker_code ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                      </td>
                    </tr>
                    {expandedBroker === r.broker_code && (
                      <tr className="border-b border-white/[0.03] bg-white/[0.015]">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">Top saham — {r.broker_code}:</div>
                          <div className="flex flex-wrap gap-2">
                            {brokerFaves.map((f:any) => (
                              <Link key={f.stock_code} href={`/stock/${f.stock_code}`} prefetch={false}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-primary/20 transition-all text-[11px]">
                                <span className="font-mono font-semibold">{f.stock_code}</span>
                                <span className={netColor(f.net_miliar)}>{Number(f.net_miliar)>=0?'+':''}{Number(f.net_miliar).toFixed(1)} M</span>
                              </Link>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {/* Tab 2: Per Kategori */}
        {tab === 2 && (
          <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {catTotals.map(c => (
            <div key={c.cat} className="metric-card card-hover">
              <div className={`text-[9px] font-black uppercase tracking-[0.15em] mb-1 px-2 py-0.5 rounded border inline-block ${catBadge(c.cat)}`}>{c.cat}</div>
              <div className={`text-[28px] font-black font-mono leading-none mt-2 ${netColor(c.net)}`}>
                {c.net>=0?'+':''}{c.net.toFixed(1)}<span className="text-[14px] ml-1 opacity-70">M</span>
              </div>
              <div className="text-[10px] text-muted-foreground/50 mt-1">Net flow {days} hari terakhir</div>
            </div>
          ))}
          </div>{/* end grid */}
          {/* Daily series table */}
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs">
                <thead className="sticky top-0">
                  <tr className="bg-[#0a1020] border-b border-border/50 text-muted-foreground">
                    <th className="text-left px-3 py-2">Tanggal</th>
                    <th className="text-right px-3 py-2">Foreign</th>
                    <th className="text-right px-3 py-2">Local Inst</th>
                    <th className="text-right px-3 py-2">Retail</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grouped: Record<string,Record<string,number>> = {}
                    catSeries.forEach((r:any) => {
                      if (!grouped[r.date]) grouped[r.date] = {}
                      grouped[r.date][r.category] = Number(r.net_miliar)
                    })
                    return Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).map(([dt,cats]) => (
                      <tr key={dt} className="tr-hover border-b border-white/[0.03]">
                        <td className="px-3 py-2">{dt.slice(0,10)}</td>
                        <td className={`px-3 py-2 text-right ${netColor(cats['FOREIGN']||0)}`}>{(cats['FOREIGN']||0)>=0?'+':''}{(cats['FOREIGN']||0).toFixed(1)} M</td>
                        <td className={`px-3 py-2 text-right ${netColor(cats['LOCAL_INST']||0)}`}>{(cats['LOCAL_INST']||0)>=0?'+':''}{(cats['LOCAL_INST']||0).toFixed(1)} M</td>
                        <td className={`px-3 py-2 text-right ${netColor(cats['LOCAL_RETAIL']||0)}`}>{(cats['LOCAL_RETAIL']||0)>=0?'+':''}{(cats['LOCAL_RETAIL']||0).toFixed(1)} M</td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  )
}
