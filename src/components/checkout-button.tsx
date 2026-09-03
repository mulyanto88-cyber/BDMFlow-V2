'use client'

// ============================================================
// CheckoutButton — starts the Pro subscription flow with
// package selection (1 Month vs 3 Months) + WhatsApp Fallback.
// ============================================================
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Crown, MessageCircle, Sparkles, Check, Info } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { authFetch } from '@/lib/api'
import { track } from '@/lib/analytics'
import { PlanKey, PRO_PLANS } from '@/lib/billing'

const WA_ADMIN_NUMBER = '6285782672208'

export default function CheckoutButton({
  selectedPlan = 'monthly',
  onSelectPlan,
}: {
  selectedPlan?: PlanKey
  onSelectPlan?: (plan: PlanKey) => void
}) {
  const { user, loading } = useAuth()
  const [internalPlan, setInternalPlan] = useState<PlanKey>(selectedPlan)
  const currentPlanKey = onSelectPlan ? selectedPlan : internalPlan
  const setPlan = onSelectPlan || setInternalPlan

  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showWaFallback, setShowWaFallback] = useState(false)

  const plan = PRO_PLANS[currentPlanKey] || PRO_PLANS.monthly

  if (loading) {
    return (
      <div className="w-full py-3 rounded-xl text-sm text-center bg-surface-2 text-muted-foreground font-bold animate-pulse border border-line-2">
        Memuat…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <Link
          href="/auth"
          onClick={() => track('checkout_started', { step: 'login_required' })}
          className="w-full py-3 rounded-xl text-sm transition-all text-center block bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black shadow-lg shadow-amber-500/20"
        >
          Mulai 7 Hari Gratis
        </Link>
        <p className="text-[10px] text-muted-foreground text-center">
          Daftar akun gratis untuk mengaktifkan trial &amp; langganan.
        </p>
      </div>
    )
  }

  function getWaUrl() {
    const text = `Halo Admin BDMFlow, saya ingin berlangganan Paket Pro ${plan.label} (Rp ${plan.priceIdr.toLocaleString('id-ID')}).\n\nEmail Akun saya: ${user?.email || '-'}\n\nMohon info rekening transfer / QRIS untuk aktivasi instan. Terima kasih!`
    return `https://wa.me/${WA_ADMIN_NUMBER}?text=${encodeURIComponent(text)}`
  }

  async function startCheckout() {
    setPending(true)
    setMessage(null)
    track('checkout_started', { step: 'checkout', plan: currentPlanKey })
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: currentPlanKey }),
      })
      const json = await res.json().catch(() => ({}))
      if (json.paymentUrl) {
        track('checkout_redirect', { gateway: 'configured', plan: currentPlanKey })
        window.location.href = json.paymentUrl
        return
      }
      if (json.notConfigured) {
        setShowWaFallback(true)
        setMessage('Pembayaran otomatis via gateway sedang proses aktivasi. Silakan aktivasi langsung via WhatsApp di bawah:')
        track('checkout_unavailable')
      } else {
        setShowWaFallback(true)
        setMessage(json.error || 'Gagal membuka gateway pembayaran. Silakan aktivasi langsung via WhatsApp:')
        track('checkout_error')
      }
    } catch {
      setShowWaFallback(true)
      setMessage('Gangguan jaringan. Anda tetap bisa aktivasi langsung via WhatsApp:')
      track('checkout_error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="w-full space-y-3">
      {/* Plan Selector Buttons (1 Bulan vs 3 Bulan 10% OFF) */}
      <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-surface-2/80 border border-line-2">
        <button
          type="button"
          onClick={() => setPlan('monthly')}
          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
            currentPlanKey === 'monthly'
              ? 'bg-card text-foreground border border-amber-500/40 shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>1 Bulan</span>
          <span className="text-[10px] font-mono font-normal opacity-90 text-amber-500 dark:text-amber-400 font-bold">Rp 30K</span>
        </button>

        <button
          type="button"
          onClick={() => setPlan('quarterly')}
          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center relative ${
            currentPlanKey === 'quarterly'
              ? 'bg-card text-foreground border border-amber-500/40 shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="absolute -top-2 right-1 text-[8px] font-black uppercase px-1.5 py-0.2 bg-emerald-500 text-black rounded-full shadow-xs">
            Hemat Ekstra
          </span>
          <span>3 Bulan</span>
          <span className="text-[10px] font-mono font-normal text-emerald-600 dark:text-emerald-400 font-bold">Rp 79K</span>
        </button>
      </div>

      {/* Explicit Feature Note */}
      <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-1 text-[10.5px] text-muted-foreground border border-line-2">
        <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <span>Tidak ada perbedaan fitur untuk semua pilihan, hanya masa aktifnya saja.</span>
      </div>

      {/* Primary Checkout Button */}
      <button
        onClick={startCheckout}
        disabled={pending}
        className="w-full py-3 rounded-xl text-sm transition-all bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black shadow-lg shadow-amber-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {pending && <Loader2 size={14} className="animate-spin" />}
        {pending ? (
          'Membuka pembayaran…'
        ) : (
          <>
            <Crown size={14} />
            <span>Bayar {plan.label} (Rp {plan.priceIdr.toLocaleString('id-ID')})</span>
          </>
        )}
      </button>

      {/* WhatsApp Direct Option */}
      <div className="pt-1">
        <a
          href={getWaUrl()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('checkout_wa_click', { plan: currentPlanKey })}
          className="w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-2 shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Aktivasi Cepat via WhatsApp</span>
        </a>
      </div>

      {message && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-200/90 text-center leading-relaxed">
          {message}
        </div>
      )}
    </div>
  )
}
