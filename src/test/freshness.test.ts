import { describe, it, expect } from 'vitest'
import { expectedTradingDate, lagInDays, classify } from '@/lib/freshness'

// Helper: build a UTC instant for a given Jakarta wall-clock time.
const wib = (iso: string, hour: number) =>
  Date.parse(`${iso}T${String(hour).padStart(2, '0')}:00:00Z`) - 7 * 3600_000

describe('expectedTradingDate', () => {
  it('returns the previous session before the 20:00 WIB publish time', () => {
    // Friday 2026-07-24, 10:00 WIB — Friday's data is not out yet.
    expect(expectedTradingDate(wib('2026-07-24', 10))).toBe('2026-07-23')
  })

  it('returns the same day once the data has been published', () => {
    // Friday 2026-07-24, 21:00 WIB.
    expect(expectedTradingDate(wib('2026-07-24', 21))).toBe('2026-07-24')
  })

  it('rolls Saturday back to Friday', () => {
    expect(expectedTradingDate(wib('2026-07-25', 12))).toBe('2026-07-24')
  })

  it('rolls Sunday back to Friday', () => {
    expect(expectedTradingDate(wib('2026-07-26', 12))).toBe('2026-07-24')
  })

  it('rolls Monday morning back to Friday, skipping the weekend', () => {
    // Monday 2026-07-27 09:00 WIB: minus one day is Sunday, which must roll on.
    expect(expectedTradingDate(wib('2026-07-27', 9))).toBe('2026-07-24')
  })

  it('stays on Monday once Monday has published', () => {
    expect(expectedTradingDate(wib('2026-07-27', 21))).toBe('2026-07-27')
  })
})

describe('lagInDays', () => {
  it('is 0 when the data matches the expected session', () => {
    expect(lagInDays('2026-07-24', '2026-07-24')).toBe(0)
  })

  it('counts calendar days behind', () => {
    expect(lagInDays('2026-07-22', '2026-07-24')).toBe(2)
  })

  it('is negative when data runs ahead of expectation', () => {
    expect(lagInDays('2026-07-25', '2026-07-24')).toBe(-1)
  })

  it('is null when there is no data at all', () => {
    expect(lagInDays(null, '2026-07-24')).toBeNull()
  })
})

describe('classify', () => {
  it('treats matching or ahead-of-schedule data as fresh', () => {
    expect(classify(0)).toBe('fresh')
    expect(classify(-1)).toBe('fresh')
  })

  it('treats one session behind as lagging, not broken', () => {
    // A public holiday looks exactly like this, so it must not read as an error.
    expect(classify(1)).toBe('lagging')
  })

  it('treats two or more sessions behind as stale', () => {
    expect(classify(2)).toBe('stale')
    expect(classify(9)).toBe('stale')
  })

  it('reports unknown when the lag cannot be computed', () => {
    expect(classify(null)).toBe('unknown')
  })
})
