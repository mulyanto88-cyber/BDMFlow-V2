// Trading-day arithmetic for the data-freshness check.
//
// Extracted from the API route so it can be unit-tested: timezone and
// weekend-rollback logic is exactly the kind that breaks silently, and it gates
// a warning users are meant to trust.

/** "Now" shifted into Jakarta time (UTC+7), regardless of server timezone. */
export function nowWIB(now: number = Date.now()): Date {
  return new Date(now + 7 * 3600_000)
}

/**
 * The most recent day IDX should have traded, as YYYY-MM-DD.
 *
 * Before ~20:00 WIB the current session's data isn't published yet, so the bar
 * is the previous session. Public holidays are not modelled — they show up as a
 * one-day lag, which the UI reports as a soft warning rather than an error.
 */
export function expectedTradingDate(now: number = Date.now()): string {
  const d = nowWIB(now)
  if (d.getUTCHours() < 20) d.setUTCDate(d.getUTCDate() - 1)
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export type FreshnessStatus = 'fresh' | 'lagging' | 'stale' | 'unknown'

/** Whole days between the session we expected and the data we actually have. */
export function lagInDays(dataDate: string | null, expected: string): number | null {
  if (!dataDate) return null
  return Math.round((Date.parse(expected) - Date.parse(dataDate)) / 86400_000)
}

export function classify(lagDays: number | null): FreshnessStatus {
  if (lagDays === null) return 'unknown'
  if (lagDays <= 0) return 'fresh'
  if (lagDays === 1) return 'lagging'   // a holiday, or the run finished late
  return 'stale'                        // two sessions behind: the pipeline is broken
}
