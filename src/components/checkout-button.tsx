'use client'

// ============================================================
// CheckoutButton — starts the Pro subscription flow.
//
//   * signed out → goes to /auth first
//   * signed in  → POST /api/billing/checkout (bearer token) and
//     redirect to the gateway payment page
//   * no gateway configured yet → honest inline note instead of a
//     dead button (server answers 503 notConfigured)
// ============================================================
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Crown } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { authFetch } from '@/lib/api'
import { track } from '@/lib/analytics'

export default function CheckoutButton() {
  const { user, loading } = useAuth()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="w-full py-3 rounded-xl text-sm text-center bg-gradient-to-r from-gold-400 to-yellow-500 text-navy-900 font-bold opacity-60">
        Memuat…
      </div>
    )
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        onClick={() => track('checkout_started', { step: 'login_required' })}
        className="w-full py-3 rounded-xl text-sm transition-all text-center block bg-gradient-to-r from-gold-400 to-yellow-500 text-navy-900 font-bold shadow-lg shadow-amber-500/20"
      >
        Mulai 7 Hari Gratis
      </Link>
    )
  }

  async function startCheckout() {
    setPending(true)
    setMessage(null)
    track('checkout_started', { step: 'checkout' })
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json().catch(() => ({}))
      if (json.paymentUrl) {
        track('checkout_redirect', { gateway: 'configured' })
        window.location.href = json.paymentUrl
        return
      }
      if (json.notConfigured) {
        setMessage('Pembayaran online segera hadir. Sementara itu, hubungi kami via halaman Kontak.')
        track('checkout_unavailable')
      } else {
        setMessage(json.error || 'Gagal memulai pembayaran. Coba lagi nanti.')
        track('checkout_error')
      }
    } catch {
      setMessage('Gangguan jaringan — periksa koneksi Anda.')
      track('checkout_error')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={startCheckout}
        disabled={pending}
        className="w-full py-3 rounded-xl text-sm transition-all bg-gradient-to-r from-gold-400 to-yellow-500 text-navy-900 font-bold shadow-lg shadow-amber-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {pending && <Loader2 size={13} className="animate-spin" />}
        {pending ? 'Membuka pembayaran…' : (
          <>
            <Crown size={13} />
            Langganan Rp 55K/bulan
          </>
        )}
      </button>
      {message && (
        <p className="mt-2 text-[11px] text-amber-300/90 text-center leading-relaxed">{message}</p>
      )}
    </div>
  )
}
