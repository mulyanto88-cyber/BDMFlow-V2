// ============================================================
// src/lib/billing.ts
// Server-only billing helpers + Xendit gateway client.
//
// The gateway specifics are isolated here: swapping to Midtrans later
// means replacing the two fetch wrappers, not the routes.
//
// Env vars (server-side only):
//   XENDIT_API_KEY       — API key from Xendit dashboard
//   XENDIT_WEBHOOK_TOKEN — webhook verification token (same value
//                          entered in the Xendit dashboard callback config)
// ============================================================
import { timingSafeEqual } from 'crypto'

export const PRO_PLAN = {
  id: 'pro_monthly',
  priceIdr: 55_000,
  months: 1,
  label: 'BDMFlow Pro — 1 bulan',
  invoiceDurationSec: 3 * 24 * 3600, // 3 days to pay before it expires
}

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
  eventId: string
  status: string
  externalId: string | null
  amount: number
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
    amount: Number(b.amount ?? 0),
  }
}

// ── Xendit client ───────────────────────────────────────────────────────────

const API_BASE = process.env.XENDIT_API_BASE ?? 'https://api.xendit.co'

export type CreateInvoiceResult =
  | { ok: true; invoiceUrl: string; invoiceId: string }
  | { ok: false; reason: 'PAYMENT_NOT_CONFIGURED' | 'GATEWAY_ERROR'; message: string }

/**
 * Create a Xendit invoice (payment page link). The caller persists a
 * billing_invoices row first so the webhook can map external_id → user.
 */
export async function createXenditInvoice(opts: {
  externalId: string
  email: string
  successRedirectUrl: string
}): Promise<CreateInvoiceResult> {
  const key = process.env.XENDIT_API_KEY
  if (!key) {
    return { ok: false, reason: 'PAYMENT_NOT_CONFIGURED', message: 'Payment gateway belum dikonfigurasi.' }
  }

  try {
    const res = await fetch(`${API_BASE}/v2/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`${key}:`).toString('base64'),
      },
      body: JSON.stringify({
        external_id: opts.externalId,
        amount: PRO_PLAN.priceIdr,
        currency: 'IDR',
        description: PRO_PLAN.label,
        payer_email: opts.email,
        invoice_duration: PRO_PLAN.invoiceDurationSec,
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
    return { ok: true, invoiceUrl: json.invoice_url, invoiceId: json.id }
  } catch (err: unknown) {
    console.error('[billing] xendit request failed:', (err as Error)?.message)
    return { ok: false, reason: 'GATEWAY_ERROR', message: 'Gagal menghubungi payment gateway.' }
  }
}
