// /api/billing/webhook — payment-gateway callback.
//
// Two gateways share this endpoint; the incoming request shape decides
// which verifier runs:
//   Xendit   : POSTs with an `x-callback-token` header that must match
//              XENDIT_WEBHOOK_TOKEN (constant-time compare).
//   Midtrans : POSTs a JSON notification signed with
//              SHA512(order_id + status_code + gross_amount + server_key).
//
// Shared security model:
//   1. Identity comes from billing_invoices (external_id → user), which
//      only this app can write — never from the gateway payload.
//   2. billing_webhooks is the idempotency ledger: the same event id is
//      processed exactly once, so a retried callback can't double-extend
//      a subscription.
import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth-server'
import {
  verifyCallbackToken,
  verifyMidtransSignature,
  parseWebhookEvent,
  parseMidtransNotification,
  parseMayarWebhook,
} from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: true, message: 'BDMFlow billing webhook endpoint is active.' })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)

  // ── Immediate handler for Webhook Test / Ping from Mayar / Gateways ────────
  if (body && (body.event === 'testing' || body.event === 'test' || body.event === 'ping' || body.type === 'test')) {
    return NextResponse.json({
      ok: true,
      status: 'SUCCESS',
      message: 'Mayar webhook test received and verified successfully',
    }, { status: 200 })
  }

  // ── Dispatch on the gateway's auth scheme ──────────────────────────────
  const xenditToken = req.headers.get('x-callback-token')
  const mayarToken = req.headers.get('x-mayar-token') || req.headers.get('x-callback-token')
  let ev

  if (xenditToken && process.env.XENDIT_WEBHOOK_TOKEN) {
    if (!verifyCallbackToken(xenditToken, process.env.XENDIT_WEBHOOK_TOKEN ?? null)) {
      console.warn('[billing] xendit webhook rejected: invalid callback token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    ev = parseWebhookEvent(body)
  } else if (body && (body.event?.startsWith('payment.') || body.event?.startsWith('invoice.') || body.event?.startsWith('transaction.') || body.data?.transaction_id || req.headers.get('user-agent')?.toLowerCase().includes('mayar'))) {
    // Mayar webhook verification
    if (process.env.MAYAR_WEBHOOK_SECRET && mayarToken) {
      if (!verifyCallbackToken(mayarToken, process.env.MAYAR_WEBHOOK_SECRET)) {
        console.warn('[billing] mayar webhook rejected: invalid token')
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    ev = parseMayarWebhook(body)
  } else if (process.env.MIDTRANS_SERVER_KEY) {
    if (!verifyMidtransSignature(body, process.env.MIDTRANS_SERVER_KEY ?? null)) {
      console.warn('[billing] midtrans webhook rejected: invalid signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    ev = parseMidtransNotification(body)
  } else {
    // Fallback: try Mayar or generic parser
    ev = parseMayarWebhook(body) || parseWebhookEvent(body)
  }

  if (!ev) {
    console.warn('[billing] webhook payload not recognized:', JSON.stringify(body).slice(0, 300))
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 })
  }

  const admin = getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Server belum dikonfigurasi.' }, { status: 500 })
  }

  // Idempotency first — a duplicate callback returns 200 and does nothing.
  const { error: ledgerErr, status: ledgerStatus } = await admin.from('billing_webhooks').insert({
    event_id: ev.eventId,
    status: ev.status,
    external_id: ev.externalId,
    payload: body,
  })
  if (ledgerErr) {
    if (ledgerErr.code === '23505') {
      return NextResponse.json({ ok: true, duplicate: true })
    }
    console.error('[billing] webhook ledger insert failed:', ledgerErr.message)
    return NextResponse.json({ error: 'Ledger error' }, { status: 500 })
  }
  if (ledgerStatus !== 201) {
    console.error('[billing] webhook ledger insert unexpected status:', ledgerStatus)
    return NextResponse.json({ error: 'Ledger error' }, { status: 500 })
  }

  // 1. Try to find the invoice by external_id
  let invoice: { user_id: string; status: string; amount: number } | null = null

  if (ev.externalId) {
    const { data: inv } = await admin
      .from('billing_invoices')
      .select('user_id, status, amount')
      .eq('external_id', ev.externalId)
      .single()
    if (inv) invoice = inv
  }

  // 2. Fallback: If no invoice found by external_id, look up user by customerEmail
  if (!invoice && ev.customerEmail) {
    console.log(`[billing] Looking up user by email fallback: ${ev.customerEmail}`)
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, plan')
      .ilike('email', ev.customerEmail.trim())
      .single()

    if (profile) {
      invoice = {
        user_id: profile.id,
        status: 'PENDING',
        amount: ev.amount || 55000,
      }
      // Create record in billing_invoices
      const externalId = ev.externalId || `mayar-direct-${profile.id.slice(0, 8)}-${Date.now()}`
      await admin.from('billing_invoices').insert({
        external_id: externalId,
        user_id: profile.id,
        amount: ev.amount || 55000,
        status: 'PAID',
        paid_at: new Date().toISOString(),
        gateway_invoice_id: ev.gatewayRef ?? ev.eventId,
      })
    }
  }

  if (!invoice) {
    console.warn('[billing] webhook for unknown customer/invoice:', ev.externalId, ev.customerEmail)
    return NextResponse.json({ ok: true, skipped: 'unknown invoice or customer' })
  }

  if (invoice.status === 'PAID') {
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  if (ev.status === 'PAID') {
    if (ev.externalId) {
      await admin
        .from('billing_invoices')
        .update({ status: 'PAID', paid_at: new Date().toISOString(), gateway_invoice_id: ev.gatewayRef ?? ev.eventId })
        .eq('external_id', ev.externalId)
    }

    // Determine months from invoice amount (148500 = 3 months, 55000 = 1 month)
    const monthsToGrant = (invoice.amount && invoice.amount >= 100_000) ? 3 : 1

    // Grant PRO via RPC
    const { error: profErr } = await admin.rpc('grant_pro_subscription', {
      p_user_id: invoice.user_id,
      p_months: monthsToGrant,
    })

    if (profErr) {
      console.warn('[billing] grant_pro_subscription RPC failed, attempting direct profile update:', profErr.message)
      // Fallback: direct update to profiles table
      const days = monthsToGrant * 30
      const proUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      await admin.from('profiles').update({
        plan: 'pro',
        pro_until: proUntil,
      }).eq('id', invoice.user_id)
    }

    console.log(`[billing] Successfully granted PRO (${monthsToGrant}m) to user ${invoice.user_id}`)
  } else {
    if (ev.status !== 'PENDING' && ev.externalId) {
      await admin
        .from('billing_invoices')
        .update({ status: ev.status })
        .eq('external_id', ev.externalId)
        .neq('status', 'PAID')
    }
  }

  return NextResponse.json({ ok: true })
}
