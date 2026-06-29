// ============================================================
// src/lib/signals.ts
// Domain Logic untuk Interpretasi Data Pasar & Sinyal
// ============================================================

// ── Conviction Scoring System ──────────────────────────────────────────────
export type ConvictionTier = 'ELITE' | 'PREMIUM' | 'STANDARD' | 'WEAK'

export interface ConvictionBreakdown {
  tier: ConvictionTier
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: string
  action: string
  risk: string
}

export function getConvictionTier(score: number): ConvictionBreakdown {
  if (score >= 80) {
    return {
      tier: 'ELITE',
      label: 'Elite Signal',
      color: 'text-gold-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      icon: '👑',
      action: 'Strong Accumulation — large institutions loading. Consider entry with tight stop.',
      risk: 'Low',
    }
  }
  if (score >= 65) {
    return {
      tier: 'PREMIUM',
      label: 'Premium Signal',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/30',
      icon: '⭐',
      action: 'Above-average conviction. Monitor for breakout above key resistance.',
      risk: 'Low-Medium',
    }
  }
  if (score >= 45) {
    return {
      tier: 'STANDARD',
      label: 'Standard Signal',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/25',
      icon: '📊',
      action: 'Mixed signals. Wait for confirmation before committing capital.',
      risk: 'Medium',
    }
  }
  return {
    tier: 'WEAK',
    label: 'Weak Signal',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/25',
    icon: '⚠️',
    action: 'Low conviction or distribution pattern. Avoid or reduce position.',
    risk: 'High',
  }
}

// ── Foreign Flow Intensity ─────────────────────────────────────────────────
export type FlowIntensity = 'HOT_INFLOW' | 'INFLOW' | 'NEUTRAL' | 'OUTFLOW' | 'HOT_OUTFLOW'

export function getFlowIntensity(netForeign: number): {
  intensity: FlowIntensity
  label: string
  color: string
  dotColor: string
} {
  if (netForeign >= 50e9) return { intensity: 'HOT_INFLOW', label: 'Hot Buy', color: 'text-emerald-500', dotColor: 'bg-emerald-400 animate-pulse' }
  if (netForeign >= 5e9) return { intensity: 'INFLOW', label: 'Buying', color: 'text-emerald-400', dotColor: 'bg-emerald-400/60' }
  if (netForeign > -5e9) return { intensity: 'NEUTRAL', label: 'Neutral', color: 'text-slate-400', dotColor: 'bg-slate-400' }
  if (netForeign > -50e9) return { intensity: 'OUTFLOW', label: 'Selling', color: 'text-red-400', dotColor: 'bg-red-400/60' }
  return { intensity: 'HOT_OUTFLOW', label: 'Hot Sell', color: 'text-red-500', dotColor: 'bg-red-400 animate-pulse' }
}

// ── Whale Signal Interpretation ────────────────────────────────────────────
export function interpretWhaleSignal(
  whaleCount: number,
  anomalyCount: number,
  aovSpikeCount: number,
): string {
  const total = whaleCount + anomalyCount + aovSpikeCount
  if (total >= 10) return 'Multiple whale footprints detected. Institutional positioning likely. Monitor closely.'
  if (total >= 5) return 'Elevated whale activity. Possible accumulation phase beginning.'
  if (total >= 2) return 'Sporadic big-lot trades. Watch for follow-through.'
  return 'No significant whale activity. Market dominated by retail flow.'
}

// ── Sector Phase ──────────────────────────────────────────────────────────
export type SectorPhase = 'LEADING' | 'ACCUMULATING' | 'DISTRIBUTING' | 'LAGGING'

export function getSectorPhase(momentumScore: number, foreignFlow: number): SectorPhase {
  if (momentumScore >= 60 && foreignFlow > 0) return 'LEADING'
  if (foreignFlow > 0) return 'ACCUMULATING'
  if (momentumScore >= 60) return 'DISTRIBUTING'
  return 'LAGGING'
}

export function getPhaseStyle(phase: SectorPhase): { label: string; className: string } {
  switch (phase) {
    case 'LEADING': return { label: 'Leading', className: 'signal-strong-buy text-[10px] px-2 py-0.5 rounded-full' }
    case 'ACCUMULATING': return { label: 'Accumulating', className: 'badge-pro text-[10px]' }
    case 'DISTRIBUTING': return { label: 'Distributing', className: 'alert-medium text-[10px] px-2 py-0.5 rounded-full' }
    case 'LAGGING': return { label: 'Lagging', className: 'alert-low text-[10px] px-2 py-0.5 rounded-full' }
  }
}

// ── Basic Signal & Alert Colors ────────────────────────────────────────────
export function getSignalColor(signal: string): string {
  switch (signal) {
    case 'STRONG_BUY':
      return 'bg-emerald-500'
    case 'WATCH':
      return 'bg-amber-500'
    case 'NEUTRAL':
      return 'bg-slate-500'
    case 'AVOID':
      return 'bg-red-500'
    default:
      return 'bg-slate-500'
  }
}

export function getSignalTextColor(signal: string): string {
  switch (signal) {
    case 'STRONG_BUY':
      return 'text-emerald-400'
    case 'WATCH':
      return 'text-amber-400'
    case 'NEUTRAL':
      return 'text-slate-400'
    case 'AVOID':
      return 'text-red-400'
    default:
      return 'text-slate-400'
  }
}

export function getAlertColor(level: string): string {
  switch (level) {
    case 'HIGH':
      return 'bg-red-500'
    case 'MEDIUM':
      return 'bg-amber-500'
    case 'LOW':
      return 'bg-blue-500'
    default:
      return 'bg-slate-500'
  }
}
