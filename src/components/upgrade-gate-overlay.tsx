'use client'

// ============================================================
// UpgradeGateOverlay — one global paywall prompt for every
// direct-fetch page.
//
// authFetch broadcasts `bdmflow:upgrade-required` whenever a
// market-data route answers 402 (paid-tier data withheld). The
// shell listens once here, so none of the ~12 direct-fetch pages
// need their own paywall UI — they keep their normal error state
// underneath while this explains the situation and makes the ask.
//
// Inert today: no route returns 402 while ENFORCE_PRO_GATING is
// off, so the overlay simply never appears.
// ============================================================
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { UpgradePrompt } from './upgrade-prompt'
import { track } from '@/lib/analytics'

const COOLDOWN_MS = 30_000 // ignore repeat 402s within this window

export default function UpgradeGateOverlay() {
  const [show, setShow] = useState(false)
  const lastShownAt = useRef(0)

  useEffect(() => {
    function onUpgradeRequired() {
      const now = Date.now()
      if (now - lastShownAt.current < COOLDOWN_MS) return
      lastShownAt.current = now
      setShow(true)
      track('paywall_shown')
    }
    window.addEventListener('bdmflow:upgrade-required', onUpgradeRequired)
    return () => window.removeEventListener('bdmflow:upgrade-required', onUpgradeRequired)
  }, [])

  if (!show) return null

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Fitur Pro"
      onClick={() => setShow(false)}
    >
      <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setShow(false)}
          aria-label="Tutup"
          className="absolute -top-2 -right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-surface-3 border border-line-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={14} />
        </button>
        <UpgradePrompt
          feature="Fitur ini khusus anggota Pro"
          detail="Screener, data KSEI, dan analitik broker tingkat institusional tersedia untuk pelanggan Pro."
        />
      </div>
    </div>
  )
}
