import { describe, it, expect } from 'vitest'
import {
  nextExpiry,
  isPlanActive,
  isEntitled,
  verifyCallbackToken,
  parseWebhookEvent,
  PRO_PLAN,
} from '@/lib/billing'

describe('PRO_PLAN', () => {
  it('defines the monthly plan', () => {
    expect(PRO_PLAN.months).toBe(1)
    expect(PRO_PLAN.priceIdr).toBeGreaterThan(0)
  })
})

describe('nextExpiry', () => {
  const t = (iso: string) => new Date(iso)

  it('extends a still-active window on top of itself', () => {
    const now = t('2026-08-01T00:00:00Z')
    const current = t('2026-08-20T00:00:00Z')
    expect(nextExpiry(current, 1, now).toISOString()).toBe(t('2026-09-20T00:00:00Z').toISOString())
  })

  it('starts from now when the window has lapsed', () => {
    const now = t('2026-08-01T00:00:00Z')
    const current = t('2026-07-01T00:00:00Z')
    expect(nextExpiry(current, 1, now).toISOString()).toBe(t('2026-09-01T00:00:00Z').toISOString())
  })

  it('handles a null current window', () => {
    const now = t('2026-08-01T00:00:00Z')
    expect(nextExpiry(null, 1, now).toISOString()).toBe(t('2026-09-01T00:00:00Z').toISOString())
  })
})

describe('isPlanActive', () => {
  const now = new Date('2026-08-15T00:00:00Z')

  it('is false for free plans', () => {
    expect(isPlanActive('free', null, now)).toBe(false)
  })

  it('treats pro with NULL expiry (legacy manual grant) as active', () => {
    expect(isPlanActive('pro', null, now)).toBe(true)
  })

  it('is true inside the window, false after it lapses', () => {
    expect(isPlanActive('pro', '2026-09-15T00:00:00Z', now)).toBe(true)
    expect(isPlanActive('pro', '2026-08-14T23:59:59Z', now)).toBe(false)
  })
})

describe('isEntitled', () => {
  const now = new Date('2026-08-15T00:00:00Z')

  it('paid window wins regardless of trial', () => {
    expect(isEntitled('pro', null, '2026-09-15T00:00:00Z', now)).toBe(true)
  })

  it('trial grants access even without a plan', () => {
    expect(isEntitled('free', '2026-08-20T00:00:00Z', null, now)).toBe(true)
  })

  it('lapsed trial and lapsed plan = blocked', () => {
    expect(isEntitled('pro', '2026-08-01T00:00:00Z', '2026-08-14T00:00:00Z', now)).toBe(false)
  })
})

describe('verifyCallbackToken', () => {
  it('accepts an exact match', () => {
    expect(verifyCallbackToken('secret-token', 'secret-token')).toBe(true)
  })

  it('rejects mismatches and empty values', () => {
    expect(verifyCallbackToken('other', 'secret-token')).toBe(false)
    expect(verifyCallbackToken(null, 'secret-token')).toBe(false)
    expect(verifyCallbackToken('secret-token', null)).toBe(false)
  })
})

describe('parseWebhookEvent', () => {
  it('extracts id/status/external_id/amount', () => {
    expect(parseWebhookEvent({ id: 'evt-1', status: 'paid', external_id: 'bdm-x-1', amount: 55000 })).toEqual({
      eventId: 'evt-1',
      status: 'PAID',
      externalId: 'bdm-x-1',
      amount: 55000,
    })
  })

  it('rejects payloads without id or status', () => {
    expect(parseWebhookEvent({ status: 'PAID' })).toBeNull()
    expect(parseWebhookEvent({ id: 'evt-1' })).toBeNull()
    expect(parseWebhookEvent(null)).toBeNull()
  })
})
