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
