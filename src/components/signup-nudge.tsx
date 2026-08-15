'use client'

// ============================================================
// SignupNudge — soft conversion prompt for anonymous visitors.
//
// Non-blocking by design: guests keep browsing; after a few page
// views a dismissible modal asks them to register, so we can
// measure how many visitors are willing to sign up + verify email
// without a login wall killing casual traffic first.
//
// localStorage keys:
//   bdmflow_views           — page-view counter (anonymous only)
//   bdmflow_nudge_dismissed — set on close / "Nanti saja"; never re-shown
// ============================================================
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { X, Shield, UserPlus } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { track } from '@/lib/analytics'
import TrackLink from './track-link'

const VIEWS_KEY = 'bdmflow_views'
const DISMISS_KEY = 'bdmflow_nudge_dismissed'
const THRESHOLD = 3

export default function SignupNudge() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (loading || user) return
    try {
      if (localStorage.getItem(DISMISS_KEY)) return
      const views = (Number(localStorage.getItem(VIEWS_KEY)) || 0) + 1
      localStorage.setItem(VIEWS_KEY, String(views))
      if (views >= THRESHOLD) {
        setShow(true)
        track('nudge_shown', { views })
      }
    } catch {
      // localStorage unavailable — skip silently.
    }
  }, [pathname, loading, user])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
    setShow(false)
    track('nudge_dismissed')
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Daftar gratis"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-sm glass rounded-2xl border border-line-3 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Tutup"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Shield size={16} className="text-primary" />
          </span>
          <h3 className="text-sm font-black">Sudah lihat-lihat?</h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Daftar gratis untuk menyimpan watchlist, pantau alert, dan jangan sampai
          ketinggalan akses fitur baru — cukup dengan email.
        </p>

        <TrackLink
          href="/auth"
          event="nudge_click"
          className="mt-4 w-full h-10 rounded-xl text-sm font-black text-slate-950 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all"
        >
          <UserPlus size={14} />
          Daftar Gratis
        </TrackLink>

        <button
          onClick={dismiss}
          className="mt-2 w-full h-9 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface-3 transition-colors"
        >
          Nanti saja, masih mau lihat-lihat
        </button>
      </div>
    </div>
  )
}
