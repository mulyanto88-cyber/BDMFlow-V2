'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Shield, Users, Activity, Eye, RefreshCw,
  Search, Crown, Clock, ArrowRight, AlertTriangle,
  Flame, Filter, CheckCircle2, Lock
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { authFetch } from '@/lib/api'

interface ActivityItem {
  id: string
  userId: string
  email: string
  path: string
  pageTitle: string | null
  createdAt: string
  plan: 'PRO' | 'TRIAL' | 'FREE'
}

interface TopPageItem {
  path: string
  views: number
  uniqueUsers: number
}

interface UserSummary {
  id: string
  email: string
  createdAt: string
  lastSignIn: string | null
  status: 'PRO' | 'TRIAL' | 'FREE'
}

const ADMIN_EMAILS = ['mulyanto.my88@gmail.com']

export default function AdminActivityPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [topPages, setTopPages] = useState<TopPageItem[]>([])
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())

  const fetchData = useCallback(async (emailFilter?: string) => {
    setLoading(true)
    setError(null)
    try {
      const url = emailFilter && emailFilter !== 'ALL'
        ? `/api/admin/activity?email=${encodeURIComponent(emailFilter)}&limit=150`
        : '/api/admin/activity?limit=150'

      const res = await authFetch(url)
      if (!res.ok) {
        if (res.status === 403) throw new Error('Akses ditolak: Hanya admin yang dapat melihat halaman ini.')
        throw new Error('Gagal memuat log aktivitas.')
      }
      const data = await res.json()
      setActivities(data.activities || [])
      setTopPages(data.topPages || [])
      setUsers(data.users || [])
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchData(selectedEmail)
    }
  }, [authLoading, user, isAdmin, selectedEmail, fetchData])

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
          <span className="text-xs text-muted-foreground font-mono">Memverifikasi otorisasi admin...</span>
        </div>
      </div>
    )
  }

  // Access Denied Screen for regular users
  if (!user || !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass rounded-3xl border border-rose-500/25 p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
            <Lock size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Akses Khusus Administrator</h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Halaman pemantauan aktivitas user ini dilindungi secara privat dan hanya dapat dibuka oleh akun Administrator BDMFlow.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black bg-surface-2 hover:bg-surface-3 text-foreground border border-line-2 transition-all"
          >
            <span>Kembali ke Dashboard</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    )
  }

  // Filter activities by search query
  const filteredActivities = activities.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.email.toLowerCase().includes(q) || a.path.toLowerCase().includes(q) || (a.pageTitle && a.pageTitle.toLowerCase().includes(q))
  })

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider text-amber-500">
            <Shield size={11} />
            Privat &amp; Terproteksi RLS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>Pemantau Aktivitas User</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-muted-foreground font-mono font-normal">
              Admin Live
            </span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Lacak secara real-time kapan dan menu apa saja yang dibuka oleh seluruh pengguna BDMFlow.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(selectedEmail)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-surface-2 hover:bg-surface-3 text-foreground border border-line-2 transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-2xl p-5 border border-border/40 bg-surface-1/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total User Terdaftar</span>
            <Users size={16} className="text-amber-400" />
          </div>
          <div className="text-3xl font-black text-foreground">{users.length}</div>
          <div className="text-[10.5px] text-muted-foreground mt-1 flex items-center gap-2">
            <span className="text-emerald-500 font-bold">
              {users.filter(u => u.status === 'PRO').length} Pro
            </span>
            <span>·</span>
            <span className="text-amber-500 font-bold">
              {users.filter(u => u.status === 'TRIAL').length} Trial
            </span>
            <span>·</span>
            <span>
              {users.filter(u => u.status === 'FREE').length} Free
            </span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-border/40 bg-surface-1/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Log Tercatat</span>
            <Activity size={16} className="text-primary" />
          </div>
          <div className="text-3xl font-black text-foreground">{activities.length}</div>
          <div className="text-[10.5px] text-muted-foreground mt-1">
            {selectedEmail === 'ALL' ? 'Dari semua akun terdaftar' : `Khusus akun ${selectedEmail}`}
          </div>
        </div>

        <div className="glass rounded-2xl p-5 border border-border/40 bg-surface-1/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Menu Paling Populer</span>
            <Flame size={16} className="text-rose-500" />
          </div>
          <div className="text-xl font-black text-foreground truncate">
            {topPages[0]?.path || '/dashboard'}
          </div>
          <div className="text-[10.5px] text-muted-foreground mt-1">
            Dibuka {topPages[0]?.views || 0}x oleh {topPages[0]?.uniqueUsers || 0} user unik
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-surface-1 border border-line-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari user email atau nama menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-surface-2 border border-line-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/50"
            />
          </div>

            {/* User Dropdown Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Filter size={13} className="text-muted-foreground" />
              <select
                value={selectedEmail}
                onChange={(e) => setSelectedEmail(e.target.value)}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-surface-2 border border-line-3 text-foreground focus:outline-none cursor-pointer appearance-none pr-8 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239ca3af%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_10px_center] bg-no-repeat"
              >
                <option value="ALL" className="bg-[#18181b] text-slate-100 py-1">Semua Pengguna ({users.length})</option>
                {users.map((u) => (
                  <option key={u.id} value={u.email} className="bg-[#18181b] text-slate-100 py-1">
                    {u.email} ({u.status})
                  </option>
                ))}
              </select>
            </div>
        </div>

        {selectedEmail !== 'ALL' && (
          <button
            onClick={() => setSelectedEmail('ALL')}
            className="text-[11px] font-bold text-amber-500 hover:underline px-2"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Main Content Grid: Activity Stream & Top Menus */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Live Activity Feed (2 Cols on lg) */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 border border-border/40 space-y-4">
          <div className="flex items-center justify-between border-b border-line-2 pb-3">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2">
              <Clock size={15} className="text-primary" />
              <span>Linimasa Aktivitas Real-time</span>
            </h2>
            <span className="text-[11px] text-muted-foreground font-mono">
              {filteredActivities.length} data ditampilkan
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-7 h-7 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground">Memuat data aktivitas...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 text-center">
              {error}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Eye size={24} className="text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground">Belum ada log aktivitas</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                {selectedEmail === 'ALL'
                  ? 'Aktivitas pengguna akan otomatis muncul di sini begitu ada user login dan berpindah menu.'
                  : `User ${selectedEmail} belum membuka menu setelah tracker diaktifkan.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredActivities.map((act) => {
                const dateObj = new Date(act.createdAt)
                const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

                return (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-surface-2/60 hover:bg-surface-3/80 border border-line-2 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground truncate">{act.email}</span>
                        <span
                          className={`text-[8.5px] font-black uppercase px-1.5 py-0.2 rounded border ${
                            act.plan === 'PRO'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : act.plan === 'TRIAL'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-surface-3 text-muted-foreground border-line-2'
                          }`}
                        >
                          {act.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <span className="px-2 py-0.5 rounded-md bg-surface-1 font-semibold text-primary/90 border border-line-2">
                          {act.path}
                        </span>
                        {act.pageTitle && act.pageTitle !== act.path && (
                          <span className="text-muted-foreground/60 truncate max-w-[200px]">
                            {act.pageTitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-foreground/80">{timeStr}</div>
                      <div className="text-[10px] text-muted-foreground/50">{dateStr}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Top Visited Pages Ranking */}
        <div className="space-y-6">
          <div className="glass rounded-3xl p-6 border border-border/40 space-y-4">
            <h2 className="text-sm font-black text-foreground flex items-center gap-2 border-b border-line-2 pb-3">
              <Flame size={15} className="text-amber-500" />
              <span>Ranking Menu Terlaris</span>
            </h2>

            {topPages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Belum ada statistik halaman.</p>
            ) : (
              <div className="space-y-2.5">
                {topPages.slice(0, 10).map((tp, idx) => (
                  <div
                    key={tp.path}
                    className="p-2.5 rounded-xl bg-surface-2 border border-line-2 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-surface-3 flex items-center justify-center text-[10px] font-black text-muted-foreground shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground truncate">
                        {tp.path}
                      </span>
                    </div>
                    <div className="text-right shrink-0 text-xs">
                      <span className="font-bold text-amber-500">{tp.views}x</span>
                      <span className="text-[10px] text-muted-foreground/60 block font-mono">
                        {tp.uniqueUsers} user
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="p-5 rounded-3xl bg-amber-500/[0.06] border border-amber-500/20 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <CheckCircle2 size={15} />
              <span>Informasi Keamanan &amp; Privasi</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground/80">
              Data ini 100% rahasia dan hanya dapat diakses oleh akun admin <strong>mulyanto.my88@gmail.com</strong>. Pengguna reguler lainnya tidak memiliki izin untuk membaca tabel aktivitas.
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}
