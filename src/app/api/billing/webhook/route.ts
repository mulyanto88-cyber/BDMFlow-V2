// /api/billing/webhook — gateway payment callback.
//
// Xendit POSTs the invoice event to this URL. Security model:
//   1. The `x-callback-token` header must match XENDIT_WEBHOOK_TOKEN
//      (constant-time compare).
//   2. Identity comes from billing_invoices (external_id → user), which
//      only this app can write — never from the gateway payload.
//   3. billing_webhooks is the idempotency ledger: the same event id is
//      processed exactly once, so a retried callback can't double-extend
//      a subscription.
import { NextRequest, NextResponse } from 'next/server'
import { getAdmin } from '@/lib/auth-server'
import { verifyCallbackToken, parseWebhookEvent } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-callback-token')
  if (!verifyCallbackToken(token, process.env.XENDIT_WEBHOOK_TOKEN ?? null)) {
    console.warn('[billing] webhook rejected: invalid or missing callback token')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const ev = parseWebhookEvent(body)
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

  if (!ev.externalId) {
    return NextResponse.json({ ok: true, skipped: 'no external_id' })
  }

  // Find the invoice we created at checkout.
  const { data: invoice, error: invErr } = await admin
    .from('billing_invoices')
    .select('user_id, status')
    .eq('external_id', ev.externalId)
    .single()
  if (invErr || !invoice) {
    console.warn('[billing] webhook for unknown external_id:', ev.externalId)
    return NextResponse.json({ ok: true, skipped: 'unknown invoice' })
  }
  if (invoice.status === 'PAID') {
    // Already applied (e.g. re-delivered event with a fresh id) — no-op.
    return NextResponse.json({ ok: true, alreadyPaid: true })
  }

  if (ev.status === 'PAID') {
    // One atomic window extension: stack on an active window, else start
    // from now. SQL-side so retries can't double-extend.
    const { error: updErr } = await admin
      .from('billing_invoices')
      .update({ status: 'PAID', paid_at: new Date().toISOString(), gateway_invoice_id: ev.eventId })
      .eq('external_id', ev.externalId)
    if (updErr) {
      console.error('[billing] invoice update failed:', updErr.message)
      return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }

    const { data: rows, error: profErr } = await admin.rpc('grant_pro_subscription', {
      p_user_id: invoice.user_id,
      p_months: 1,
    })
    if (profErr) {
      console.error('[billing] grant_pro_subscription failed:', profErr.message)
      return NextResponse.json({ error: 'Grant failed' }, { status: 500 })
    }
    void rows
  } else {
    // EXPIRED / FAILED — just record the terminal state on the invoice.
    await admin
      .from('billing_invoices')
      .update({ status: ev.status })
      .eq('external_id', ev.externalId)
      .neq('status', 'PAID')
  }

  return NextResponse.json({ ok: true })
}
