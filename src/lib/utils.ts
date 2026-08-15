import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format Rupiah — abbreviated (untuk nilai portfolio, modal, P&L besar)
// Contoh: 5_823_000_000_000 → "5.8 T" | 150_000_000_000 → "150 M" | 52_500_000 → "52.5 Jt"
export function formatRupiah(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000_000) return `${sign}${(abs / 1_000_000_000_000).toFixed(1)} T`
  if (abs >= 1_000_000_000)     return `${sign}${(abs / 1_000_000_000).toFixed(1)} M`
  if (abs >= 1_000_000)         return `${sign}${(abs / 1_000_000).toFixed(1)} Jt`
  return value.toLocaleString('id-ID')
}

// Format Rupiah dengan prefix "Rp" (abbreviated)
// Contoh: 5_823_000_000_000 → "Rp5.8 T"
export function fmtRpShort(value: number): string {
  return `Rp${formatRupiah(value)}`
}

// Format percentage
export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

// Format number with commas (untuk harga per saham, jumlah lot kecil)
export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID')
}

// Format shares — abbreviated (untuk jumlah lembar saham)
// Contoh: 24_600_000_000 → "24.60 M" | 500_000_000 → "500.00 Jt"
export function formatShares(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} M`
  if (abs >= 1_000_000)     return `${(value / 1_000_000).toFixed(2)} Jt`
  return value.toLocaleString('id-ID')
}

// ── Query-string number parsing (API route guards) ─────────────────────────
// NaN from parseInt('abc') must never reach an interpolated SQL literal —
// `INTERVAL 'NaN days'` is a 500 for everyone and a fingerprint for scanners.

/** Parse a query-string integer safely: NaN → fallback, then clamped to [min, max]. */
export function intParam(raw: string | null | undefined, fallback: number, min = -Infinity, max = Infinity): number {
  const n = parseInt(raw ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

/** Parse a query-string float safely: NaN → fallback, then clamped to [min, max]. */
export function floatParam(raw: string | null | undefined, fallback: number, min = -Infinity, max = Infinity): number {
  const n = parseFloat(raw ?? '')
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

/**
 * Snap an arbitrary number to the nearest value in an ordered whitelist.
 *
 * Edge-cache keys are the full URL: every distinct query value (days=6 vs
 * days=7 vs days=9) used to be a separate cache key and therefore a separate
 * MotherDuck computation. Snapping free-form params onto the fixed set the UI
 * already offers converges those keys — same data, far fewer compute hits.
 * Ties resolve to the lower option.
 */
export function snapParam(value: number, options: readonly number[], fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  let best = options[0] ?? fallback
  for (const o of options) {
    if (Math.abs(o - value) < Math.abs(best - value)) best = o
  }
  return best
}

// ── Timeframe Labels ───────────────────────────────────────────────────────
export const TIMEFRAME_LABELS: Record<string, string> = {
  '1D': 'Intraday',
  '5D': 'Weekly',
  '10D': 'Bi-Weekly',
  '20D': 'Monthly',
  '30D': 'Monthly',
  '60D': 'Quarterly',
  '90D': 'Quarterly',
  '120D': 'Semi-Annual',
  '1W': 'Weekly',
  '1M': 'Monthly',
  '3M': 'Quarterly',
  '6M': 'Semi-Annual',
  '1Y': 'Annual',
}
