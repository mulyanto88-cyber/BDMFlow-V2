import { describe, it, expect } from 'vitest'
import { createHash } from 'crypto'
import {
  nextExpiry,
  isPlanActive,
  isEntitled,
  verifyCallbackToken,
  verifyMidtransSignature,
  parseWebhookEvent,
  parseMidtransNotification,
  parseMayarWebhook,
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
      gatewayRef: 'evt-1',
      amount: 55000,
      customerEmail: null,
    })
  })

  it('rejects payloads without id or status', () => {
    expect(parseWebhookEvent({ status: 'PAID' })).toBeNull()
    expect(parseWebhookEvent({ id: 'evt-1' })).toBeNull()
    expect(parseWebhookEvent(null)).toBeNull()
  })
})

describe('parseMayarWebhook', () => {
  it('correctly parses real Mayar payload with productDescription and customerEmail', () => {
    const payload = {
      event: 'payment.received',
      data: {
        id: '376e17c2-bafa-4537-b088-a4649c1e95f3',
        status: 'SUCCESS',
        amount: 79000,
        customerName: 'rudie.junior96',
        customerEmail: 'rudie.junior96@gmail.com',
        productDescription: 'Langganan BDMFlow Pro — 3 Bulan (Hemat Ekstra) - BDMFlow IDX Intelligence (bdm-6e48f326-1788513711099)',
      },
    }

    const ev = parseMayarWebhook(payload)
    expect(ev).toEqual({
      eventId: 'mayar:376e17c2-bafa-4537-b088-a4649c1e95f3:PAID',
      status: 'PAID',
      externalId: 'bdm-6e48f326-1788513711099',
      gatewayRef: '376e17c2-bafa-4537-b088-a4649c1e95f3',
      amount: 79000,
      customerEmail: 'rudie.junior96@gmail.com',
    })
  })

  it('handles snake_case fields as fallback', () => {
    const payload = {
      type: 'payment.paid',
      data: {
        transaction_id: 'tx-mayar-1',
        status: 'PAID',
        amount: 30000,
        customer_email: 'USER@EXAMPLE.COM ',
        description: 'BDMFlow (bdm-user-12345)',
      },
    }

    const ev = parseMayarWebhook(payload)
    expect(ev?.externalId).toBe('bdm-user-12345')
    expect(ev?.customerEmail).toBe('user@example.com')
    expect(ev?.status).toBe('PAID')
  })

  it('rejects invalid Mayar payloads', () => {
    expect(parseMayarWebhook(null)).toBeNull()
    expect(parseMayarWebhook({})).toBeNull()
    expect(parseMayarWebhook({ event: 'unknown' })).toBeNull()
  })
})

describe('parseMidtransNotification', () => {
  it('maps settlement/capture → PAID and keeps external_id as the order id', () => {
    expect(
      parseMidtransNotification({
        order_id: 'bdm-x-1',
        transaction_id: 'tx-9',
        transaction_status: 'settlement',
        gross_amount: '55000.00',
      }),
    ).toEqual({
      eventId: 'bdm-x-1:tx-9:PAID',
      status: 'PAID',
      externalId: 'bdm-x-1',
      gatewayRef: 'tx-9',
      amount: 55000,
    })
  })

  it('maps non-terminal statuses', () => {
    expect(parseMidtransNotification({ order_id: 'o1', transaction_status: 'pending' })?.status).toBe('PENDING')
    expect(parseMidtransNotification({ order_id: 'o2', transaction_status: 'expire' })?.status).toBe('EXPIRED')
    expect(parseMidtransNotification({ order_id: 'o3', transaction_status: 'deny' })?.status).toBe('FAILED')
    expect(parseMidtransNotification({ order_id: 'o4', transaction_status: 'cancel' })?.status).toBe('CANCELED')
  })

  it('rejects payloads without order_id or status', () => {
    expect(parseMidtransNotification({ transaction_status: 'settlement' })).toBeNull()
    expect(parseMidtransNotification({ order_id: 'o1' })).toBeNull()
    expect(parseMidtransNotification(null)).toBeNull()
  })
})

describe('verifyMidtransSignature', () => {
  const SERVER_KEY = 'test-server-key'

  function sign(orderId: string, statusCode: string, grossAmount: string) {
    return createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${SERVER_KEY}`)
      .digest('hex')
  }

  it('accepts a valid signature (gross_amount as the raw string)', () => {
    const body = {
      order_id: 'bdm-x-1',
      status_code: '200',
      gross_amount: '55000.00',
      signature_key: sign('bdm-x-1', '200', '55000.00'),
    }
    expect(verifyMidtransSignature(body, SERVER_KEY)).toBe(true)
  })

  it('rejects a tampered amount or order id', () => {
    const body = {
      order_id: 'bdm-x-1',
      status_code: '200',
      gross_amount: '55000.00',
      signature_key: sign('bdm-x-1', '200', '55000.01'),
    }
    expect(verifyMidtransSignature(body, SERVER_KEY)).toBe(false)

    const body2 = {
      order_id: 'bdm-x-2',
      status_code: '200',
      gross_amount: '55000.00',
      signature_key: sign('bdm-x-1', '200', '55000.00'),
    }
    expect(verifyMidtransSignature(body2, SERVER_KEY)).toBe(false)
  })

  it('rejects when no server key is configured or fields are missing', () => {
    expect(verifyMidtransSignature({ order_id: 'a', status_code: '200', gross_amount: '1', signature_key: 'x' }, null)).toBe(false)
    expect(verifyMidtransSignature({ order_id: 'a', status_code: '200' }, SERVER_KEY)).toBe(false)
  })
})
