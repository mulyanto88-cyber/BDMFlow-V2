/**
 * Broker Color System for IDX Broker Codes (e.g. AK, ZP, XL, YP, CC, BK, RX, etc.)
 * Provides distinct, consistent, theme-adaptive, and high-contrast color pills.
 */

interface BrokerStyle {
  classes: string
  label?: string
}

// 1. Explicit branded palettes for top well-known IDX brokers
const BROKER_COLOR_MAP: Record<string, string> = {
  // Foreign & Smart Money Whales
  AK: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',        // UBS Sekuritas
  BK: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',  // J.P. Morgan
  KZ: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',// CLSA Sekuritas
  RX: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',  // Macquarie
  ZP: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',    // Maybank
  CS: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',        // Credit Suisse
  MS: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',          // Morgan Stanley
  CG: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30',// CGS-CIMB
  YU: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',  // CGS International
  AI: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',        // UOB Kay Hian

  // Top Local Institutional & Retail
  CC: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border-cyan-500/30',        // Mandiri Sekuritas
  PD: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',        // Indo Premier (IPOT)
  YP: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',    // Mirae Asset
  XL: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',// Stockbit / Mahakarya
  NI: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',  // BNI Sekuritas
  SQ: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',          // BCA Sekuritas
  DX: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',  // Bahana Sekuritas
  LG: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',        // Trimegah Sekuritas
  GR: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',        // Panin Sekuritas
  XC: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',        // Ajaib Sekuritas
  CP: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',    // KB Valbury
  DR: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',          // RHB Sekuritas
  AZ: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',// Sucor Sekuritas
  MG: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',  // Semesta Indovest
  FS: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',  // Shinhan Sekuritas
  IF: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border-cyan-500/30',        // Samuel Sekuritas
  KI: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',        // Ciptadana
  BQ: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',    // Korea Investment
  OD: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',        // BRI Danareksa
  BB: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',  // Verdhana Sekuritas
  HP: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',  // Henan Putihrai
  HD: 'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',        // KGI Sekuritas
  EP: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30',// MNC Sekuritas
  SF: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',// Surya Fajar
  AP: 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',          // Pacific Sekuritas
  XA: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',  // Woori Korindo
  RG: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border-cyan-500/30',        // Profindo
  DH: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',        // Sinarmas
}

// 2. Curated fallback palette array for any unmapped broker code
const FALLBACK_PALETTES = [
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30',
  'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',
  'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
  'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
  'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
  'bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30',
  'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
  'bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border-cyan-500/30',
  'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-500/30',
  'bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/30',
  'bg-lime-500/15 text-lime-800 dark:text-lime-400 border-lime-500/30',
]

/**
 * Get distinct, theme-adaptive Tailwind classes for any IDX broker code.
 */
export function getBrokerBadgeStyle(brokerCode?: string | null): string {
  if (!brokerCode) return 'bg-surface-2 text-muted-foreground border-line-2'
  const code = brokerCode.trim().toUpperCase()

  if (BROKER_COLOR_MAP[code]) {
    return BROKER_COLOR_MAP[code]
  }

  // Deterministic hash based on characters
  let hash = 0
  for (let i = 0; i < code.length; i++) {
    hash = (hash << 5) - hash + code.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % FALLBACK_PALETTES.length
  return FALLBACK_PALETTES[index]
}
