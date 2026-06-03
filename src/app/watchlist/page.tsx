'use client'

import { useState, useEffect, useCallback } from 'react'
import { Star, Trash2, Plus, Bell, Lock, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface WatchlistItem {
  id: string; stock_code: string; alert_score: number | null
  notes: string | null; created_at: string; radar_score?: number
  close?: number; change_percent?: number; composite_signal?: string
}

interface UserProfile { id: string; email: string; full_name: string; plan: string }

export default function WatchlistPage() {
  const [user, setUser]       = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [items, setItems]     = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding]   = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newScore, setNewScore] = useState<string>('')
  const [error, setError]     = useState<string | null>(null)

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_ev, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    loadWatchlist(data?.plan === 'pro')
  }

  const loadWatchlist = useCallback(async (isPro = false) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res  = await fetch('/api/watchlist', { headers: { Authorization: `Bearer ${session.access_token}` } })
      const json = await res.json()
      const list: WatchlistItem[] = json.data ?? []

      // Enrich with current market data
      if (list.length > 0) {
        const codes = list.map(i => i.stock_code).join(',')
        const mkt = await fetch(`/api/motherduck`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: `
            SELECT stock_code, close::DOUBLE AS close,
              ROUND(change_percent::DOUBLE,2) AS change_percent,
              composite_signal, radar_score::INTEGER AS radar_score
            FROM market.vw_watchlist_radar
            WHERE stock_code IN (${list.map(i => `'${i.stock_code}'`).join(',')})
          ` })
        }).then(r => r.json()).catch(() => ({ data: [] }))

        const mktMap: Record<string,any> = {}
        for (const row of (mkt.data ?? [])) mktMap[row.stock_code] = row
        setItems(list.map(i => ({ ...i, ...mktMap[i.stock_code] })))
      } else {
        setItems([])
      }
    } finally { setLoading(false) }
  }, [])

  async function addStock() {
    const code = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')
    if (!code || !user) return
    setAdding(true); setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ stock_code: code, alert_score: newScore ? +newScore : null })
      })
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setNewCode(''); setNewScore('')
      loadWatchlist()
    } catch (e: any) { setError(e.message) } finally { setAdding(false) }
  }

  async function removeStock(code: string) {
    const { data: { session } } = await supabase.auth.getSession()
    await fetch(`/api/watchlist?stock_code=${code}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${session?.access_token}` }
    })
    setItems(items.filter(i => i.stock_code !== code))
  }

  const isPro = profile?.plan === 'pro'
  const limit = isPro ? Infinity : 20

  if (!user) {
    return (
      <div className="sidebar-offset flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full px-6 py-16 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-[16px] flex items-center justify-center mx-auto mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
            <Lock size={28} className="text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 gradient-gold">Login untuk Watchlist</h1>
          <p className="text-sm text-muted-foreground mb-8">Simpan saham favorit dan set alert radar score.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth" prefetch={false}
              className="px-6 py-2.5 rounded-xl glass card-hover border border-gold-400/30 text-gold-400 text-sm font-semibold hover:bg-gold-400/10 transition-colors">
              Login / Daftar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar-offset max-w-[1200px] mx-auto px-6 py-6 space-y-5 animate-fade-in pb-12">
      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(231,183,51,0.15) 0%, rgba(231,183,51,0.05) 100%)', border: '1px solid rgba(231,183,51,0.2)' }}>
          <Star size={20} className="text-gold-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-gold">Watchlist & Alerts</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {profile?.email} · Plan: <span className={`font-semibold ${isPro ? 'text-gold-400' : 'text-muted-foreground'}`}>{isPro ? 'PRO' : 'Free'}</span>
            {!isPro && ` · ${items.length}/20 saham`}
          </p>
        </div>
        <button onClick={() => loadWatchlist()} disabled={loading}
          className="ml-auto glass card-hover flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {/* ── Add stock ──────────────────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-border/50 p-5 shadow-xl">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
          <Plus size={14} className="text-gold-400" />Tambah Saham
        </h2>
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Kode saham (contoh: BBRI)" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && addStock()}
            className="flex-1 min-w-[120px] px-3 py-2.5 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:border-gold-400/50 uppercase transition-colors" />
          <input type="number" placeholder="Alert score (opsional)" value={newScore} onChange={e => setNewScore(e.target.value)}
            min={0} max={100}
            className="w-44 px-3 py-2.5 rounded-xl bg-white/5 border border-border/50 text-sm focus:outline-none focus:border-gold-400/50 transition-colors" />
          <button onClick={addStock} disabled={adding || !newCode || items.length >= limit}
            className="px-5 py-2.5 rounded-xl bg-gold-400/15 border border-gold-400/30 text-gold-400 text-sm font-semibold hover:bg-gold-400/25 disabled:opacity-40 transition-colors">
            {adding ? 'Menambah...' : 'Tambah'}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-2.5 text-xs text-red-400">
            <AlertTriangle size={12} />{error}
          </div>
        )}
        {!isPro && items.length >= 20 && (
          <div className="mt-2.5 text-xs text-gold-400 flex items-center gap-1">
            <AlertTriangle size={12} />Limit 20 saham (Free). Upgrade ke PRO untuk unlimited.
          </div>
        )}
      </div>

      {/* ── Watchlist table ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-2 stagger">
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="shimmer h-16 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Star size={36} className="mx-auto mb-3 opacity-20 text-gold-400" />
          <p className="text-sm">Watchlist kosong. Tambah saham di atas untuk mulai tracking.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.06] text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-left px-4 py-3">Saham</th>
                <th className="text-right px-3 py-3">Harga</th>
                <th className="text-center px-3 py-3 hidden md:table-cell">Radar Score</th>
                <th className="text-left px-3 py-3 hidden lg:table-cell">Signal</th>
                <th className="text-center px-3 py-3 hidden md:table-cell"><Bell size={11} className="inline" /> Alert</th>
                <th className="px-3 py-3 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {items.map(item => (
                <tr key={item.id} className="tr-hover transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/stock/${item.stock_code}`} prefetch={false}
                      className="font-semibold hover:text-gold-400 transition-colors">{item.stock_code}</Link>
                    {item.notes && <div className="text-[10px] text-muted-foreground mt-0.5">{item.notes}</div>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {item.close ? (
                      <>
                        <div className="font-medium">{Number(item.close).toLocaleString('id-ID')}</div>
                        <div className={`text-[10px] ${Number(item.change_percent)>0?'text-emerald-400':Number(item.change_percent)<0?'text-red-400':'text-muted-foreground'}`}>
                          {Number(item.change_percent)>0?'+':''}{Number(item.change_percent).toFixed(2)}%
                        </div>
                      </>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    {item.radar_score !== undefined ? (
                      <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${Number(item.radar_score)>=70?'text-emerald-400 bg-emerald-500/15':Number(item.radar_score)>=50?'text-sky-400 bg-sky-500/15':'text-gold-400 bg-gold-400/15'}`}>
                        {item.radar_score}
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground">{item.composite_signal || '—'}</span>
                  </td>
                  <td className="px-3 py-3 text-center hidden md:table-cell">
                    {item.alert_score ? (
                      <span className="text-xs font-semibold text-gold-400 flex items-center justify-center gap-1">
                        <Bell size={11} />{item.alert_score}+
                      </span>
                    ) : <span className="text-muted-foreground text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/stock/${item.stock_code}`} prefetch={false}
                        className="text-muted-foreground hover:text-gold-400 transition-colors">
                        <ExternalLink size={13} />
                      </Link>
                      <button onClick={() => removeStock(item.stock_code)}
                        className="text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isPro && (
        <div className="glass rounded-2xl border border-gold-400/20 bg-gold-400/[0.04] p-5 shadow-xl">
          <h3 className="text-sm font-bold text-gold-400 mb-1.5">⭐ Upgrade ke PRO</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">Watchlist unlimited, alert notifikasi email, prime broker entry alert, akses semua fitur premium.</p>
          <Link href="/pricing" prefetch={false}
            className="mt-3 inline-block text-xs font-semibold text-gold-400 hover:text-gold-300 transition-colors">
            Lihat pricing →
          </Link>
        </div>
      )}
    </div>
  )
}
