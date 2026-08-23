'use client'

import { useEffect, useState } from 'react'

// Warna monogram mengikuti sektor. Kelas *-400 sengaja dipilih karena blok
// html.theme-light di globals.css otomatis menggelapkannya di tema terang,
// sehingga monogram tetap kontras di semua tema.
const SECTOR_STYLE: Record<string, string> = {
  'Financials':                'bg-blue-500/10 text-blue-400 border-blue-500/25',
  'Energy':                    'bg-amber-500/10 text-amber-400 border-amber-500/25',
  'Healthcare':                'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  'Technology':                'bg-purple-500/10 text-purple-400 border-purple-500/25',
  'Consumer Cyclicals':        'bg-orange-500/10 text-orange-400 border-orange-500/25',
  'Consumer Defensives':       'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
  'Basic Materials':           'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
  'Industrials':               'bg-teal-500/10 text-teal-400 border-teal-500/25',
  'Infrastructures':           'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  'Transportation & Logistic': 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  'Properties & Real Estate':  'bg-red-500/10 text-red-400 border-red-500/25',
}

type Ext = 'svg' | 'png' | 'none'

/**
 * CompanyLogo — logo emiten dari /logos/{KODE}.svg|png (folder public).
 * Rantai fallback: SVG → PNG → monogram inisial berwarna sektor.
 * Tidak ada request jaringan ke pihak ketiga — semua file lokal.
 * Untuk menambah logo baru: cukup taruh file {KODE}.svg/.png di public/logos.
 */
export default function CompanyLogo({
  code,
  sector,
  size = 44,
  className = '',
  eager = false,
}: {
  code: string
  sector?: string
  size?: number
  className?: string
  eager?: boolean
}) {
  const [ext, setExt] = useState<Ext>('png')

  useEffect(() => { setExt('png') }, [code])

  const style = SECTOR_STYLE[sector || ''] ?? SECTOR_STYLE['Financials']

  if (ext === 'none') {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border ${style} font-mono font-black shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        aria-label={`Logo ${code} tidak tersedia`}
      >
        {code.slice(0, 2)}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-white ring-1 ring-black/5 shadow-sm overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, padding: Math.max(4, size * 0.14) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/logos/${code}.${ext}`}
        alt={`Logo ${code}`}
        width={size}
        height={size}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className="w-full h-full object-contain"
        onError={() => setExt(prev => (prev === 'png' ? 'svg' : 'none'))}
      />
    </div>
  )
}
