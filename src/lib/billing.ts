// ============================================================
// src/lib/billing.ts
// Server-only billing helpers + payment-gateway clients.
//
// Two gateways are supported behind one dispatcher — whichever
// API key is present in the environment wins:
//   Xendit   : XENDIT_API_KEY + XENDIT_WEBHOOK_TOKEN
//   Midtrans : MIDTRANS_SERVER_KEY (webhook signed with SHA512)
//
// Env vars are server-side only, never exposed to the browser.
// ============================================================
import { createHash, timingSafeEqual } from 'crypto'

export const PRO_PLANS = {
  monthly: {
    id: 'pro_monthly',
    priceIdr: 30_000,
    months: 1,
    label: 'BDMFlow Pro — 1 Bulan (Early Bird)',
    invoiceDurationSec: 3 * 24 * 3600, // 3 days to pay before it expires
  },
  quarterly: {
    id: 'pro_quarterly',
    priceIdr: 79_000, // Diskon dari Rp 90.000 (hanya Rp 26.300/bulan)
    months: 3,
    label: 'BDMFlow Pro — 3 Bulan (Hemat Ekstra)',
    invoiceDurationSec: 3 * 24 * 3600,
  },
} as const

export type PlanKey = keyof typeof PRO_PLANS
export type PlanItem = (typeof PRO_PLANS)[PlanKey]
export const PRO_PLAN = PRO_PLANS.monthly

// ── Pure helpers (unit-tested) ──────────────────────────────────────────────

/** Extend an expiry window. If the current window is still in the future, stack
 *  on top of it; otherwise start from now. */
export function nextExpiry(current: Date | null, months: number, now = new Date()): Date {
  const base = current && current.getTime() > now.getTime() ? current : now
  const d = new Date(base)
  d.setMonth(d.getMonth() + months)
  return d
}

/** A pro row is active when its window hasn't lapsed. NULL expiry = legacy
 *  manual grant with no window — treated as still active. */
export function isPlanActive(
  plan: string | null | undefined,
  planExpiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (plan !== 'pro') return false
  if (!planExpiresAt) return true
  return new Date(planExpiresAt).getTime() > now.getTime()
}

/** Pro data may be served: active paid window, or inside the trial. */
export function isEntitled(
  plan: string | null | undefined,
  trialEndsAt: string | null | undefined,
  planExpiresAt: string | null | undefined,
  now = new Date(),
): boolean {
  if (isPlanActive(plan, planExpiresAt, now)) return true
  const trial = trialEndsAt ? new Date(trialEndsAt) : null
  return !!trial && trial.getTime() > now.getTime()
}

/** Constant-time comparison of the callback token Xendit sends in the
 *  `x-callback-token` header. */
export function verifyCallbackToken(header: string | null, expected: string | null): boolean {
  if (!header || !expected) return false
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// ── Webhook payload parsing ─────────────────────────────────────────────────

export type WebhookEvent = {
  /** Stable id for the idempotency ledger. */
  eventId: string
  /** Normalized terminal state: PAID | EXPIRED | FAILED | CANCELED | PENDING | REFUNDED. */
  status: string
  externalId: string | null
  /** Gateway's own transaction/invoice id, once known. */
  gatewayRef: string | null
  amount: number
  /** Customer email from payload if available */
  customerEmail?: string | null
}

/** Extract the few fields the ledger cares about. Returns null when the
 *  payload isn't shaped like an Xendit invoice callback. */
export function parseWebhookEvent(body: unknown): WebhookEvent | null {
  const b = body as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return null
  const id = b.id ?? b.event_id
  const status = typeof b.status === 'string' ? b.status.toUpperCase() : ''
  if (!id || !status) return null
  return {
    eventId: String(id),
    status,
    externalId: typeof b.external_id === 'string' ? b.external_id : null,
    gatewayRef: String(id),
    amount: Number(b.amount ?? 0),
    customerEmail: typeof b.payer_email === 'string' ? b.payer_email : null,
  }
}

/** Mayar status codes and webhook event parser */
export function parseMayarWebhook(body: unknown): WebhookEvent | null {
  const b = body as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return null
  const data = ((b.data && typeof b.data === 'object' ? b.data : b) || {}) as Record<string, unknown>
  const event = String(b.event || b.type || '').toLowerCase()
  const id = data.id ?? data.transaction_id ?? data.payment_id ?? b.id
  const statusStr = String(data.status || data.transactionStatus || event).toUpperCase()
  if (!id) return null

  const isPaid =
    statusStr.includes('SUCCESS') ||
    statusStr.includes('PAID') ||
    statusStr.includes('SETTLEMENT') ||
    event.includes('payment.received') ||
    event.includes('payment.paid') ||
    event.includes('transaction.paid') ||
    event.includes('invoice.paid')
  const status = isPaid ? 'PAID' : statusStr.includes('EXPIRE') ? 'EXPIRED' : statusStr.includes('FAIL') ? 'FAILED' : 'PENDING'

  // Look for external_id (e.g. bdm-xxxx-xxxx) in productDescription, description, notes, or full body
  const desc = String(
    data.productDescription ||
    data.description ||
    data.product_description ||
    data.notes ||
    b.productDescription ||
    b.description ||
    ''
  )
  const fullBodyStr = JSON.stringify(body)
  const match = desc.match(/bdm-[a-zA-Z0-9_-]+/) || fullBodyStr.match(/bdm-[a-zA-Z0-9_-]+/)
  const externalId = (data.external_id as string) || (data.externalId as string) || (match ? match[0] : null) || (data.order_id as string) || (data.orderId as string) || null

  const customerObj = (data.customer || b.customer) as Record<string, unknown> | undefined
  const customerEmail =
    (data.customerEmail as string) ||
    (data.customer_email as string) ||
    (data.email as string) ||
    (customerObj?.email as string) ||
    (b.customerEmail as string) ||
    (b.customer_email as string) ||
    (b.email as string) ||
    null

  const rawAmount = data.amount ?? data.paymentLinkAmount ?? data.nettAmount ?? b.amount ?? 0

  return {
    eventId: `mayar:${String(id)}:${status}`,
    status,
    externalId,
    gatewayRef: String(id),
    amount: Number(rawAmount),
    customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : null,
  }
}

/** Midtrans status codes → the shared vocabulary used by the ledger. */
function mapMidtransStatus(s: string): string {
  switch (s) {
    case 'SETTLEMENT':
    case 'CAPTURE':
      return 'PAID'
    case 'EXPIRE':
      return 'EXPIRED'
    case 'DENY':
      return 'FAILED'
    case 'CANCEL':
      return 'CANCELED'
    case 'REFUND':
      return 'REFUNDED'
    default:
      return 'PENDING'
  }
}

/** Extract the fields the ledger cares about from a Midtrans notification.
 *  Returns null when the payload is not shaped like one. */
export function parseMidtransNotification(body: unknown): WebhookEvent | null {
  const b = body as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return null
  const orderId = b.order_id
  const status = typeof b.transaction_status === 'string' ? b.transaction_status.toUpperCase() : ''
  if (!orderId || !status) return null
  const txId = b.transaction_id ? String(b.transaction_id) : null
  const normalized = mapMidtransStatus(status)
  return {
    eventId: txId ? `${String(orderId)}:${txId}:${normalized}` : `${String(orderId)}:${normalized}`,
    status: normalized,
    externalId: String(orderId),
    gatewayRef: txId,
    amount: Number(b.gross_amount ?? 0),
  }
}

/**
 * Verify a Midtrans notification signature:
 * SHA512(order_id + status_code + gross_amount + server_key).
 */
export function verifyMidtransSignature(body: unknown, serverKey: string | null): boolean {
  if (!serverKey) return false
  const b = body as Record<string, unknown> | null
  if (!b || typeof b !== 'object') return false
  const { order_id, status_code, gross_amount, signature_key } = b
  if (typeof order_id !== 'string' || typeof status_code !== 'string' || signature_key == null) return false
  const rawAmount = typeof gross_amount === 'string' ? gross_amount : String(gross_amount)
  const payload = `${order_id}${status_code}${rawAmount}${serverKey}`
  const digest = createHash('sha512').update(payload).digest('hex')
  const a = Buffer.from(digest)
  const c = Buffer.from(String(signature_key))
  if (a.length !== c.length) return false
  return timingSafeEqual(a, c)
}

// ── Gateway clients ─────────────────────────────────────────────────────────

const MAYAR_BASE = process.env.MAYAR_API_BASE ?? 'https://api.mayar.id/hl/v1'
const XENDIT_BASE = process.env.XENDIT_API_BASE ?? 'https://api.xendit.co'
const MIDTRANS_BASE = process.env.MIDTRANS_API_BASE ?? 'https://app.midtrans.com'

export type PaymentResult =
  | { ok: true; paymentUrl: string; gatewayRef: string }
  | { ok: false; reason: 'PAYMENT_NOT_CONFIGURED' | 'GATEWAY_ERROR'; message: string }

/** Which gateway is configured. Mayar wins if configured, then Midtrans, then Xendit. */
export function activeGateway(): 'mayar' | 'midtrans' | 'xendit' | null {
  if (process.env.MAYAR_API_KEY) return 'mayar'
  if (process.env.MIDTRANS_SERVER_KEY) return 'midtrans'
  if (process.env.XENDIT_SECRET_KEY) return 'xendit'
  return null
}

/**
 * Create a payment with whichever gateway is configured.
 */
export async function createPayment(opts: {
  externalId: string
  email: string
  planKey?: PlanKey
  successRedirectUrl: string
}): Promise<PaymentResult> {
  const gw = activeGateway()
  const plan = opts.planKey ? (PRO_PLANS[opts.planKey] || PRO_PLAN) : PRO_PLAN
  if (gw === 'mayar') return createMayarPayment({ ...opts, plan })
  if (gw === 'midtrans') return createMidtransTransaction({ ...opts, plan })
  if (gw === 'xendit') return createXenditInvoice({ ...opts, plan })
  return { ok: false, reason: 'PAYMENT_NOT_CONFIGURED', message: 'Payment gateway belum dikonfigurasi.' }
}

/**
 * Create a Mayar payment link (Single Payment / Invoice).
 * Supports Mayar Headless API (api.mayar.id/hl/v1) and fallback to pub.mayar.id
 */
export async function createMayarPayment(opts: {
  externalId: string
  email: string
  plan?: PlanItem
  successRedirectUrl: string
}): Promise<PaymentResult> {
  const rawKey = process.env.MAYAR_API_KEY?.trim()
  if (!rawKey) {
    return { ok: false, reason: 'PAYMENT_NOT_CONFIGURED', message: 'API Key Mayar (MAYAR_API_KEY) belum dikonfigurasi di server.' }
  }

  const p = opts.plan ?? PRO_PLAN

  // Try primary endpoint (api.mayar.id/hl/v1) then fallback (pub.mayar.id/api/v1)
  const endpoints = [
    `${MAYAR_BASE}/payment/create`,
    'https://api.mayar.id/hl/v1/payment/create',
    'https://pub.mayar.id/api/v1/payment/create',
  ]

  // Remove duplicates
  const uniqueEndpoints = Array.from(new Set(endpoints))

  let lastErrorMsg = 'Gagal menghubungi payment gateway Mayar.'

  for (const url of uniqueEndpoints) {
    try {
      const payload = {
        name: opts.email.split('@')[0] || 'Customer BDMFlow',
        email: opts.email,
        amount: p.priceIdr,
        description: `Langganan ${p.label} - BDMFlow IDX Intelligence (${opts.externalId})`,
        redirectUrl: opts.successRedirectUrl,
        expiredAt: new Date(Date.now() + p.invoiceDurationSec * 1000).toISOString(),
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${rawKey}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        console.error(`[billing] Mayar payment attempt at ${url} failed: HTTP ${res.status}`, errText)
        let parsedErr = ''
        try {
          const parsed = JSON.parse(errText)
          parsedErr = parsed?.messages?.[0] || parsed?.message || parsed?.error || ''
        } catch {}
        lastErrorMsg = parsedErr ? `Mayar: ${parsedErr}` : `Gagal membuat pembayaran Mayar (HTTP ${res.status}).`
        continue
      }

      const json = await res.json()
      const paymentUrl = json?.data?.link || json?.data?.url || json?.data?.paymentUrl || json?.link || json?.url
      const gatewayRef = json?.data?.id || json?.id || opts.externalId

      if (paymentUrl) {
        return { ok: true, paymentUrl, gatewayRef }
      } else {
        console.error('[billing] Mayar response missing paymentUrl:', json)
      }
    } catch (err: unknown) {
      console.error(`[billing] Mayar network fetch error for ${url}:`, (err as Error)?.message)
      lastErrorMsg = `Koneksi ke Mayar terputus: ${(err as Error)?.message}`
    }
  }

  return { ok: false, reason: 'GATEWAY_ERROR', message: lastErrorMsg }
}

/**
 * Create a Xendit invoice (payment page link).
 */
export async function createXenditInvoice(opts: {
  externalId: string
  email: string
  plan?: PlanItem
  successRedirectUrl: string
}): Promise<PaymentResult> {
  const key = process.env.XENDIT_API_KEY
  if (!key) {
    return { ok: false, reason: 'PAYMENT_NOT_CONFIGURED', message: 'Payment gateway belum dikonfigurasi.' }
  }

  const p = opts.plan ?? PRO_PLAN

  try {
    const res = await fetch(`${XENDIT_BASE}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${key}:`).toString('base64'),
      },
      body: JSON.stringify({
        external_id: opts.externalId,
        amount: p.priceIdr,
        currency: 'IDR',
        description: p.label,
        payer_email: opts.email,
        invoice_duration: p.invoiceDurationSec,
        success_redirect_url: opts.successRedirectUrl,
      }),
    })

    if (!res.ok) {
      console.error('[billing] xendit create invoice failed:', res.status, await res.text().catch(() => ''))
      return { ok: false, reason: 'GATEWAY_ERROR', message: 'Gagal membuat pembayaran. Coba lagi nanti.' }
    }

    const json: { id?: string; invoice_url?: string } = await res.json()
    if (!json.invoice_url || !json.id) {
      return { ok: false, reason: 'GATEWAY_ERROR', message: 'Respon gateway tidak lengkap. Coba lagi nanti.' }
    }
    return { ok: true, paymentUrl: json.invoice_url, gatewayRef: json.id }
  } catch (err: unknown) {
    console.error('[billing] xendit request failed:', (err as Error)?.message)
    return { ok: false, reason: 'GATEWAY_ERROR', message: 'Gagal menghubungi payment gateway.' }
  }
}

/**
 * Create a Midtrans SNAP transaction (payment page link).
 */
export async function createMidtransTransaction(opts: {
  externalId: string
  email: string
  plan?: PlanItem
  successRedirectUrl: string
}): Promise<PaymentResult> {
  const key = process.env.MIDTRANS_SERVER_KEY
  if (!key) {
    return { ok: false, reason: 'PAYMENT_NOT_CONFIGURED', message: 'Payment gateway belum dikonfigurasi.' }
  }

  const p = opts.plan ?? PRO_PLAN

  try {
    const res = await fetch(`${MIDTRANS_BASE}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${key}:`).toString('base64'),
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: opts.externalId,
          gross_amount: p.priceIdr,
        },
        item_details: [
          { id: p.id, price: p.priceIdr, quantity: 1, name: p.label },
        ],
        customer_details: { email: opts.email },
        callbacks: { finish: opts.successRedirectUrl },
        expiry: { unit: 'day', duration: 3 },
      }),
    })

    if (!res.ok) {
      console.error('[billing] midtrans create transaction failed:', res.status, await res.text().catch(() => ''))
      return { ok: false, reason: 'GATEWAY_ERROR', message: 'Gagal membuat pembayaran. Coba lagi nanti.' }
    }

    const json: { token?: string; redirect_url?: string } = await res.json()
    if (!json.token || !json.redirect_url) {
      return { ok: false, reason: 'GATEWAY_ERROR', message: 'Respon gateway tidak lengkap. Coba lagi nanti.' }
    }
    return { ok: true, paymentUrl: json.redirect_url, gatewayRef: json.token }
  } catch (err: unknown) {
    console.error('[billing] midtrans request failed:', (err as Error)?.message)
    return { ok: false, reason: 'GATEWAY_ERROR', message: 'Gagal menghubungi payment gateway.' }
  }
}
