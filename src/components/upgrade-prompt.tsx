'use client'

import Link from 'next/link'
import { Crown, Lock, Sparkles } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

/**
 * Shown in place of paid-tier content when the server withholds it.
 *
 * Without this, a blocked request surfaced either as a generic error string or —
 * on pages that only logged the failure — as an empty table with no explanation.
 * The paywall was fencing the data off without ever asking for the sale.
 *
 * The ask differs by who is looking: a signed-out visitor is offered the trial,
 * because signing up costs them nothing and grants seven days of Pro; someone
 * whose trial has already run out is past that offer and is shown the price.
 */
export function UpgradePrompt({
  feature,
  detail,
}: {
  /** What is locked, named the way the page names it. */
  feature: string
  /** One line on why it is worth paying for. */
  detail?: string
}) {
  const { user } = useAuth()
  const signedOut = !user

  return (
    <div className="glass-panel rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/8 to-amber-500/[0.02] p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
        <Lock size={20} className="text-amber-400" />
      </div>

      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-400">
        Fitur Pro
      </p>
      <h3 className="mb-2 text-lg font-black text-foreground">{feature}</h3>
      {detail && (
        <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          {detail}
        </p>
      )}

      {signedOut ? (
        <>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-2.5 text-sm font-bold text-amber-300 transition-colors hover:border-amber-500/50 hover:bg-amber-500/25"
          >
            <Sparkles size={15} />
            Daftar gratis — 7 hari Pro
          </Link>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Tanpa kartu kredit. Setelah trial, Rp 55K per bulan.
          </p>
        </>
      ) : (
        <>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-5 py-2.5 text-sm font-bold text-amber-300 transition-colors hover:border-amber-500/50 hover:bg-amber-500/25"
          >
            <Crown size={15} />
            Upgrade ke Pro — Rp 55K/bulan
          </Link>
          <p className="mt-3 text-xs text-muted-foreground/60">
            Masa trial Anda sudah berakhir. Berhenti kapan saja.
          </p>
        </>
      )}
    </div>
  )
}
