import { describe, it, expect } from 'vitest'
import { formatRupiah, fmtRpShort, formatPercent, formatNumber, formatShares, cn, intParam, floatParam, snapParam } from '@/lib/utils'

describe('formatRupiah', () => {
  it('returns "5.8 T" for 5,823,000,000,000', () => {
    expect(formatRupiah(5_823_000_000_000)).toBe('5.8 T')
  })

  it('returns "150.0 M" for 150,000,000,000', () => {
    expect(formatRupiah(150_000_000_000)).toBe('150.0 M')
  })

  it('returns "52.5 Jt" for 52,500,000', () => {
    expect(formatRupiah(52_500_000)).toBe('52.5 Jt')
  })

  it('returns locale-formatted string for values under 1 million', () => {
    expect(formatRupiah(500_000)).toBe('500.000')
  })

  it('handles negative values', () => {
    expect(formatRupiah(-150_000_000_000)).toBe('-150.0 M')
  })

  it('handles zero', () => {
    expect(formatRupiah(0)).toBe('0')
  })

  it('handles exactly 1 trillion', () => {
    expect(formatRupiah(1_000_000_000_000)).toBe('1.0 T')
  })

  it('handles exactly 1 billion', () => {
    expect(formatRupiah(1_000_000_000)).toBe('1.0 M')
  })
})

describe('fmtRpShort', () => {
  it('prepends "Rp" to formatted value', () => {
    expect(fmtRpShort(5_823_000_000_000)).toBe('Rp5.8 T')
  })
})

describe('formatPercent', () => {
  it('adds + sign for positive values', () => {
    expect(formatPercent(12.5)).toBe('+12.50%')
  })

  it('adds - sign for negative values', () => {
    expect(formatPercent(-3.2)).toBe('-3.20%')
  })

  it('returns +0.00% for zero', () => {
    expect(formatPercent(0)).toBe('+0.00%')
  })
})

describe('formatNumber', () => {
  it('formats numbers with Indonesian locale', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
  })
})

describe('formatShares', () => {
  it('formats billions', () => {
    expect(formatShares(24_600_000_000)).toBe('24.60 M')
  })

  it('formats millions', () => {
    expect(formatShares(500_000_000)).toBe('500.00 Jt')
  })

  it('returns locale-formatted for values under 1 million', () => {
    expect(formatShares(500_000)).toBe('500.000')
  })

  it('handles negative values', () => {
    expect(formatShares(-1_000_000_000)).toBe('-1.00 M')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2')
  })

  it('filters out falsy values', () => {
    expect(cn('px-4', false, undefined, null, 'py-2')).toBe('px-4 py-2')
  })

  it('handles conditional class names', () => {
    const result = cn('base', true && 'active', false && 'inactive')
    expect(result).toBe('base active')
  })
})

describe('intParam', () => {
  it('returns the fallback for missing/NaN input', () => {
    expect(intParam(null, 7)).toBe(7)
    expect(intParam(undefined, 7)).toBe(7)
    expect(intParam('abc', 7)).toBe(7)
    expect(intParam('', 7)).toBe(7)
  })

  it('parses valid integers', () => {
    expect(intParam('30', 7)).toBe(30)
    expect(intParam('-5', 7)).toBe(-5)
  })

  it('clamps to [min, max]', () => {
    expect(intParam('999', 7, 1, 90)).toBe(90)
    expect(intParam('0', 7, 1, 90)).toBe(1)
    expect(intParam('-50', 7, 1, 90)).toBe(1)
  })

  it('NaN can never escape the fallback/clamp (SQL-literal safety)', () => {
    expect(Number.isFinite(intParam('NaN', 7, 1, 90))).toBe(true)
    expect(Number.isFinite(intParam('Infinity', 7, 1, 90))).toBe(true)
  })
})

describe('floatParam', () => {
  it('returns the fallback for missing/NaN input', () => {
    expect(floatParam(null, 0.5)).toBe(0.5)
    expect(floatParam('abc', 0.5)).toBe(0.5)
  })

  it('parses valid floats', () => {
    expect(floatParam('2.75', 0.5)).toBe(2.75)
  })

  it('clamps to [min, max]', () => {
    expect(floatParam('200', 0, 0, 100)).toBe(100)
    expect(floatParam('-1', 0, 0, 100)).toBe(0)
  })
})

describe('snapParam', () => {
  const DAYS = [1, 5, 7, 14, 30]

  it('keeps values already in the whitelist', () => {
    expect(snapParam(7, DAYS, 7)).toBe(7)
    expect(snapParam(30, DAYS, 7)).toBe(30)
  })

  it('snaps free-form values to the nearest option', () => {
    expect(snapParam(6, DAYS, 7)).toBe(5)
    expect(snapParam(8, DAYS, 7)).toBe(7)
    expect(snapParam(999, DAYS, 7)).toBe(30)
  })

  it('ties resolve to the lower option', () => {
    expect(snapParam(4, [1, 7], 1)).toBe(1)
  })

  it('returns fallback for non-finite input', () => {
    expect(snapParam(NaN, DAYS, 7)).toBe(7)
    expect(snapParam(Infinity, DAYS, 7)).toBe(7)
  })
})
