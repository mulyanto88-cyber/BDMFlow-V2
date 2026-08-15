// /api/billing/checkout — create a payment for the Pro plan.
//
// POST (bearer token). Returns the Xendit invoice URL the client
// redirects to. No gateway configured yet? Returns 503 with a clear
// message so the UI can say "pembayaran segera hadir" instead of
// breaking.
import { NextRequest, NextResponse } from 'next/server'
import { getViewer, getAdmin } from '@/lib/auth-server'
import { rateLimit, clientKey } from '@/lib/rate-limit'
import { createPayment, PRO_PLAN } from '@/lib/billing'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const viewer = await getViewer(req)
  if (!viewer.userId) {
    return NextResponse.json({ error: 'Login diperlukan untuk melanjutkan pembayaran.' }, { status: 401 })
  }

  const rl = rateLimit(clientKey(req, viewer.userId), 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const admin = getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Server belum dikonfigurasi.' }, { status: 500 })
  }

  // Email comes from the profile (server-side), never from the client.
  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('id', viewer.userId)
    .single()

  const email = profile?.email ?? ''

  // Our id → user mapping lives in billing_invoices so the webhook never
  // trusts identity from the gateway payload.
  const externalId = `bdm-${viewer.userId.slice(0, 8)}-${Date.now()}`
  const { error: insertErr } = await admin.from('billing_invoices').insert({
    external_id: externalId,
    user_id: viewer.userId,
    amount: PRO_PLAN.priceIdr,
    status: 'PENDING',
  })
  if (insertErr) {
    console.error('[billing] invoice insert failed:', insertErr.message)
    return NextResponse.json({ error: 'Gagal membuat pembayaran. Coba lagi nanti.' }, { status: 500 })
  }

  const origin = new URL(req.url).origin
  const result = await createPayment({
    externalId,
    email,
    successRedirectUrl: `${origin}/pricing?paid=1`,
  })

  if (!result.ok) {
    // Don't leave a dangling PENDING row when no invoice exists.
    if (result.reason === 'PAYMENT_NOT_CONFIGURED') {
      await admin.from('billing_invoices').delete().eq('external_id', externalId)
      return NextResponse.json(
        { error: result.message, notConfigured: true },
        { status: 503 },
      )
    }
    await admin
      .from('billing_invoices')
      .update({ status: 'FAILED' })
      .eq('external_id', externalId)
    return NextResponse.json({ error: result.message }, { status: 502 })
  }

  return NextResponse.json({
    paymentUrl: result.paymentUrl,
    amount: PRO_PLAN.priceIdr,
    planLabel: PRO_PLAN.label,
  })
}
