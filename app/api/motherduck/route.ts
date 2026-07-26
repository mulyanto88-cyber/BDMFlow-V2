export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { run } from '@/lib/db'
import { getQuery, validateParams } from '@/lib/query-registry'
import { getViewer, shouldBlockPro } from '@/lib/auth-server'
import { rateLimit, clientKey } from '@/lib/rate-limit'

// This endpoint used to execute arbitrary SQL supplied by the browser, which made
// the entire dataset scrapeable by anyone and leaked the schema into the JS
// bundle. It now runs only named queries defined server-side in query-registry.ts;
// callers choose an id, never the SQL.

const LIMIT = 120          // requests
const WINDOW_MS = 60_000   // per minute

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(req: NextRequest) {
  const viewer = await getViewer(req)

  const rl = rateLimit(clientKey(req, viewer.userId), LIMIT, WINDOW_MS)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON tidak valid.' }, { status: 400 })
  }

  const { id, params } = (body ?? {}) as { id?: unknown; params?: unknown }

  if (typeof id !== 'string' || !id) {
    return NextResponse.json({ error: 'Parameter "id" diperlukan.' }, { status: 400 })
  }

  const def = getQuery(id)
  if (!def) {
    return NextResponse.json({ error: 'Query tidak dikenal.' }, { status: 404 })
  }

  const args = params === undefined ? [] : params
  if (!Array.isArray(args)) {
    return NextResponse.json({ error: 'Parameter "params" harus berupa array.' }, { status: 400 })
  }

  const invalid = validateParams(def, args)
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 })
  }

  if (def.pro && shouldBlockPro(viewer)) {
    return NextResponse.json(
      { error: 'Fitur Pro. Silakan upgrade untuk mengakses data ini.', upgrade: true },
      { status: 402 },
    )
  }

  try {
    const data = await run(def.sql, args as unknown[])
    return NextResponse.json({ data })
  } catch (error: unknown) {
    // Log server-side; return a generic message so DB internals stay private.
    console.error('[motherduck]', id, (error as Error)?.message)
    return NextResponse.json({ error: 'Query gagal dijalankan.' }, { status: 500 })
  }
}
