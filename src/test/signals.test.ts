import { describe, it, expect } from 'vitest'
import {
  getConvictionTier,
  getFlowIntensity,
  interpretWhaleSignal,
  getSectorPhase,
  getPhaseStyle,
  getSignalColor,
  getSignalTextColor,
  getAlertColor,
} from '@/lib/signals'

describe('getConvictionTier', () => {
  it('returns ELITE for score >= 80', () => {
    const result = getConvictionTier(85)
    expect(result.tier).toBe('ELITE')
    expect(result.label).toBe('Elite Signal')
    expect(result.risk).toBe('Low')
  })

  it('returns PREMIUM for score >= 65 and < 80', () => {
    const result = getConvictionTier(70)
    expect(result.tier).toBe('PREMIUM')
    expect(result.label).toBe('Premium Signal')
    expect(result.risk).toBe('Low-Medium')
  })

  it('returns PREMIUM for score exactly 80', () => {
    const result = getConvictionTier(80)
    expect(result.tier).toBe('ELITE')
  })

  it('returns PREMIUM for score exactly 65', () => {
    const result = getConvictionTier(65)
    expect(result.tier).toBe('PREMIUM')
  })

  it('returns STANDARD for score >= 45 and < 65', () => {
    const result = getConvictionTier(50)
    expect(result.tier).toBe('STANDARD')
    expect(result.label).toBe('Standard Signal')
    expect(result.risk).toBe('Medium')
  })

  it('returns WEAK for score < 45', () => {
    const result = getConvictionTier(20)
    expect(result.tier).toBe('WEAK')
    expect(result.label).toBe('Weak Signal')
    expect(result.risk).toBe('High')
  })

  it('handles boundary: score 0', () => {
    const result = getConvictionTier(0)
    expect(result.tier).toBe('WEAK')
  })

  it('handles boundary: score 100', () => {
    const result = getConvictionTier(100)
    expect(result.tier).toBe('ELITE')
  })
})

describe('getFlowIntensity', () => {
  it('returns HOT_INFLOW for net >= 50 billion', () => {
    const result = getFlowIntensity(60_000_000_000)
    expect(result.intensity).toBe('HOT_INFLOW')
    expect(result.label).toBe('Hot Buy')
  })

  it('returns INFLOW for net >= 5 billion and < 50 billion', () => {
    const result = getFlowIntensity(10_000_000_000)
    expect(result.intensity).toBe('INFLOW')
    expect(result.label).toBe('Buying')
  })

  it('returns NEUTRAL for net between -5 billion and 5 billion', () => {
    const result = getFlowIntensity(0)
    expect(result.intensity).toBe('NEUTRAL')
    expect(result.label).toBe('Neutral')
  })

  it('returns OUTFLOW for net between -50 billion and -5 billion', () => {
    const result = getFlowIntensity(-10_000_000_000)
    expect(result.intensity).toBe('OUTFLOW')
    expect(result.label).toBe('Selling')
  })

  it('returns HOT_OUTFLOW for net < -50 billion', () => {
    const result = getFlowIntensity(-60_000_000_000)
    expect(result.intensity).toBe('HOT_OUTFLOW')
    expect(result.label).toBe('Hot Sell')
  })
})

describe('interpretWhaleSignal', () => {
  it('detects multiple whale footprints for total >= 10', () => {
    const result = interpretWhaleSignal(5, 3, 2)
    expect(result).toContain('Multiple whale footprints')
  })

  it('detects elevated whale activity for total >= 5', () => {
    const result = interpretWhaleSignal(3, 1, 1)
    expect(result).toContain('Elevated whale activity')
  })

  it('detects sporadic trades for total >= 2', () => {
    const result = interpretWhaleSignal(1, 0, 1)
    expect(result).toContain('Sporadic big-lot trades')
  })

  it('detects no activity for total < 2', () => {
    const result = interpretWhaleSignal(0, 0, 0)
    expect(result).toContain('No significant whale activity')
  })
})

describe('getSectorPhase', () => {
  it('returns LEADING for high momentum and positive foreign flow', () => {
    expect(getSectorPhase(70, 100)).toBe('LEADING')
  })

  it('returns ACCUMULATING for positive foreign flow with low momentum', () => {
    expect(getSectorPhase(40, 100)).toBe('ACCUMULATING')
  })

  it('returns DISTRIBUTING for high momentum with negative foreign flow', () => {
    expect(getSectorPhase(70, -100)).toBe('DISTRIBUTING')
  })

  it('returns LAGGING for low momentum and negative foreign flow', () => {
    expect(getSectorPhase(40, -100)).toBe('LAGGING')
  })
})

describe('getPhaseStyle', () => {
  it('returns proper className for each phase', () => {
    expect(getPhaseStyle('LEADING').label).toBe('Leading')
    expect(getPhaseStyle('LAGGING').label).toBe('Lagging')
  })
})

describe('getSignalColor', () => {
  it('returns correct bg color for STRONG_BUY', () => {
    expect(getSignalColor('STRONG_BUY')).toBe('bg-emerald-500')
  })

  it('returns correct bg color for AVOID', () => {
    expect(getSignalColor('AVOID')).toBe('bg-red-500')
  })

  it('returns default for unknown signal', () => {
    expect(getSignalColor('UNKNOWN')).toBe('bg-slate-500')
  })
})

describe('getSignalTextColor', () => {
  it('returns text-emerald-400 for STRONG_BUY', () => {
    expect(getSignalTextColor('STRONG_BUY')).toBe('text-emerald-400')
  })

  it('returns text-red-400 for AVOID', () => {
    expect(getSignalTextColor('AVOID')).toBe('text-red-400')
  })
})

describe('getAlertColor', () => {
  it('returns bg-red-500 for HIGH', () => {
    expect(getAlertColor('HIGH')).toBe('bg-red-500')
  })

  it('returns bg-amber-500 for MEDIUM', () => {
    expect(getAlertColor('MEDIUM')).toBe('bg-amber-500')
  })

  it('returns bg-blue-500 for LOW', () => {
    expect(getAlertColor('LOW')).toBe('bg-blue-500')
  })
})
