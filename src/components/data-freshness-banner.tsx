'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

// Warns when the data on screen is behind the market. Reading from materialised
// tables means a failed ETL is invisible — every page still renders, just with
// yesterday's numbers. For a trading tool that is worse than an outage, because
// the user has no reason to distrust it.
//
// Silent while data is fresh: a banner that is always there stops being read.

type Freshness = {
  status: 'fresh' | 'lagging' | 'stale' | 'unknown'
  dataTradingDate: string | null
  lagDays: number | null
  refreshedAt: string | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function DataFreshnessBanner() {
  const [data, setData] = useState<Freshness | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/health/freshness')
      .then((r) => r.json())
      .then((j) => { if (!cancelled) setData(j) })
      .catch(() => { /* a failed check must never break the page */ })
    return () => { cancelled = true }
  }, [])

  // 'unknown' stays quiet too — an unreachable check is not evidence of stale data.
  if (!data || data.status === 'fresh' || data.status === 'unknown') return null

  const stale = data.status === 'stale'

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-[10px] font-semibold border-b ${
        stale
          ? 'bg-red-500/10 border-red-500/25 text-red-300'
          : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
      }`}
    >
      <AlertTriangle size={11} className="shrink-0" />
      <span>
        {stale ? 'Data belum diperbarui' : 'Data tertinggal 1 sesi'} — terakhir{' '}
        <b className="font-black">{formatDate(data.dataTradingDate)}</b>
        {data.lagDays !== null && data.lagDays > 1 && ` (${data.lagDays} hari lalu)`}.
        {stale
          ? ' Sinyal di layar ini mungkin sudah tidak relevan.'
          : ' Bisa jadi libur bursa atau update harian sedang berjalan.'}
      </span>
    </div>
  )
}
