'use client'

// Confirmation banner on the pricing page after the gateway redirects
// back with ?paid=1. The plan itself is applied server-side by the
// webhook; this just tells the user what's happening.
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { track } from '@/lib/analytics'

export default function PaidBanner() {
  const searchParams = useSearchParams()
  const paid = searchParams.get('paid') === '1'
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (paid && !seen) {
      setSeen(true)
      track('checkout_returned')
    }
  }, [paid, seen])

  if (!paid) return null

  return (
    <div className="max-w-2xl mx-auto flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4">
      <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
      <div className="text-sm text-emerald-300/90 leading-relaxed">
        Pembayaran sedang diproses. Akses Pro aktif otomatis begitu pembayaran
        terkonfirmasi — biasanya dalam hitungan menit. Jika lebih dari 1 jam belum
        aktif, hubungi kami via halaman Kontak.
      </div>
    </div>
  )
}
